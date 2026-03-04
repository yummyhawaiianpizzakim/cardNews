# Stack Research

**Domain:** Client-side image generation and batch export (card news PNG + ZIP/PDF)
**Researched:** 2026-03-04
**Confidence:** HIGH (all critical libraries already installed; findings cross-verified)

---

## Context: What Is Already Installed

This milestone adds Stage 4 to an existing Next.js 15 / React 19 / Tailwind CSS 3.4.17 app.
The following packages are **already present** in `package.json` and require no installation:

| Package | Installed Version | Role |
|---------|------------------|------|
| html2canvas | ^1.4.1 | DOM-to-canvas rendering |
| jszip | ^3.10.1 | ZIP archive creation |
| file-saver | ^2.0.5 | Browser download trigger |
| @types/file-saver | ^2.0.7 | TypeScript types for file-saver |

---

## Recommended Stack (New Capabilities Only)

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| html2canvas | 1.4.1 (installed) | Render a card DOM node to an HTML Canvas element at exact 1080×1350px | Already installed and the established standard for DOM-to-PNG in browser; no server round-trip needed; supports `scale` option for DPI control |
| jszip | 3.10.1 (installed) | Pack multiple PNG Blobs into a single `.zip` file in the browser | Already installed; `generateAsync({type:"blob"})` produces a Blob directly; well-supported in all modern browsers |
| file-saver | 2.0.5 (installed) | Trigger browser file download for PNG, ZIP, or PDF Blobs | Already installed; wraps `URL.createObjectURL` + anchor-click pattern with cross-browser edge-case handling (Safari, iOS) |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsPDF | DO NOT ADD | Convert PNGs to a multi-page PDF | **See "What NOT to Use" — security CVE prevents safe use; use ZIP-only export instead** |

### Development Tools

No new dev tooling is needed. Existing TypeScript 5.7.3, ESLint 9, and Next.js 15 cover all requirements.

---

## Installation

Everything needed is already installed. No new packages required.

