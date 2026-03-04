# Pitfalls Research

**Domain:** html2canvas image generation + JSZip batch export in Next.js/React
**Researched:** 2026-03-04
**Confidence:** HIGH (critical pitfalls verified via official GitHub issues and library docs; implementation-specific pitfalls derived from direct codebase analysis)

---

## Critical Pitfalls

### Pitfall 1: CSS Custom Properties (Variables) Not Resolved by html2canvas

**What goes wrong:**
The card design system relies entirely on CSS custom properties (`--color-primary`, `--bg-color`, `--font-family`, etc.) set via `getCardStyle()` in `types.ts`. When html2canvas captures the element, it reads computed styles — but CSS variables themselves are not directly supported by html2canvas's CSS parser. The result is a canvas where all color and font styling is missing: cards export as white rectangles with black system-font text.

**Why it happens:**
html2canvas re-implements CSS parsing from scratch and manually maps each CSS property. CSS custom properties (`var()`) require the browser's own resolution pass before values are available. html2canvas's parser sees `var(--color-primary)` and does not resolve it through the cascade — it either ignores the value or treats it as invalid. This is a documented limitation confirmed in html2canvas GitHub issue #1994.

In `CardRenderer.tsx`, the entire styling pipeline flows through CSS variables:
```tsx
// These become `var(--color-primary)` in HTML — html2canvas won't resolve them
className="text-[var(--color-primary)]"
style={cardStyle}  // { '--color-primary': '#3b82f6', ... }
```

**How to avoid:**
Before calling html2canvas, use the `onclone` callback to walk the cloned DOM and replace all CSS variable references with their computed values:
```typescript
onclone: (clonedDoc) => {
  const el = clonedDoc.querySelector('[data-card-root]');
  if (el) {
    const computed = getComputedStyle(el);
    (el as HTMLElement).style.backgroundColor = computed.backgroundColor;
    (el as HTMLElement).style.color = computed.color;
    // ... resolve all vars
  }
}
```
Alternatively, compute the full style object in JavaScript before render and apply it as explicit inline styles to the cloned element. The `DesignToken` object already contains the raw hex values — use those directly in the `onclone` handler instead of re-reading from CSS.

**Warning signs:**
- Preview in browser looks correct but downloaded PNG is white/unstyled
- All cards export identically regardless of the active design token
- Browser DevTools shows `var(--color-primary)` in computed styles but the PNG shows `#000000` or `transparent`

**Phase to address:**
Image Output implementation phase (Stage 4 core). Must be solved before any export can be considered correct.

---

### Pitfall 2: CSS transform: scale() on Preview Elements Breaks Capture Geometry

**What goes wrong:**
`DesignOrchestration.tsx` applies `style={{ transform: 'scale(0.25)' }}` to each card wrapper for the grid preview. When html2canvas captures a ref pointing to the `CardRenderer` div (which is `1080×1350px`), the library captures the element at its CSS-transformed size, not its intrinsic size. The result is a canvas that is roughly `270×338px` (25% of full size) rather than `1080×1350px`, or the element is clipped to only the visible viewport region.

This is confirmed as a longstanding html2canvas behavior: css transform scale does not affect the reported `offsetWidth`/`offsetHeight`, but does affect what html2canvas actually rasterizes. The export image will be the wrong dimensions and/or show clipped content.

**Why it happens:**
The `refs` are attached directly to the scaled `CardRenderer` element. html2canvas reads the element's layout geometry including any inherited transform from parent containers. The scaled container collapses the coordinate space. html2canvas GitHub issue #807 and #1524 document this as a known transform limitation.

**How to avoid:**
Two valid approaches:

Option A — Render an off-screen, unscaled clone for export only:
```typescript
// Create a hidden 1:1 scale container positioned off-screen
// Render all cards there and capture from that container
// The visible grid is still the scaled preview
```

