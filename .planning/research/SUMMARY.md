# Project Research Summary

**Project:** Card News Image Output & Batch Export (Stage 4)
**Domain:** Client-side DOM-to-PNG image generation and batch ZIP export in Next.js 15 / React 19
**Researched:** 2026-03-04
**Confidence:** HIGH

## Executive Summary

This milestone is Stage 4 of a four-stage card news generation pipeline. Stages 1–3 (AI research, quality evaluation, and structure review) are already complete. Stage 4 takes the approved set of `CardNewsItem` objects and produces downloadable 1080×1350px PNG files — individually or as a batch ZIP. All three required libraries (`html2canvas`, `jszip`, `file-saver`) are already installed in `package.json`. The component scaffold (`CardRenderer`, `DownloadControls`, `DesignOrchestration`, `TextEditor`) already exists with correct architecture in `components/card-news/output/`. This is an integration and bug-fixing milestone, not a greenfield build.

The recommended implementation approach is entirely client-side using html2canvas for DOM capture. No server infrastructure is needed. The critical architectural insight is that html2canvas must capture the `CardRenderer` element at its true CSS dimensions (1080×1350px), not through the CSS `transform: scale(0.25)` wrapper used for grid preview. The safest strategy is to render an off-screen unscaled clone for export, keeping the scaled grid for display. Batch export must use a sequential `for` loop — never `Promise.all` — and must explicitly release each canvas from memory after blob conversion to prevent tab crashes on full card sets (8–12 cards).

The two highest-risk areas are both well-understood and have clear fixes: CSS custom properties are not resolved by html2canvas's CSS parser, requiring an `onclone` callback that substitutes computed hex values directly from the `DesignToken` object; and the current `isDownloading` state is incorrectly wired to the image-analysis flag rather than a dedicated download state, causing the progress bar and button disabling to fail entirely. These two bugs must be resolved before any export output can be considered correct. Neither requires new libraries or architectural changes — only targeted code fixes in existing components.

## Key Findings

### Recommended Stack

Everything needed is already installed. No new dependencies are required for the v1 milestone. The three installed libraries cover all export requirements: `html2canvas@1.4.1` renders DOM nodes to canvas, `jszip@3.10.1` packs multiple PNG blobs into a ZIP archive, and `file-saver@2.0.5` triggers browser downloads with cross-browser Safari/iOS handling. The project is confirmed safe on Tailwind CSS 3.4.17 — the critical oklch color incompatibility only applies to Tailwind v4, which must not be upgraded to while html2canvas is in use. jsPDF must not be added in any form due to CVE-2025-68428 (CVSS 9.2 critical path traversal affecting all versions before 4.0). The ZIP format is the correct batch output choice and eliminates any dependency on jsPDF.

**Core technologies:**
- `html2canvas@1.4.1`: DOM-to-canvas rendering — already installed, sufficient for fixed 1080×1350px card layout, requires `useCORS: true` and `onclone` for CSS variable resolution
- `jszip@3.10.1`: ZIP archive creation — already installed, `generateAsync({ type: 'blob', compression: 'DEFLATE' })` produces a download-ready Blob
- `file-saver@2.0.5`: Browser download trigger — already installed, handles Safari/iOS edge cases better than raw `URL.createObjectURL`

### Expected Features

The core export workflow is fully scaffolded; the work is wiring it correctly and fixing the state bugs.

**Must have (table stakes):**
- Individual card PNG download — `downloadCardAsPNG` already written in `DownloadControls.tsx`; needs state management fix and capture correctness validation
- ZIP batch download of all cards — `downloadAllCardsAsZip` already written; needs `isDownloading` state decoupled from `analyzing` flag
- Progress indicator during batch export — `Progress` component already wired; needs dedicated `downloadingCards` state in `DesignOrchestration`
- Correct 1080×1350px PNG output — requires off-screen unscaled capture strategy or `onclone` transform reset
- UI elements stripped from export — `.export-hidden` class selector exists in `onclone`; Badge and order indicator classes must be verified to match
- Edit mode guard before capture — prevent exporting when a `TextEditor` is in active edit state

