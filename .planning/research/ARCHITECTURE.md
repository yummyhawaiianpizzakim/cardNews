# Architecture Research

**Domain:** Client-side image generation and batch export in a Next.js 15 + React 19 pipeline
**Researched:** 2026-03-04
**Confidence:** HIGH (based on direct codebase inspection + verified html2canvas/jszip docs)

---

## Standard Architecture

### System Overview: Current State (What Already Exists)

The pipeline has four stages. Stage 4 infrastructure is substantially built but has integration gaps.

```
app/card-news/page.tsx  (orchestrator)
│
├── Stage 1: ResearchForm → POST /api/anthropic → CardNewsList
├── Stage 2: QualityLoop (client Claude calls) → EvaluationSystem hook
├── Stage 3: StructureReview (client Claude calls) → StructureSystem hook
│
└── Stage 4: DesignOrchestration  [PARTIALLY INTEGRATED]
    ├── design/
    │   ├── ImageUpload          (reference image upload → base64)
    │   ├── DesignTokenExtractor (Claude Vision → DesignToken JSON)
    │   └── DesignTokenSystem    (state hook: phase, token, error)
    │
    └── output/
        ├── CardRenderer  (1080×1350px div, forwardRef, CSS vars, hideUI prop)
        ├── CardGrid      (scaled grid preview — NOT wired to download refs)
        ├── TextEditor    (inline headline/subtext editor)
        └── DownloadControls (html2canvas capture + JSZip batch export)
```

### Stage 4 Component Responsibilities

| Component | File | Responsibility | Status |
|-----------|------|----------------|--------|
| `DesignOrchestration` | `design/DesignOrchestration.tsx` | Orchestrates image upload, token extraction, card grid, download | EXISTS — is the integration point |
| `ImageUpload` | `design/ImageUpload.tsx` | File input, base64 conversion, preview | EXISTS — has API mismatch |
| `DesignTokenExtractor` | `design/DesignTokenExtractor.tsx` | Claude Vision call → DesignToken JSON | EXISTS — works correctly |
| `DesignTokenSystem` | `design/DesignTokenSystem.tsx` | State hook: phase, token, error | EXISTS — clean |
| `CardRenderer` | `output/CardRenderer.tsx` | 1080×1350px div with CSS var styling, forwardRef | EXISTS — core render target |
| `TextEditor` | `output/TextEditor.tsx` | Click-to-edit headline/subtext | EXISTS — works |
| `CardGrid` | `output/CardGrid.tsx` | Scaled grid preview with editing | EXISTS — not used (inline duplicate in DesignOrchestration) |
| `DownloadControls` | `output/DownloadControls.tsx` | html2canvas capture, JSZip batch, saveAs download | EXISTS — has ref capture gap |

---

## Recommended Project Structure (New Files Only)

No new files are required. All Stage 4 components exist. Work is integration and bug-fixing:

```
components/card-news/
├── design/
│   ├── DesignOrchestration.tsx  [MODIFY — fix ref passing and ImageUpload mismatch]
│   └── ImageUpload.tsx          [MODIFY — fix onAnalyze signature: remove DesignToken param]
│
└── output/
    ├── CardRenderer.tsx         [VERIFY — CSS variable rendering with html2canvas]
    └── DownloadControls.tsx     [MODIFY — fix lazy import for Next.js SSR safety]
```

### Structure Rationale

- **No new subdirectory needed** — `design/` holds AI-assisted design extraction; `output/` holds rendering and export. The separation is correct and should stay.
- **`CardGrid.tsx` is dead code** — `DesignOrchestration` inlines an identical grid. Either use `CardGrid` or delete it; having both creates drift risk.

---

## Architectural Patterns

### Pattern 1: forwardRef for html2canvas Capture Targets

**What:** `CardRenderer` uses `forwardRef<HTMLDivElement>`. The parent (`DesignOrchestration`) collects refs into `cardRefs.current[]`. `DownloadControls` receives these as `cards[].element`. html2canvas then captures each `HTMLElement` directly.

**When to use:** Always, for any component that must be captured by html2canvas. The ref must point to the actual 1080×1350px DOM node, not a scaled container.

**Trade-offs:** Refs cannot be passed through normal prop chains without forwardRef. Scaling via CSS `transform` on a wrapper div does not affect the underlying element's DOM dimensions, so refs stay valid for full-resolution capture.

**Current implementation:**