Option B — Reset the transform in `onclone`:
```typescript
onclone: (clonedDoc) => {
  const wrapper = clonedDoc.querySelector('.card-wrapper');
  if (wrapper) (wrapper as HTMLElement).style.transform = 'none';
}
```
Option B is simpler but risks missing other inherited transforms. Option A is more reliable.

**Warning signs:**
- Exported PNG is `270×338px` instead of `1080×1350px`
- The correct dimensions appear in `canvas.width`/`canvas.height` in DevTools but the image content is zoomed out
- Correct pixel dimensions appear only when the browser zoom level is at exactly 100%

**Phase to address:**
Image Output implementation phase. Must be resolved before export is usable. Determines the core capture strategy.

---

### Pitfall 3: Card Refs Are Null or Point to Stale Elements at Download Time

**What goes wrong:**
In `DesignOrchestration.tsx`, `cardRefs.current` is populated via `handleSetCardRef(card.order)` callbacks attached to `forwardRef`-wrapped `CardRenderer` instances. If the user triggers "Download All" before all cards have mounted (e.g., during initial render, or after a card update triggers re-render), some refs will be `null`. The current `DownloadControls` code skips `null` elements (`if (!element) continue`), silently omitting cards from the ZIP without any error to the user.

Additionally, since `cardElements` is computed inline during each render using `cards.map((card, index) => ({ element: cardRefs.current[index], ... }))`, the index mapping uses the unsorted `cards` array, while the rendered grid uses `sortedCards`. If card ordering changes, `cardRefs.current[index]` may point to the wrong card's DOM node.

**Why it happens:**
React's ref assignment is synchronous during commit but the `cardRefs.current` array is managed manually. The ref callback `handleSetCardRef(card.order)` uses `card.order` as the index, while `cardElements` mapping uses the array index. If `card.order` values are non-contiguous (e.g., 0, 2, 3 after a card deletion in the structure review phase), `cardRefs.current` will have holes and the index mapping will be wrong.

**How to avoid:**
Use a `Map<string, HTMLDivElement>` keyed by a stable card identifier (e.g., `card.type + '-' + card.order`) instead of an array indexed by position. Verify all refs are populated before enabling the download button, and show a clear count of ready cards:
```typescript
const cardRefMap = useRef<Map<string, HTMLDivElement | null>>(new Map());
// ref: (el) => cardRefMap.current.set(`${card.type}-${card.order}`, el)
```

**Warning signs:**
- ZIP downloads with fewer files than expected cards
- Some downloaded images are blank (captured wrong element)
- No error shown to user when cards are silently skipped

**Phase to address:**
Image Output implementation phase. Ref management strategy must be established when the capture architecture is designed, not patched after.

---

### Pitfall 4: Accumulated Canvas Memory During Batch ZIP Export

**What goes wrong:**
`downloadAllCardsAsZip()` in `DownloadControls.tsx` calls `html2canvas()` in a `for` loop, creating a new canvas for each card sequentially. With 8–12 cards at `scale: 2` (producing a `2160×2700px` canvas per card), each canvas holds approximately `2160 × 2700 × 4 bytes = ~23MB` of pixel data. For 12 cards this is ~280MB before JSZip begins compression. Chrome's garbage collector does not reliably collect canvas memory between iterations. The confirmed html2canvas GitHub issue #1609 documents that repeated calls accumulate memory.

In the worst case, the browser tab crashes mid-export with no error surfaced to the user, and the ZIP download never triggers.

**Why it happens:**
`HTMLCanvasElement` objects hold large `ArrayBuffer`s. The JavaScript engine cannot easily determine they are no longer needed until the next GC cycle. When multiple large canvases are alive simultaneously (even momentarily between iterations), total memory can spike.

**How to avoid:**
After converting each canvas to a Blob, explicitly null the canvas reference and call `canvas.width = 0; canvas.height = 0` to release GPU memory:
```typescript
const canvas = await html2canvas(element, options);
const blob = await canvasToBlob(canvas);
// Release canvas memory before next iteration
canvas.width = 0;
canvas.height = 0;
zip.file(filename, blob);
```
Additionally, add a small `await new Promise(r => setTimeout(r, 50))` between iterations to allow the GC to run. For 12 cards this adds ~600ms total — acceptable.