**Should have (competitive):**
- Auto-named ZIP with topic slug — `card-news-${slug}.zip` derived from form topic state; low effort, clearly better than static filename
- Export preview mode toggle — wire the existing `hideUI` prop on `CardRenderer` to a "Preview" button so users see the clean output before downloading
- Timestamp in ZIP filename — prevents browser overwrite of previous downloads

**Defer (v2+):**
- PDF export — do not add until CVE-2025-68428 in jsPDF is fully resolved
- Per-card thumbnail caching — moderate complexity; defer until core is validated
- Social platform aspect ratio presets — low priority; out of scope for personal tool

### Architecture Approach

Stage 4 follows the established hook-per-system pattern used in Stages 2 and 3. `DesignOrchestration` is the integration point: it orchestrates image upload, Claude Vision token extraction, the card preview grid, and hands refs down to `DownloadControls`. `CardRenderer` uses `forwardRef` to expose its DOM node, and `DesignOrchestration` collects refs into `cardRefs.current[]` indexed by `card.order`. `DownloadControls` receives the `cards[]` array with precomputed `element` (the DOM ref) and calls html2canvas sequentially per card. No new files are needed — all modification work is in existing files.

**Major components:**
1. `DesignOrchestration` — integration orchestrator; owns ref collection, download state, and edit-mode guard
2. `CardRenderer` — 1080×1350px forwardRef render target; applies DesignToken via CSS custom properties
3. `DownloadControls` — html2canvas capture loop, JSZip assembly, and file-saver download trigger
4. `ImageUpload` — base64 conversion of reference image; has a prop signature bug that must be fixed
5. `DesignTokenExtractor` — Claude Vision call producing `DesignToken` JSON; already works correctly

### Critical Pitfalls

1. **CSS custom properties not resolved by html2canvas** — html2canvas's CSS parser does not resolve `var()` references; all colors and fonts appear as defaults (white/black) in the exported PNG. Fix: in the `onclone` callback, read raw hex values directly from the `DesignToken` object (already available in closure) and apply them as explicit inline styles to the cloned element. This is the highest-severity pitfall and must be solved first.

2. **CSS transform: scale() corrupts capture geometry** — the `transform: scale(0.25)` wrapper on the preview grid causes html2canvas to rasterize at scaled dimensions, producing 270×338px output instead of 1080×1350px. Fix: render cards in a hidden off-screen container (position absolute, left -9999px) at full 1:1 scale, attach export refs there, and use the scaled preview grid for display only. Alternatively, reset `transform: none` on the wrapper in the `onclone` callback.

3. **Canvas memory accumulation crashes the tab during batch export** — at `scale: 2`, each card canvas is 2160×2700px (~23MB). Eight cards before GC runs = ~280MB peak; tab crashes with no user-visible error. Fix: after each `canvas.toBlob()` call, set `canvas.width = 0; canvas.height = 0` to release GPU memory, and add `await new Promise(r => setTimeout(r, 50))` between iterations to allow GC.

4. **Card refs null or mismatched due to index vs order mismatch** — `cardRefs.current` is indexed by array position but populated via `card.order` (which may be non-contiguous after structure review edits). Silently produces a ZIP with missing or wrong-card PNGs. Fix: use a `Map<string, HTMLDivElement>` keyed by a stable card identifier (`card.type + '-' + card.order`) instead of a numeric array.

5. **TextEditor input elements captured during export** — if a card is in active edit mode when download is triggered, html2canvas captures the `<Input>` element instead of styled text. Fix: disable download buttons when `editingCard !== null` in `DesignOrchestration`; add an `onclone` guard as a secondary safety net.

## Implications for Roadmap

Based on combined research, the work decomposes into two tightly sequenced phases. There is no new greenfield infrastructure — both phases are integration and bug-fix work on existing scaffolding.