```typescript
// DesignOrchestration.tsx — correct pattern
const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

const handleSetCardRef = useCallback(
  (index: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[index] = el;
  },
  []
);

// Passed to CardRenderer, which is inside the scaled wrapper
<div style={{ transform: `scale(${scale})` }}>   // visual scaling only
  <CardRenderer ref={handleSetCardRef(card.order)} ... />  // ref = real 1080×1350 element
</div>
```

**Critical detail:** The ref is attached to `CardRenderer` (the 1080×1350 div), NOT to the scaled wrapper. html2canvas captures the element at its real CSS dimensions (1080×1350px), ignoring the parent transform. This is correct behavior.

---

### Pattern 2: Lazy Import of html2canvas in Next.js

**What:** html2canvas is a browser-only library. Importing it at module top-level causes SSR errors in Next.js because the server attempts to execute it without DOM access.

**When to use:** Any component that imports html2canvas must either be marked `'use client'` AND use dynamic import inside the async function, or use `next/dynamic` with `ssr: false`.

**Trade-offs:** Dynamic import adds a small first-use latency (~50ms). This is acceptable since download is always user-triggered.

**Current implementation (DownloadControls.tsx) has a problem:**

```typescript
// CURRENT — top-level import, will fail if component renders SSR
import html2canvas from 'html2canvas';
```

**Correct pattern:**

```typescript
// FIXED — lazy import inside async function
async function downloadCardAsPNG(element: HTMLElement, filename: string) {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(element, { ... });
  // ...
}
```

`DownloadControls.tsx` already has `'use client'` at the top which prevents SSR execution of the module. However, the static import still causes the build bundler to include html2canvas in the initial client bundle. The lazy import pattern reduces bundle size and prevents any edge-case hydration issues.

---

### Pattern 3: CSS Variables and html2canvas Compatibility

**What:** `CardRenderer` applies design tokens as CSS custom properties (`--color-primary`, `--bg-color`, etc.) via inline `style` on the root div. html2canvas must resolve these values when capturing.

**When to use:** This pattern works when CSS variables are set inline on the same element being captured. html2canvas resolves computed styles at capture time.

**Trade-offs:** CSS variables set via inline style on the captured element ARE resolved by html2canvas because it reads `getComputedStyle()`. Variables defined in `:root` or external stylesheets may not resolve in cloned documents. Since `getCardStyle()` returns them as inline styles on the card div itself, they will be inherited by children.

**Current implementation:**

```typescript
// types.ts — correct approach
export function getCardStyle(token: DesignToken): React.CSSProperties {
  return {
    '--color-primary': token.primaryColor,  // inline, on captured element
    '--bg-color': token.backgroundColor,
    // ...
  } as React.CSSProperties;
}
```

**Risk:** Tailwind utility classes like `text-[var(--color-primary)]` use the CSS variable in a class-level rule (not inline). This may not resolve in the cloned document that html2canvas creates. If colors appear wrong in exports, the fix is to convert computed values to direct inline styles before capture (use `getComputedStyle(element).getPropertyValue('--color-primary')` in the `onclone` callback).

---

### Pattern 4: Sequential html2canvas Calls for Batch Export

**What:** JSZip collects multiple PNG blobs and generates a single `.zip` download. Since html2canvas is CPU-intensive and serializes DOM reads, batch capture must be sequential (not parallel with `Promise.all`) to avoid browser jank and memory pressure.

**When to use:** Any batch export exceeding 3 images. For 2-3 images, parallel is acceptable.

**Trade-offs:** Sequential means the UI is blocked-feeling during export. The progress callback in `DownloadControls.downloadAllCardsAsZip()` mitigates this by updating a `Progress` component per card.

**Current implementation is correct:**

```typescript
// DownloadControls.tsx — correct sequential loop
for (let i = 0; i < cards.length; i++) {
  const canvas = await html2canvas(element, { scale: 2, ... });
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
  zip.file(`card-${typeLabel}.png`, blob);
  onProgress?.(i + 1, cards.length);
}
const content = await zip.generateAsync({ type: 'blob' });
saveAs(content, 'card-news.zip');
```

---

## Data Flow

### Stage 4 Complete Data Flow