**Warning signs:**
- Browser tab becomes unresponsive during ZIP export
- Chrome task manager shows tab memory spike to 500MB+
- Export succeeds for small card sets (3–4 cards) but fails for full sets (8–12)
- No error shown; the download button simply never triggers

**Phase to address:**
Batch export implementation phase. Memory management strategy must be part of the initial implementation, not a later optimization.

---

### Pitfall 5: TextEditor Input Components Captured During Export When a Card Is Being Edited

**What goes wrong:**
`CardRenderer.tsx` contains `TextEditor` components that switch between display (`<h1>`, `<p>`) and edit (`<Input>`, `<Textarea>`) modes based on `isEditing` state. If the user is actively editing a card when they click "Download" or "Download All", html2canvas captures the Input/Textarea element instead of the styled text display. The export PNG will show a form input with a blue border (`border-[var(--color-accent)]`) where the headline should appear.

**Why it happens:**
Download is not gated on editing state. `isDownloading` prop in `DownloadControls` is not connected to the editing state managed by `DesignOrchestration`. There is no check that `editingCard === null` before triggering capture.

**How to avoid:**
1. Disable all download buttons when `editingCard !== null` in `DesignOrchestration`.
2. In the `onclone` callback, force-hide any `<input>` or `<textarea>` elements within the card clone and substitute the current text as a styled text node.
3. Optionally: programmatically call `handleFinishEdit()` before starting the export pipeline.

**Warning signs:**
- Exported card shows a border-outlined input box instead of styled text
- Export looks correct on the second click (after the user clicks away from the input first)
- Issue is intermittent because it only occurs when editing is active

**Phase to address:**
Image Output implementation phase. Guard should be added at the same time as the download trigger is wired.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip `onclone` cleanup — capture raw DOM as-is | Simpler implementation | CSS variable failure (Pitfall 1); editing mode capture (Pitfall 5) | Never |
| Use array index for ref mapping | Simple to write | Silent card omission or wrong-card export (Pitfall 3) | Never |
| Keep `scale: 2` without canvas memory release | Correct output quality | Browser crash on 8+ cards (Pitfall 4) | Never for batch; OK for single-card download |
| Capture the scaled preview element directly | No extra DOM needed | Wrong output dimensions (Pitfall 2) | Never |
| Sequential `for` loop without `await setTimeout` | Slightly faster | No GC opportunity between captures; memory accumulation (Pitfall 4) | Only if card count is guaranteed ≤ 4 |

---

## Integration Gotchas

Common mistakes when connecting html2canvas and JSZip to the existing app.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| html2canvas + Next.js 15 | Importing html2canvas at module level in a file without `'use client'` causes `window is not defined` during SSR prerender build | Ensure `'use client'` is the first line in any file that imports html2canvas; or use dynamic import with `{ ssr: false }` if lazy loading is preferred |
| html2canvas + Tailwind v3 | Using `oklch()` color functions (common in shadcn/ui default palette) causes `Attempting to parse an unsupported color function "oklch"` errors | This project uses Tailwind v3 with hex-defined design tokens, which is safe. If shadcn default colors (e.g., `bg-primary`) are used in card content, verify those resolve to hex/rgb in computed styles |
| html2canvas + CSS transform scale | Capturing a ref directly on a transformed element | Capture from an off-screen, unscaled container or reset transform in `onclone` (Pitfall 2) |
| JSZip + large canvas blobs | Passing all blobs to JSZip before calling `generateAsync` holds all data in memory simultaneously | Process cards sequentially: generate blob, add to zip, release canvas, then next card |
| html2canvas + `forwardRef` | `ref.current` accessed immediately after render without waiting for mount | Only access refs in event handlers (button click) — refs are guaranteed populated after mount; never access during render phase |
| DownloadControls + edit state | `isDownloading` prop does not reflect `editingCard` state from parent | Thread editing state to DownloadControls or lift download trigger to parent where both states are visible |