### Phase 1: Core Capture Correctness

**Rationale:** Everything else depends on html2canvas producing a correct 1080×1350px image. Until capture geometry and CSS variable resolution are fixed, export output is non-functional regardless of state management or UX polish. This phase establishes the foundation.

**Delivers:** A single-card PNG download that produces the correct dimensions, correct colors (from the active DesignToken), and no UI chrome (no badges, no edit controls).

**Addresses features from FEATURES.md:**
- Individual card PNG download (P1)
- Correct 1080×1350px output (P1)
- UI elements stripped from export (P1)

**Must avoid (from PITFALLS.md):**
- Pitfall 1: CSS custom property resolution — implement `onclone` callback using DesignToken hex values
- Pitfall 2: Transform scale geometry — implement off-screen unscaled capture container
- Pitfall 5: TextEditor edit mode guard — add `editingCard !== null` check before any capture

**Key implementation steps (in dependency order):**
1. Fix `ImageUpload.onAnalyze` prop signature (unblocks correct flow from upload to token extraction)
2. Change html2canvas import to dynamic `await import('html2canvas')` inside async functions (prevents SSR build error)
3. Implement off-screen 1:1 capture container for export refs (resolves Pitfall 2)
4. Add `onclone` callback resolving CSS vars to DesignToken hex values (resolves Pitfall 1)
5. Add edit-mode download guard in `DesignOrchestration` (resolves Pitfall 5)
6. Add `.export-hidden` class to Badge and order indicator in `CardRenderer`
7. Run `next build` to confirm zero SSR errors

### Phase 2: Batch Export & State Polish

**Rationale:** With single-card capture correct, batch export is a sequential extension of the same capture call. This phase also fixes the `isDownloading` state bug, adds memory management between iterations, corrects the ref indexing strategy, and wires up UX feedback.

**Delivers:** A ZIP batch export that produces all cards at correct dimensions with correct content, a working progress bar, correct button disabled states during export, and a topic-derived filename.

**Addresses features from FEATURES.md:**
- ZIP batch download of all cards (P1)
- Progress indicator (P1)
- Auto-named ZIP with topic slug (P1)
- Ordered filename convention (P1)

**Must avoid (from PITFALLS.md):**
- Pitfall 3: Ref index mismatch — refactor to `Map<string, HTMLDivElement>` keyed by stable card ID
- Pitfall 4: Canvas memory accumulation — add `canvas.width = 0; canvas.height = 0` + 50ms pause between iterations
- UX pitfall: No feedback — ensure progress bar updates per card, not only at completion
- UX pitfall: ZIP filename collision — append timestamp to filename

**Key implementation steps:**
1. Add dedicated `downloadingCards: boolean` state to `DesignOrchestration`; decouple from `analyzing`
2. Refactor ref management from array-indexed to `Map<string, HTMLDivElement>`
3. Add canvas memory release after each `toBlob()` in the sequential loop
4. Pass topic slug from page state down to `DownloadControls` for filename
5. Validate all refs populated before enabling download button; surface count to user
6. End-to-end smoke test: generate full card set, download ZIP, verify correct count and dimensions
7. Consolidate or delete `CardGrid.tsx` dead code

### Phase Ordering Rationale

- Capture correctness must precede batch because every pitfall in batch export (wrong dimensions, missing colors, wrong cards) is a superset of the single-card pitfalls. Fixing capture once fixes both.
- `ImageUpload` signature and dynamic import fixes have zero risk and should be first — they are pure correctness fixes that unblock everything else.
- Ref architecture (Pitfall 3) is addressed in Phase 2 because it only manifests in batch; it does not affect single-card download.
- Memory management (Pitfall 4) must be part of Phase 2 initial implementation — it cannot be patched after the fact without significant refactor risk.

### Research Flags

