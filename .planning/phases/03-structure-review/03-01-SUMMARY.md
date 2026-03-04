---
phase: 03-structure-review
plan: 01
subsystem: ui
tags: [react, typescript, nextjs, shadcn, hooks, state-machine]

# Dependency graph
requires:
  - phase: 02-quality-verification
    provides: EvaluationSystem.tsx hook pattern, ScoreDisplay.tsx display decomposition pattern
  - phase: 01-research-copy-generation
    provides: CardNewsItem type from components/lib/types.ts
provides:
  - StructureProposal type with four proposal kinds (reorder, add, delete, edit)
  - StructureState with idle → reviewing → proposed → applying → done | error phase machine
  - useStructureSystem hook with full accept/reject management actions
  - applyProposals pure function applying proposals in edit→delete→add→reorder order
  - ProposalList UI component with per-proposal accept/reject toggles and bulk actions
  - ReviewingState loading placeholder component
affects:
  - 03-02-PLAN (StructureReview.tsx wires these two files together)
  - 04-design-rendering
  - 05-output-download

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "'use client' directive on all client components"
    - "useState + useCallback hook pattern mirroring EvaluationSystem.tsx"
    - "acceptedIds stored as string[] in state, converted to/from Set in actions"
    - "Opt-out model: setProposals initializes acceptedIds with ALL proposal IDs"
    - "applyProposals pure function for testable state transitions"

key-files:
  created:
    - components/card-news/structure/StructureSystem.tsx
    - components/card-news/structure/ProposalList.tsx
  modified: []

key-decisions:
  - "Opt-out model for proposal acceptance: all proposals accepted by default when setProposals called (per plan pitfall 5)"
  - "acceptedIds stored as string[] in StructureState for useState compatibility, converted to Set only inside toggle action"
  - "applyProposals applies in edit→delete→add→reorder order to handle conflicts correctly (delete+edit same target: edit skipped)"
  - "ProposalCard uses single onToggle callback for both accept and reject buttons to keep API minimal"

patterns-established:
  - "Structure hook mirrors EvaluationSystem pattern exactly: same section headers, useCallback for all actions, functional setState updates"
  - "Display component mirrors ScoreDisplay decomposition: internal sub-components not exported, public API is the compound component"

requirements-completed:
  - STRC-01
  - STRC-02
  - STRC-03
  - STRC-04
  - STRC-05
  - STRC-06

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 3 Plan 01: Structure Review Data and Display Layer Summary

**StructureProposal type system with state machine hook, conflict-aware applyProposals utility, and Korean accept/reject ProposalList UI using shadcn components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T12:39:02Z
- **Completed:** 2026-03-03T12:40:41Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created StructureSystem.tsx with ProposalType union, StructureProposal interface, StructureState, useStructureSystem hook, and applyProposals pure function
- Implemented opt-out acceptance model: all proposals accepted by default when setProposals is called
- Created ProposalList.tsx with per-proposal cards, bulk accept/reject buttons, progress bar, and disabled apply button when nothing selected
- All four proposal types (reorder, add, delete, edit) rendered with type-specific detail displays in Korean

## Task Commits

Each task was committed atomically:

1. **Task 1: Create StructureSystem.tsx - types, hook, applyProposals** - `007faa7` (feat)
2. **Task 2: Create ProposalList.tsx - accept/reject proposal UI** - `3924ecb` (feat)

## Files Created/Modified
- `components/card-news/structure/StructureSystem.tsx` - Types (ProposalType, StructureProposal, StructureState), state machine hook (useStructureSystem), and applyProposals utility
- `components/card-news/structure/ProposalList.tsx` - ProposalList compound component with ProposalCard internals and ReviewingState loading placeholder

## Decisions Made
- Opt-out model for proposal acceptance: all proposals accepted by default when setProposals is called, following plan pitfall 5 guidance
- acceptedIds stored as string[] in StructureState for useState compatibility, converted to Set only inside toggle action for O(1) lookups
- applyProposals applies proposals in edit→delete→add→reorder order so conflict detection (delete+edit same targetOrder) works correctly before the delete removes the card
- ProposalCard uses single onToggle callback for both accept and reject buttons — clicking either button toggles the current state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `hooks/use-toast.ts` (TS2783: 'id' specified more than once) was present before this plan and is out of scope. No new errors introduced.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- StructureSystem.tsx and ProposalList.tsx are the foundation files required by Plan 03-02
- Plan 03-02 can now create StructureReview.tsx which wires these two files together with the AI agent call
- TypeScript build passes with no new errors introduced by this plan

## Self-Check: PASSED

- FOUND: components/card-news/structure/StructureSystem.tsx
- FOUND: components/card-news/structure/ProposalList.tsx
- FOUND: .planning/phases/03-structure-review/03-01-SUMMARY.md
- FOUND commit 007faa7 (Task 1 - StructureSystem.tsx)
- FOUND commit 3924ecb (Task 2 - ProposalList.tsx)

---
*Phase: 03-structure-review*
*Completed: 2026-03-03*
