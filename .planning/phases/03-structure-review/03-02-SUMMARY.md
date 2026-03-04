---
phase: 03-structure-review
plan: 02
subsystem: ui
tags: [react, typescript, nextjs, shadcn, hooks, claude-api, parallel-agents]

# Dependency graph
requires:
  - phase: 03-structure-review/03-01
    provides: StructureSystem.tsx (hook, types, applyProposals), ProposalList.tsx (UI components)
  - phase: 02-quality-verification
    provides: QualityLoop.tsx (callClaude/parseJsonFromText pattern to mirror)
  - phase: 01-research-copy-generation
    provides: CardNewsItem type from components/lib/types.ts
provides:
  - StructureReview orchestration component with parallel Claude agent calls
  - Page-level integration wiring StructureReview after QualityLoop approval
affects:
  - 04-design-rendering
  - 05-output-download

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Promise.all for parallel dual-agent execution mirroring QualityLoop pattern"
    - "callClaude and parseJsonFromText copied verbatim from QualityLoop.tsx"
    - "approvedCards state for passing quality-verified cards downstream"
    - "Proposal validation with per-type required field checks before setProposals"
    - "Opt-out model: all proposals accepted by default (inherited from StructureSystem)"

key-files:
  created:
    - components/card-news/structure/StructureReview.tsx
  modified:
    - app/card-news/page.tsx

key-decisions:
  - "callClaude and parseJsonFromText copied verbatim (not reimplemented) from QualityLoop.tsx per plan instruction"
  - "handleApply uses direct applyProposals call rather than hook's applyAccepted — avoids async state race in setState batch"
  - "approvedCards state added to page.tsx so StructureReview always receives quality-verified snapshot, not stale intermediate state"

patterns-established:
  - "StructureReview mirrors QualityLoop structure exactly: same section headers, useCallback for async handler, try/catch error flow"
  - "Page integration pattern: conditional render below preceding pipeline stage using approvedCards.length > 0 gate"

requirements-completed:
  - STRC-01
  - STRC-02
  - STRC-03
  - STRC-04
  - STRC-05
  - STRC-06

# Metrics
duration: 1min
completed: 2026-03-03
---

# Phase 3 Plan 02: StructureReview Orchestration and Page Integration Summary

**Parallel dual-agent orchestration component calling story-flow and retention Claude agents via Promise.all, wired into page after QualityLoop approval with approvedCards state gate**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-03T12:43:19Z
- **Completed:** 2026-03-03T12:44:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created StructureReview.tsx with parallel Promise.all calls to story-flow and retention agents
- Prompt builders include "최대 3개 이하" cap instruction and full JSON schema with type-specific field documentation
- Proposal validation filters invalid raw proposals before setProposals (per-type required field checks, silent discard with console.warn)
- handleApply computes updated cards via applyProposals and fires onApplied callback
- callClaude and parseJsonFromText copied verbatim from QualityLoop.tsx (including anthropic-dangerous-direct-browser-access header, claude-sonnet-4-20250514 model)
- Updated page.tsx with approvedCards state, QualityLoop onApproved setting both states, and StructureReview rendered conditionally after quality approval

## Task Commits

Each task was committed atomically:

1. **Task 1: Create StructureReview.tsx — parallel agent orchestration** - `847ed74` (feat)
2. **Task 2: Integrate StructureReview into page.tsx** - `3d9e770` (feat)

## Files Created/Modified
- `components/card-news/structure/StructureReview.tsx` - Orchestration component with parallel Claude calls, proposal validation, accept/reject management, handleApply flow
- `app/card-news/page.tsx` - Added approvedCards state, updated QualityLoop onApproved to set both states, added conditional StructureReview render

## Decisions Made
- callClaude and parseJsonFromText copied verbatim (not reimplemented) from QualityLoop.tsx as directed by plan — ensures identical API call behavior
- handleApply uses direct applyProposals import rather than hook's applyAccepted method to avoid async state race: reading state.acceptedIds and state.proposals synchronously before setState batch
- approvedCards state receives quality-verified cards from QualityLoop and is passed to StructureReview so the structure agents always see the approved snapshot

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `hooks/use-toast.ts` (TS2783: 'id' specified more than once) was present before this plan and is out of scope. No new errors introduced.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- StructureReview.tsx is the final piece of the structure review pipeline
- Phase 3 is now complete: StructureSystem.tsx + ProposalList.tsx + StructureReview.tsx + page integration
- Phase 4 (design rendering) can proceed using the updated cards state from StructureReview.onApplied

## Self-Check: PASSED

- FOUND: components/card-news/structure/StructureReview.tsx
- FOUND: app/card-news/page.tsx (updated)
- FOUND commit 847ed74 (Task 1 - StructureReview.tsx)
- FOUND commit 3d9e770 (Task 2 - page.tsx integration)

---
*Phase: 03-structure-review*
*Completed: 2026-03-03*
