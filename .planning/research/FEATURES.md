# Feature Research

**Domain:** Card image generation and batch export for AI-generated card news
**Researched:** 2026-03-04
**Confidence:** HIGH (codebase inspected directly; library behavior cross-verified with official docs and community sources)

---

## Context: What Already Exists

The codebase has substantial scaffolding already in place. Reading the actual component files reveals:

- `CardRenderer.tsx` — renders each card at exactly `w-[1080px] h-[1350px]` using CSS dimensions + design tokens applied via CSS custom properties. Uses `forwardRef` to expose the DOM node.
- `DownloadControls.tsx` — skeleton that imports `html2canvas`, `JSZip`, `file-saver` and wires up both individual PNG download and ZIP batch download with a progress bar.
- `DesignOrchestration.tsx` — orchestrates design token extraction (Claude Vision), card preview grid (scaled via CSS `transform: scale()`), editing mode, and passes `cardRefs` to `DownloadControls`.
- `TextEditor.tsx` — inline click-to-edit for headline/subtext with ESC revert and Enter confirm.
- `CardGrid.tsx` — duplicate grid view component (appears to be an earlier iteration; `DesignOrchestration` contains the authoritative grid).
- Dependencies installed: `html2canvas@1.4.1`, `jszip@3.10.1`, `file-saver@2.0.5`.

The skeleton is present but the feature is not wired up to work correctly. The `DownloadControls` component exists but is called with `isDownloading={analyzing}` (the image-analysis flag), not a dedicated download state. Rendering correctness has not been validated.

---

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Individual card PNG download | Core promise of the app — one card at a time if needed | LOW | `downloadCardAsPNG` function already written in `DownloadControls.tsx`; needs wiring and correctness testing |
| ZIP batch download of all cards | Multi-card output is the norm; downloading one-by-one is friction | LOW | `downloadAllCardsAsZip` already written; needs state management fix (`isDownloading` flag wrong) |
| Progress indicator during batch export | Export takes 3–10s for a full deck; no feedback = perceived hang | LOW | Progress state + shadcn `Progress` component already wired in `DownloadControls.tsx`; needs the download state decoupled from `analyzing` |
| Correct 1080×1350px output dimensions | Instagram card format is the explicit product requirement | MEDIUM | `html2canvas` called with `width: 1080, height: 1350, scale: 2`; but scaled grid preview (`transform: scale(0.25)`) may interfere — element must be full-size in DOM during capture |
| UI elements stripped from export | Badges, edit controls, order numbers must not appear in final PNG | LOW | `onclone` callback removes `.export-hidden` elements; `Badge` and order indicator need `.export-hidden` class added; `TextEditor` switching to edit mode during capture must be prevented |
| Ordered filename convention | Files must be sortable/importable in order | LOW | Pattern `card-cover.png`, `card-body-1.png`, `card-cta.png` already in code; validate sort order is correct |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| PDF export (all cards as single PDF) | Some platforms accept PDF; editors prefer single file for review | MEDIUM | Not in current skeleton; requires `jsPDF` (not installed) — each card PNG added as a page via `pdf.addImage()`; adds one dependency |
| Scaled card preview that matches export output | What-you-see-is-what-you-export trust; avoids surprises | MEDIUM | Current grid uses `transform: scale(0.25)` which causes layout-shift and does not guarantee export fidelity. A proper scaled preview needs the card at full size, captured, then displayed as `<img>` at reduced size — or use CSS `zoom` which html2canvas handles better |
| "Export hidden" design mode | Hide all editing affordances so preview looks like final product before exporting | LOW | `hideUI` prop exists on `CardRenderer`; not yet connected to a toggle in the UI |
| Per-card preview image (thumbnail) | Show rendered PNG thumbnails in the grid instead of live DOM rendering — faster, confirms export fidelity | MEDIUM | Requires capturing each card immediately after design token is applied and storing as data URL; moderate complexity |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Server-side image rendering (Puppeteer/Playwright) | Consistent output regardless of browser | Over-engineered for a personal tool; adds server dependency, hosting cost, and cold-start latency; contradicts the "client-side is sufficient" decision in PROJECT.md | Stay with html2canvas; accept its CSS limitations and design cards to avoid them |
| Real-time PNG generation on every edit | Instant visual confidence that export matches preview | html2canvas is synchronous and blocks the main thread for ~500ms–2s per card; on every keystroke this is unusable | Generate PNG only on explicit user action ("Preview export" button or download trigger) |
| Cloud storage / upload-to-URL | Share output without downloading | Out of scope (PROJECT.md: "Cloud image storage — Client-side generation sufficient"); adds auth complexity | Keep as local download only |
| Zip with nested folders | Organize cover/body/cta separately | Adds complexity; file managers handle flat ZIPs fine for 5–10 cards | Flat ZIP with ordered filenames is sufficient |
| Custom filename before download | Let user name the project | Adds a modal/dialog interaction before every download; slows the workflow for a single-user tool | Auto-name as `card-news-{topic}-{date}.zip` using topic from form state |

