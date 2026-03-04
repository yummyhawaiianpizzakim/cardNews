# Requirements: Card News Generator

**Defined:** 2026-03-04
**Core Value:** Users can create professional card news with minimal effort while maintaining content quality and engagement.

## v1 Requirements

### Export Core

- [ ] **IMG-01**: User can download individual card as 1080×1350px PNG
- [ ] **IMG-02**: Exported PNG renders correct colors from active design token (CSS variables resolved)
- [ ] **IMG-03**: Exported PNG contains no UI chrome (badges, edit controls, order indicators)
- [ ] **IMG-04**: Download is blocked when any card is in active edit mode

### Batch Export

- [ ] **BATCH-01**: User can download all cards as a ZIP archive
- [ ] **BATCH-02**: ZIP export shows per-card progress indicator
- [ ] **BATCH-03**: ZIP filename includes topic slug and timestamp
- [ ] **BATCH-04**: Batch export handles 12+ cards without browser crash (canvas memory management)

## v2 Requirements

### PDF Export

- **PDF-01**: User can download all cards as a single PDF — defer until CVE-2025-68428 in jsPDF is resolved

### UX

- **UX-01**: User can toggle export preview mode to see cards without UI chrome before downloading

## Out of Scope

| Feature | Reason |
|---------|--------|
| PDF export (v1) | CVE-2025-68428 (CVSS 9.2) in all jsPDF versions before 4.0 — not safe to add |
| User authentication | Personal tool, no multi-user needed |
| Cloud image storage | Client-side generation sufficient |
| Real-time collaboration | Single-user workflow |
| Social platform aspect ratio presets | Out of scope for personal tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMG-01 | — | Pending |
| IMG-02 | — | Pending |
| IMG-03 | — | Pending |
| IMG-04 | — | Pending |
| BATCH-01 | — | Pending |
| BATCH-02 | — | Pending |
| BATCH-03 | — | Pending |
| BATCH-04 | — | Pending |

**Coverage:**
- v1 requirements: 8 total
- Mapped to phases: 0
- Unmapped: 8 ⚠️

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after initial definition*