```
approvedCards (CardNewsItem[]) from Stage 3
    │
    ▼
DesignOrchestration
    │
    ├── [User uploads image]
    │       ↓
    │   ImageUpload → base64 string
    │       ↓
    │   analyzeReferenceImage() → Claude Vision API
    │       ↓
    │   DesignToken JSON → useDesignTokenSystem().setDesignToken()
    │
    ├── [Cards rendered]
    │       ↓
    │   CardRenderer × N (1080×1350px, CSS vars from DesignToken)
    │       ↓  (forwardRef)
    │   cardRefs.current[0..N]  ← HTMLDivElement refs
    │
    └── [User clicks download]
            ↓
        DownloadControls receives cards[].element (HTMLElement refs)
            ↓
        html2canvas(element, { scale: 2, width: 1080, height: 1350 })
            ↓  (per card, sequential)
        canvas.toBlob() → Blob (PNG)
            ↓
        [Single] → saveAs(blob, 'card-{type}.png')
        [Batch]  → JSZip.file() × N → zip.generateAsync() → saveAs('card-news.zip')
```

### State Management for Stage 4

Stage 4 follows the same hook-per-system pattern as Stages 2 and 3:

```
useDesignTokenSystem()
    state: { phase, token, referenceImage, error }
    actions: setReferenceImage, setDesignToken, reset, setError

DesignOrchestration (local state)
    analyzing: boolean        — Claude Vision in flight
    editingCard: number|null  — which card has inline edit focus
    scale: number             — preview zoom (default 0.25)
    cardRefs: MutableRefObject<(HTMLDivElement|null)[]>  — export targets
```

Download progress state lives locally in `DownloadControls`:

```
downloadProgress: { current: number, total: number }
    — updated by onProgress callback during sequential loop
```

---

## Integration Points: New vs Modified

### What Exists and Is Correctly Integrated

| Item | Location | Integration Status |
|------|----------|--------------------|
| `DesignOrchestration` wired in page | `app/card-news/page.tsx` line 74 | DONE — receives `approvedCards` and `apiKey` |
| `CardRenderer` with forwardRef | `output/CardRenderer.tsx` | DONE — ref pattern is correct |
| `DownloadControls` with html2canvas + JSZip | `output/DownloadControls.tsx` | DONE — logic is correct |
| `DesignTokenSystem` hook | `design/DesignTokenSystem.tsx` | DONE — clean state management |
| Progress UI during batch export | `DownloadControls` `Progress` component | DONE |

### What Has Bugs or Integration Gaps

| Item | Location | Problem | Fix |
|------|----------|---------|----|
| `ImageUpload.onAnalyze` signature | `design/ImageUpload.tsx` line 11 | Prop typed `(base64, DesignToken)` but caller passes `null as any` for DesignToken | Remove DesignToken from signature; ImageUpload should only return base64 |
| `html2canvas` top-level import | `output/DownloadControls.tsx` line 7 | Static import causes bundler to include in initial chunk; edge case SSR risk | Change to `await import('html2canvas')` inside the async download functions |
| `CardGrid.tsx` unused | `output/CardGrid.tsx` | Identical grid is inlined in `DesignOrchestration`; two implementations diverge | Either adopt `CardGrid` in orchestration or delete it |
| CSS variable rendering in exported image | `output/CardRenderer.tsx` Tailwind classes | Classes like `text-[var(--color-primary)]` may not resolve in html2canvas cloned document | Add `onclone` callback to convert computed CSS var values to inline styles |
| `isDownloading` prop not connected | `DesignOrchestration.tsx` line 193 | `DownloadControls` receives `isDownloading={analyzing}` which reflects Vision API state, not download state | Add a `downloadingCards` state in `DesignOrchestration` and pass setter to `DownloadControls` |

### Build Order (Dependency Order)

Given the existing state, implementation order should be:

1. **Fix `ImageUpload` signature** — unblocks correct flow from upload through token extraction. No other changes required.

2. **Fix `html2canvas` lazy import in `DownloadControls`** — prevents any SSR/bundler issues before testing exports. Pure refactor, no behavior change.

3. **Fix CSS variable resolution in `onclone`** — test exports with a real design token; if colors appear wrong, add the `onclone` callback to resolve CSS vars to their computed hex values.

4. **Fix `isDownloading` state in `DesignOrchestration`** — add `downloadingCards` state, lift progress state or pass a setter down. Improves UX: disables upload/edit while export runs.

5. **Consolidate `CardGrid`** — either replace the inlined grid code in `DesignOrchestration` with `<CardGrid>` (and thread refs through it using `onRefSet` callback), or delete `CardGrid.tsx` entirely. Eliminating the duplication prevents drift.

---

## Anti-Patterns

### Anti-Pattern 1: Capturing CSS-Transformed Elements with html2canvas

**What people do:** Attach refs to the scaled wrapper div (the one with `transform: scale(0.25)`), then pass that element to html2canvas.