---

## Feature Dependencies

```
[CardRenderer at 1080×1350px in DOM (full size, not scaled)]
    └──required by──> [html2canvas capture at correct dimensions]
                          └──required by──> [Individual PNG download]
                          └──required by──> [ZIP batch export]
                          └──required by──> [PDF export]

[Design token applied to cards]
    └──required by──> [CardRenderer rendering with correct colors/fonts]
                          └──required by──> [All export features]

[DOM ref (cardRefs.current[i])]
    └──required by──> [html2canvas(element, options)]
                          └──note: element must be visible in DOM during capture]

[isDownloading state (dedicated)]
    └──required by──> [Progress bar, button disabled state]
    └──currently wrong: uses `analyzing` (image analysis flag) instead]

[Tailwind color compatibility with html2canvas]
    └──risk: project uses Tailwind v3 (package.json: tailwindcss@3.4.17)]
    └──Tailwind v3 uses rgb/hex — NOT oklch — so this pitfall does NOT apply here]
    └──confirmed safe: no migration needed]
```

### Dependency Notes

- **Full-size element required for capture:** `html2canvas` renders what is visible in the DOM. The current grid uses `transform: scale(0.25)` on a wrapper `div` — but the inner `CardRenderer` div is still `1080×1350px` in layout, only visually shrunk. This is acceptable for capture IF the element is in the DOM flow. However, `transform: scale()` on the parent can sometimes cause html2canvas to capture at the wrong offset. The safest approach is to render an off-screen (opacity-0, position-absolute) full-size clone for capture only, or validate that the current `transform` parent doesn't affect capture.
- **Tailwind v3 is safe:** Package.json confirms `tailwindcss@^3.4.17`. The oklch incompatibility only affects Tailwind v4+. This project is not affected.
- **`isDownloading` state bug:** `DownloadControls` receives `isDownloading={analyzing}` from `DesignOrchestration`. This means while cards are being downloaded, buttons are not disabled and the progress bar is not shown. A dedicated `isDownloading` state is needed in `DesignOrchestration`.
- **`TextEditor` in edit mode during capture:** If a card is in edit mode (showing `<Input>` or `<Textarea>` instead of `<h1>`/`<p>`), the exported PNG will show the input fields. The capture flow must ensure all cards are in display mode before calling html2canvas, or use the `onclone` callback to force display mode in the clone.
- **PDF export requires jsPDF:** Not installed. Pattern is: html2canvas → PNG data URL → `pdf.addImage()` → `pdf.addPage()` → `pdf.save()`. Medium complexity, one new dependency.

---

## MVP Definition

### Launch With (v1)

Minimum to complete the four-stage pipeline and make the app fully usable.

- [ ] Fix `isDownloading` state — decouple from `analyzing` flag in `DesignOrchestration`; add dedicated `useState<boolean>` for download in progress
- [ ] Validate html2canvas capture dimensions — confirm 1080×1350px output is correct despite `transform: scale()` on parent; add a manual test with a known card
- [ ] Add `.export-hidden` class to `Badge` (card type indicator) and order number overlay in `CardRenderer` — these are already excluded in `onclone` but the class must be applied
- [ ] Prevent capture during edit mode — before calling html2canvas in `downloadAllCardsAsZip`, confirm no card is actively being edited (check `editingCard !== null` in `DesignOrchestration` and block or auto-exit edit mode)
- [ ] Auto-name ZIP — include topic slug in filename: `card-news-${slug}.zip` (pass topic from page state to `DownloadControls`)
- [ ] End-to-end smoke test — generate a real card set, download ZIP, verify PNGs open at 1080×1350px with correct content