---

## Performance Traps

Patterns that work at small scale but fail as card count grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No canvas memory release between batch captures | Tab crash mid-export, memory spike visible in task manager | `canvas.width = 0; canvas.height = 0` after blob conversion; `setTimeout(0)` between iterations | Reliably at 8+ cards with `scale: 2` on machines with <4GB available RAM |
| Capturing scaled preview elements (25% scale) | 270×338px output instead of 1080×1350px | Capture from off-screen unscaled clone | Immediately — every export is wrong |
| Generating all PNGs before starting ZIP compression | Peak memory = all cards × canvas size | Sequential: generate PNG → add to ZIP → release → next card | At 8 cards: ~280MB peak; at 20 cards: ~700MB peak |
| Using `scale: 3` instead of `scale: 2` | Excellent quality but crashes on any card count | Keep `scale: 2`; the target is Instagram (screen display), not print | At `scale: 3`, each 1080×1350 canvas is 3240×4050 = ~52MB; 8 cards = 416MB before GC |

---

## Security Mistakes

Domain-specific security issues for client-side image generation.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using `allowTaint: true` in html2canvas options | Silently taints the canvas; `toBlob()` throws SecurityError if any cross-origin image was drawn, crashing the export with no user-visible message | Use `allowTaint: false` (current default in `DownloadControls.tsx` — already correct); ensure all card content is text-only, no `<img>` tags from external URLs |
| User-uploaded reference image passed directly to html2canvas | If a user uploads a cross-origin image URL (not base64), the canvas taints | Always convert uploaded images to base64 Data URLs before render; `ImageUpload.tsx` already does this — maintain this pattern |
| Storing the generated PNG in component state as a Data URL | Large Data URLs (~3MB per card) in React state trigger unnecessary re-renders and increase memory pressure | Use Blob/object URLs for transient data; only store in state if preview display requires it |

---

## UX Pitfalls

