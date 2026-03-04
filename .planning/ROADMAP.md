# Roadmap: Card News Generator

## Overview

Milestone v1.0 completes Stage 4 of the four-stage card news pipeline. Stages 1-3 (AI research, quality evaluation, structure review) are already shipping. This milestone wires in client-side PNG capture and batch ZIP export using the already-installed html2canvas, jszip, and file-saver libraries. The component scaffold exists; this is integration and bug-fix work, not greenfield. Phase 1 establishes correct single-card capture (dimensions, colors, chrome stripping, edit guard). Phase 2 extends that to batch export with proper state management, memory safety, and UX feedback.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core Capture Correctness** - Single-card PNG download produces correct dimensions, colors, and no UI chrome
- [ ] **Phase 2: Batch Export & State Polish** - All cards exported as a named ZIP with progress feedback and memory-safe capture loop

## Phase Details

### Phase 1: Core Capture Correctness
**Goal**: Users can download any individual card as a pixel-accurate 1080x1350px PNG with correct colors and no UI chrome
**Depends on**: Nothing (first phase)
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04
**Success Criteria** (what must be TRUE):
  1. User clicks a card's download button and receives a PNG file at exactly 1080x1350px
  2. The downloaded PNG renders the correct colors from the active design token — no white/black fallbacks from unresolved CSS variables
  3. The downloaded PNG contains no badges, edit controls, or card-order indicators
  4. The download button is disabled (and unclickable) while any card is in active edit mode
**Plans**: TBD

### Phase 2: Batch Export & State Polish
**Goal**: Users can export all cards at once as a ZIP archive with real-time per-card progress and a meaningful filename, without the browser crashing
**Depends on**: Phase 1
**Requirements**: BATCH-01, BATCH-02, BATCH-03, BATCH-04
**Success Criteria** (what must be TRUE):
  1. User clicks "Download All" and receives a ZIP file containing one PNG per card, all at correct dimensions and colors
  2. A progress bar advances card-by-card during ZIP generation — it does not stay at 0% and jump to 100%
  3. The downloaded ZIP filename includes the session topic slug and a timestamp (e.g., card-news-ai-trends-20260304T1430.zip)
  4. Downloading a full set of 12 cards completes without the browser tab crashing or freezing
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Capture Correctness | 0/TBD | Not started | - |
| 2. Batch Export & State Polish | 0/TBD | Not started | - |