**Why it's wrong:** html2canvas captures what it sees in the DOM. A 1080×1350px element scaled to 25% visually is still 1080×1350px in the DOM — but if the ref pointed to the scaled wrapper, html2canvas would get the wrapper's dimensions (which may be different) and the transform would produce only a quarter of the content.

**Do this instead:** Always attach refs to the element with the true pixel dimensions (the `CardRenderer` root div), not to scaling wrappers. The current code does this correctly.

---

### Anti-Pattern 2: Parallel html2canvas Calls for Multiple Cards

**What people do:** `const canvases = await Promise.all(cards.map(c => html2canvas(c.element)))`.

**Why it's wrong:** html2canvas serializes DOM access internally but running multiple instances concurrently causes contention for layout recalculation. On a typical machine with 6-8 cards, this causes frame drops and can corrupt canvas output.

**Do this instead:** Use a sequential `for` loop with individual `await`. The current `DownloadControls` implementation is correct.

---

### Anti-Pattern 3: Storing API Key in Component State Across Stages

**What people do:** Passing `apiKey` through multiple component layers and accessing it from child components that call Claude APIs directly.

**Why it's wrong:** The key is visible in React DevTools component tree and in bundle if accidentally inlined. While the current app accepts this trade-off (it is a personal tool), the pattern should not be extended to server-persisted storage.

**Do this instead:** The current approach (React state in `CardNewsPage`, passed as prop) is the right trade-off for this project. Do not add `localStorage` persistence.

---

## Integration Points

### External Services (Stage 4 Specific)

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude Vision API (Anthropic) | Client-side, `@anthropic-ai/sdk`, `x-api-key` header | Used in `DesignTokenExtractor.analyzeReferenceImage()` — follows same pattern as Stages 2-3 |
| html2canvas | Client-side, dynamic import recommended | `html2canvas(element, { scale: 2, width: 1080, height: 1350 })` — outputs canvas for blob conversion |
| JSZip | Client-side, direct import | `new JSZip()`, sequential `.file()` calls, `generateAsync({ type: 'blob' })` |
| file-saver | Client-side, `saveAs(blob, filename)` | Used for both single PNG and ZIP downloads |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `page.tsx` → `DesignOrchestration` | Props: `cards`, `apiKey`, `onCardsUpdate` callback | Only boundary needing attention; cards flow in, updated cards flow out |
| `DesignOrchestration` → `DownloadControls` | Props: `cards[]` with `{ element, cardType, order }` | The `element` must be non-null at download time; null check exists in `DownloadControls` |
| `CardRenderer` → `DesignOrchestration` | `forwardRef` — `ref` callback `handleSetCardRef(index)` | Ref is populated on mount; safe to use in download handlers |
| `useDesignTokenSystem` → `DesignOrchestration` | Hook; returns `state.token` used for `CardRenderer` | No issues |

---

## Scaling Considerations

This is a single-user personal tool generating 5-10 cards per session. Scaling is not a concern. The relevant performance boundary is:

| Concern | At current scale (5-10 cards) | Notes |
|---------|-------------------------------|-------|
| html2canvas memory | ~50-100MB peak during batch ZIP | Acceptable; sequential loop releases canvas after each blob |
| Export time | 3-8 seconds for full ZIP | Acceptable; progress bar communicates status |
| Bundle size | html2canvas adds ~400KB gzipped | Acceptable; lazy import defers this to first download action |

---

## Sources

- Codebase direct inspection: `components/card-news/output/`, `components/card-news/design/`, `app/card-news/page.tsx`
- [html2canvas Configuration Options](https://html2canvas.hertzen.com/configuration) — scale, width, height, useCORS, onclone
- [html2canvas Features](https://html2canvas.hertzen.com/features/) — CSS property support limitations
- [Export React components as images using html2canvas — LogRocket](https://blog.logrocket.com/export-react-components-as-images-html2canvas/) — best practices for React integration
- [html2canvas CSS transform scale issue #1524](https://github.com/niklasvh/html2canvas/issues/1524) — transform capture behavior
- [JSZip official docs](https://stuk.github.io/jszip/) — generateAsync, file, blob type
- [Download multiple images as ZIP with JSZip and React — CodeSandbox](https://codesandbox.io/s/download-multiple-images-as-a-zip-with-jszip-file-saver-and-reactjs-iykufe) — sequential pattern

---
*Architecture research for: Card News Generator — Stage 4 Image Output & Batch Export*
*Researched: 2026-03-04*