Common user experience mistakes in batch image export flows.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progress indicator during batch export | User sees frozen UI for 5-15 seconds per card set; assumes app has crashed | Already partially addressed with `downloadProgress` state in `DownloadControls.tsx`; ensure progress updates after each card, not just at end |
| Download button active when editing is in progress | User exports a card with an input box visible | Disable download buttons while `editingCard !== null`; show tooltip "Finish editing before downloading" |
| No feedback when a card ref is null and silently skipped | User downloads ZIP expecting 10 PNGs, gets 8, never knows why | Validate all refs before export starts; show count "10/10 cards ready" or block download with specific message |
| Blocking UI during sequential export | All cards are captured synchronously; browser freezes for several seconds | Batch runs are sequential but the UI should show per-card progress; consider a non-blocking approach with `requestIdleCallback` |
| ZIP filename is always `card-news.zip` | User exports multiple times; files overwrite | Append a timestamp: `card-news-${Date.now()}.zip` |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **CSS variable resolution:** Preview looks correct in browser — verify the PNG export actually contains styled colors (not white/transparent backgrounds)
- [ ] **Scale factor:** `scale: 2` in options appears to produce high quality — verify actual canvas dimensions are `2160×2700`, not `270×337` (preview scale bleeding in)
- [ ] **All cards in ZIP:** ZIP appears to download — verify it contains the correct number of files and each is the correct card (not duplicates or the wrong card)
- [ ] **Edit mode cleared before export:** Download button works — verify that clicking download while a TextEditor is in edit mode does not capture the input element
- [ ] **Memory release:** Batch export completes for 3 cards — test with the full 8-12 card set before declaring done
- [ ] **Export-hidden elements:** `hideUI` prop passed correctly — verify PNG does not contain the Badge overlay, order indicators, or edit controls (`.export-hidden` class selector in `onclone` must match actual class names)
- [ ] **No window reference at build time:** Development mode works — run `next build` and verify no `window is not defined` prerender errors
- [ ] **Filename ordering:** Individual card PNGs named by type/order — verify cover is `card-cover.png`, body cards are `card-body-0.png`, `card-body-1.png`, etc. (current code uses `order` which may be 1-indexed vs 0-indexed inconsistency)

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| CSS variables missing from exports | MEDIUM | Add `onclone` handler that reads `DesignToken` from closure and applies values as explicit inline styles to cloned element; no architecture change needed |
| Wrong export dimensions from scaled capture | MEDIUM | Add off-screen render container (a fixed-position, opacity-0 div at full scale); redirect capture refs there; 1-2 hours of work |
| Ref index mismatch causing wrong cards | MEDIUM | Replace array-indexed refs with a `Map` keyed by card stable ID; requires refactoring `DesignOrchestration.tsx` ref management |
| Memory crash during batch export | LOW | Add canvas cleanup lines after each `toBlob()` call; 30 minutes to add and test |
| TextEditor input captured in export | LOW | Add `editingCard !== null` guard to download handlers; 15 minutes |
| Build error: window not defined | LOW | Add `'use client'` to affected file if missing, or wrap html2canvas import in `typeof window !== 'undefined'` check; 15 minutes |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| CSS custom properties not resolved (Pitfall 1) | Image Output — core capture implementation | Download a single card; open PNG in image viewer; confirm non-white background color matching the active design token |
| Transform scale corrupts capture geometry (Pitfall 2) | Image Output — core capture implementation | Check `canvas.width` and `canvas.height` in browser console during export; must be `2160` and `2700` |
| Null or mismatched card refs (Pitfall 3) | Image Output — ref architecture | Download ZIP with 10 cards; open ZIP; verify exactly 10 unique PNG files, each named correctly |
| Canvas memory accumulation crash (Pitfall 4) | Batch Export implementation | Run batch export 3 times consecutively; Chrome task manager memory should return to baseline between runs |
| TextEditor input captured in export (Pitfall 5) | Image Output — download guard | While editing card 1 headline, click Download Single; verify PNG shows styled text, not an input element |
| Build error from SSR import (integration) | First build verification | Run `next build`; zero errors |
| UX: no progress feedback (UX pitfall) | Batch Export implementation | Observe UI during 10-card ZIP export; progress bar must update after each card |
| ZIP filename collision (UX pitfall) | Batch Export implementation | Download ZIP twice; verify second file is not named identically or that browser prompts for save location |

---

## Sources

- html2canvas GitHub issue #1994 — CSS properties not rendered (confirmed CSS variable limitation): https://github.com/niklasvh/html2canvas/issues/1994
- html2canvas GitHub issue #807 — CSS transform scale does not affect capture geometry: https://github.com/niklasvh/html2canvas/issues/807
- html2canvas GitHub issue #1524 — CSS transform-scale bugs: https://github.com/niklasvh/html2canvas/issues/1524
- html2canvas GitHub issue #1609 — Calling html2canvas multiple times increases memory: https://github.com/niklasvh/html2canvas/issues/1609
- html2canvas GitHub issue #3269 — Tailwind CSS v4 oklch color parse error: https://github.com/niklasvh/html2canvas/issues/3269
- html2canvas GitHub issue #2015 — window is not defined error with Next.js: https://github.com/niklasvh/html2canvas/issues/2015
- html2canvas FAQ (official, confirmed CSS limitations): https://html2canvas.hertzen.com/faq.html
- JSZip limitations documentation: https://stuk.github.io/jszip/documentation/limitations.html
- JSZip GitHub issue #135 — RAM consumption with large file sets: https://github.com/Stuk/jszip/issues/135
- Codebase direct analysis — `DesignOrchestration.tsx`, `CardRenderer.tsx`, `DownloadControls.tsx`, `types.ts` (2026-03-04)

---
*Pitfalls research for: html2canvas + JSZip export in Next.js 15 / React 19 card news app*
*Researched: 2026-03-04*