Phases with standard, well-documented patterns (no additional research needed):
- **Phase 1 — off-screen capture container:** Established pattern in html2canvas community; direct implementation.
- **Phase 1 — dynamic import for html2canvas in Next.js:** Standard Next.js `'use client'` + `await import()` pattern.
- **Phase 2 — JSZip sequential batch assembly:** Well-documented in official JSZip docs; pattern already in `DownloadControls.tsx`.
- **Phase 2 — canvas memory release:** Documented fix in html2canvas GitHub issue #1609; one-liner.

Areas that may need targeted investigation during implementation:
- **Phase 1 — `onclone` CSS variable resolution with Tailwind utility classes:** While the approach is clear, the exact set of elements and classes that need explicit style overrides in the cloned document depends on the actual rendered DOM structure of `CardRenderer`. A quick inspection pass before implementation is warranted.
- **Phase 1 — html2canvas off-screen container and Safari:** Safari has known quirks with off-screen DOM elements and canvas capture. Since the project is a personal desktop tool, this is low priority but worth a single test on Safari before declaring complete.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries already installed and version-verified; CVE-2025-68428 confirmed via NVD; oklch incompatibility confirmed in official html2canvas GitHub issue |
| Features | HIGH | Codebase inspected directly; existing component behavior confirmed; feature gaps identified from actual code analysis, not inference |
| Architecture | HIGH | Based on direct codebase inspection of all Stage 4 components; ref patterns verified against html2canvas docs; integration gaps confirmed by reading actual source |
| Pitfalls | HIGH | Each critical pitfall traced to a specific GitHub issue with reproduction details; implementation-specific pitfalls derived from direct code analysis |

**Overall confidence:** HIGH

### Gaps to Address

- **`onclone` CSS variable resolution scope:** The exact set of CSS classes in `CardRenderer.tsx` that use `var()` references (e.g., `text-[var(--color-primary)]`) must be enumerated during Phase 1 implementation to write a complete `onclone` handler. This is a 10-minute code read, not a research gap.
- **Safari off-screen capture behavior:** Not tested. For a desktop personal tool this is acceptable to defer — flag it in the Phase 1 smoke test checklist.
- **Card count in production use:** Research assumes 5–12 cards per session based on the card news format. If users regularly generate 20+ cards, the memory management approach (50ms GC pause + canvas reset) may still be insufficient, and a more aggressive strategy (render cards one-at-a-time from data, not from DOM) would be needed. This is out of scope for v1.

## Sources

### Primary (HIGH confidence)
- html2canvas GitHub issue #1994 — CSS custom property resolution limitation (confirmed): https://github.com/niklasvh/html2canvas/issues/1994
- html2canvas GitHub issue #807 — CSS transform scale capture behavior: https://github.com/niklasvh/html2canvas/issues/807
- html2canvas GitHub issue #1524 — CSS transform-scale bugs: https://github.com/niklasvh/html2canvas/issues/1524
- html2canvas GitHub issue #1609 — Memory accumulation across multiple calls: https://github.com/niklasvh/html2canvas/issues/1609
- html2canvas official configuration docs: https://html2canvas.hertzen.com/configuration
- CVE-2025-68428 NVD entry — jsPDF critical path traversal (CVSS 9.2): https://nvd.nist.gov/vuln/detail/CVE-2025-68428
- JSZip generateAsync official docs: https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html
- FileSaver.js official repo: https://github.com/eligrey/FileSaver.js
- Direct codebase inspection: `components/card-news/output/`, `components/card-news/design/`, `app/card-news/page.tsx` (2026-03-04)

### Secondary (MEDIUM confidence)
- html-to-image npm comparison — alternative to html2canvas: https://npm-compare.com/dom-to-image,html-to-image,html2canvas
- LogRocket: Export React components as images using html2canvas: https://blog.logrocket.com/export-react-components-as-images-html2canvas/
- JSZip + FileSaver React sequential pattern: https://codesandbox.io/s/download-multiple-images-as-a-zip-with-jszip-file-saver-and-reactjs-iykufe
- UX progress indicator best practices: https://carbondesignsystem.com/components/progress-bar/usage/

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