```bash
# Nothing to install — html2canvas, jszip, file-saver are already in package.json
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| html2canvas 1.4.1 | html-to-image 1.11.13 | If migrating away from html2canvas in a future milestone — html-to-image has a cleaner API and better SVG support, but last published ~1 year ago and would require a new dependency; not worth the swap when html2canvas is already installed and sufficient for fixed-size card layouts |
| html2canvas 1.4.1 | Puppeteer (server-side) | When pixel-perfect rendering of complex CSS (gradients, filters, web fonts from CDN) is required; adds server infrastructure complexity — overkill for a personal tool |
| jszip + file-saver (ZIP) | jsPDF (PDF) | **Do not use jsPDF** — CVE-2025-68428 (CVSS 9.2 critical path traversal) affects all versions before 4.0; v4.0 fix requires Node.js permission mode; the upgrade path is non-trivial. ZIP is the safer and simpler batch format for this use case |
| Native `URL.createObjectURL` | file-saver | Acceptable fallback for single-file PNG downloads if file-saver is removed; file-saver provides better Safari/iOS handling which justifies keeping it |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| jsPDF (any version) | CVE-2025-68428 is a CVSS 9.2 critical path traversal vulnerability affecting all versions before 4.0. Even v4.0 requires Node.js permission mode to be safe. Not worth adding for a batch-export feature when ZIP achieves the same goal. | jszip + file-saver for batch export |
| Tailwind CSS v4 upgrade | html2canvas does not support `oklch()` color values. Tailwind v4 emits oklch by default, which causes a parse error in html2canvas at render time. The project must stay on Tailwind v3.x while html2canvas is in use. | Stay on Tailwind CSS 3.4.17 |
| `canvas.toDataURL('image/png', quality)` | The quality parameter is silently ignored for PNG (PNG is lossless); pass no quality argument to avoid developer confusion | `canvas.toDataURL('image/png')` — or preferably `canvas.toBlob(cb, 'image/png')` to avoid large base64 string allocation |
| `html2canvas` with `useCORS: false` on image cards | External images taint the canvas, blocking `toDataURL()` with a SecurityError | Always pass `{ useCORS: true }` when card HTML includes `<img>` tags |

---

## Stack Patterns by Variant

**Single card PNG download:**
- Call `html2canvas(cardElement, { scale: 1, width: 1080, height: 1350, useCORS: true })`
- Convert canvas to Blob via `canvas.toBlob(blob => saveAs(blob, 'card-N.png'), 'image/png')`
- Use `canvas.toBlob` (not `toDataURL`) to avoid large base64 string in memory

**Batch ZIP export (all cards):**
- Render each card sequentially with html2canvas (parallel rendering can exhaust canvas memory)
- Add each PNG Blob to JSZip: `zip.file('card-N.png', blob)`
- Generate and download: `zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }).then(blob => saveAs(blob, 'cards.zip'))`

**If user requests PDF export (future):**
- Do not add jsPDF until CVE-2025-68428 is fully resolved and the upgrade path is stable
- Alternative: Use a server-side route (Next.js API route) that receives PNG data URLs and generates the PDF via a server-safe library

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| html2canvas@1.4.1 | Tailwind CSS 3.x | Safe — Tailwind v3 outputs hex/rgb/hsl, all supported by html2canvas |
| html2canvas@1.4.1 | Tailwind CSS 4.x | **Incompatible** — Tailwind v4 emits oklch colors; html2canvas throws parse errors |
| html2canvas@1.4.1 | React 19 / Next.js 15 | No reported compatibility issues; library is framework-agnostic (DOM API only) |
| html2canvas@1.4.1 | shadcn/ui (Radix) | Compatible; Radix components render to standard DOM — html2canvas captures the painted DOM |
| jszip@3.10.1 | file-saver@2.0.5 | Standard pairing — jszip generates Blob, file-saver downloads it |
| file-saver@2.0.5 | iOS Safari | Opens in new tab instead of downloading; acceptable for a personal desktop tool |

---

## Critical Integration Notes

**1. html2canvas scale vs. width/height**
`scale` is a resolution multiplier, not a dimension setter. To get exactly 1080×1350px output:
- Size the card DOM element to exactly 1080×1350 CSS pixels before capture, then use `scale: 1`
- OR size the element smaller (e.g., 540×675) and use `scale: 2` for equivalent output with sharper rendering on retina screens during preview
- Do not rely on `width`/`height` html2canvas options alone — they crop/pad, not resize

**2. Sequential rendering for batch export**
Do not run html2canvas calls in parallel (`Promise.all`). Each call creates a full canvas in memory. For 10+ cards, parallel execution can exhaust browser canvas memory limits. Use a sequential loop (`for...of` with `await`).

**3. Off-screen rendering container**
html2canvas captures what is visible on screen. For cards not currently in the viewport, either scroll them into view or render them in a hidden container (position absolute, left: -9999px, exact 1080×1350px dimensions) to ensure accurate capture.

**4. `useCORS: true` is required**
If card templates include `<img>` elements (background images, icons), passing `useCORS: true` is mandatory. Without it, images from external origins taint the canvas, and `toDataURL()` throws a `SecurityError`.

---

## Sources

- [html2canvas GitHub Issues — oklch incompatibility with Tailwind v4](https://github.com/niklasvh/html2canvas/issues/3269) — HIGH confidence (official repo issue)
- [html2canvas GitHub Issues — image generation slowness](https://github.com/niklasvh/html2canvas/issues/3249) — HIGH confidence
- [html2canvas configuration docs](https://html2canvas.hertzen.com/configuration) — HIGH confidence (official docs)
- [CVE-2025-68428 NVD entry](https://nvd.nist.gov/vuln/detail/CVE-2025-68428) — HIGH confidence (NVD)
- [Endor Labs: CVE-2025-68428 jsPDF critical path traversal](https://www.endorlabs.com/learn/cve-2025-68428-critical-path-traversal-in-jspdf) — HIGH confidence
- [SecurityWeek: Critical Vulnerability Patched in jsPDF](https://www.securityweek.com/critical-vulnerability-patched-in-jspdf/) — HIGH confidence
- [JSZip generateAsync docs](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html) — HIGH confidence (official docs)
- [FileSaver.js GitHub](https://github.com/eligrey/FileSaver.js) — HIGH confidence (official repo)
- [MDN: HTMLCanvasElement.toDataURL](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL) — HIGH confidence (MDN)
- [npm: html-to-image (version comparison)](https://www.npmjs.com/package/html-to-image) — MEDIUM confidence (npm registry)
- [Better Programming: Replacing html2canvas with html-to-image](https://medium.com/better-programming/heres-why-i-m-replacing-html2canvas-with-html-to-image-in-our-react-app-d8da0b85eadf) — MEDIUM confidence (community article)

---

*Stack research for: Card News Image Output & Batch Export (Stage 4)*
*Researched: 2026-03-04*