### Add After Validation (v1.x)

Features to add once core download workflow is confirmed working.

- [ ] PDF export — install `jsPDF`, add "Download PDF" button alongside ZIP button; implement multi-page PDF with each card as a full-page image
- [ ] Export preview mode toggle — wire `hideUI` prop to a "Preview export" button that hides editing affordances so user sees the clean final output before downloading
- [ ] Auto-named ZIP with topic — derive a slug from the form topic input and pass it through to `DownloadControls`

### Future Consideration (v2+)

Defer until if/when the app grows beyond personal use.

- [ ] Per-card thumbnail caching — capture each card after design token is applied and store as data URL for instant preview; reduces reliance on DOM transform tricks
- [ ] Custom export filename — prompt user for project name before download; only warranted if the tool serves multiple projects regularly
- [ ] Social platform presets — export variants at different aspect ratios (1:1 for feed, 9:16 for Stories, 16:9 for LinkedIn); requires parameterizing card dimensions and adding a format picker

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Fix isDownloading state | HIGH | LOW | P1 |
| Validate capture dimensions | HIGH | LOW | P1 |
| Add .export-hidden classes | HIGH | LOW | P1 |
| Prevent capture during edit mode | HIGH | LOW | P1 |
| Auto-named ZIP | MEDIUM | LOW | P1 |
| Individual PNG download | HIGH | LOW | P1 |
| ZIP batch export | HIGH | LOW | P1 |
| PDF export | MEDIUM | MEDIUM | P2 |
| Export preview mode toggle | MEDIUM | LOW | P2 |
| Per-card thumbnail caching | MEDIUM | MEDIUM | P3 |
| Custom filename prompt | LOW | MEDIUM | P3 |
| Social platform format presets | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1 milestone launch (completes the four-stage pipeline)
- P2: Should have, add in v1.x once core is validated
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Canva / Adobe Express | Simple card tools | Our Approach |
|---------|----------------------|-------------------|--------------|
| Individual card download | Yes, per card | Yes | Yes — already in skeleton |
| Batch ZIP download | Not typical (download one at a time) | Rare | Yes — differentiator for content workflows |
| PDF export | Yes (premium) | Sometimes | v1.x — adds value for editorial review |
| Progress indicator | Yes | Rarely | Yes — already in skeleton, needs state fix |
| Preview before export | Yes (always visible) | Yes | Partial — `hideUI` prop exists, not wired |
| Off-canvas-size images | Renders server-side | Client-side varies | Client-side html2canvas; constraints apply |
| Tailwind/CSS compatibility | N/A | N/A | Confirmed safe on Tailwind v3 |

---

## Sources

- html2canvas official docs and configuration: https://html2canvas.hertzen.com/configuration
- html2canvas GitHub — oklch issue (Tailwind v4): https://github.com/niklasvh/html2canvas/issues/3269 (confirmed not applicable — project is on Tailwind v3)
- html2canvas GitHub — off-screen rendering limitation: https://github.com/niklasvh/html2canvas/issues/117
- html2canvas GitHub — retina/scale handling: https://github.com/niklasvh/html2canvas/issues/390
- html2canvas text shift with Tailwind CSS: https://hanki.dev/tailwind-html2canvas-text-shift-down/
- Comparison html2canvas vs html-to-image: https://npm-compare.com/dom-to-image,html-to-image,html2canvas
- portalZINE — Best HTML to Canvas Solutions 2025: https://portalzine.de/best-html-to-canvas-solutions-in-2025/
- jsPDF multi-page image export: https://dev.to/ramonak/export-multiple-charts-to-pdf-with-react-and-jspdf-b47
- JSZip + FileSaver React pattern: https://codesandbox.io/s/download-multiple-images-as-a-zip-with-jszip-file-saver-and-reactjs-iykufe
- UX progress indicator best practices: https://carbondesignsystem.com/components/progress-bar/usage/
- Direct codebase inspection: `/Users/gim-yohan/ClaudeProjects/cardNews/cardNews/components/card-news/output/`

---

*Feature research for: Card image generation and batch export (Stage 4)*
*Researched: 2026-03-04*
