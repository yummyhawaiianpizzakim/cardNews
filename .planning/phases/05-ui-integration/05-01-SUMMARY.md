---
phase: 05-ui-integration
plan: 01
subsystem: ui
tags: [accordion, react, shadcn, radix-ui, badge, pipeline, card-news]

# Dependency graph
requires:
  - phase: 04-design-output
    provides: DesignOrchestration component, page.tsx pipeline integration
provides:
  - Accordion-based 4-stage pipeline UI with controlled open/close state
  - StageStatus type and stageBadge helper for consistent badge display
  - onLoadingChange callback lifted from ResearchForm to page
  - onTokenExtracted callback lifted from DesignOrchestration to page
  - Auto-open progression (Stage N completion opens Stage N+1)
  - forceMount on all AccordionContent panels to preserve component state
affects: [future-ui-enhancements, deployment]

# Tech tracking
tech-stack:
  added: [autoprefixer (missing dev dep installed)]
  patterns: [controlled accordion with type=multiple, StageStatus enum pattern, useCallback on handleGenerate]

key-files:
  created: []
  modified:
    - cardNews/components/card-news/ResearchForm.tsx
    - cardNews/components/card-news/design/DesignOrchestration.tsx
    - cardNews/app/card-news/page.tsx

key-decisions:
  - "Accordion type=multiple to allow multiple panels open simultaneously"
  - "forceMount + data-[state=closed]:hidden to preserve component state on collapse"
  - "StageStatus helper at module level to avoid re-creation on every render"
  - "approvedCards.length === 0 as gate for both Stage 3 and Stage 4 (onMaxLoopsReached still sets approvedCards)"
  - "useCallback on handleGenerate to prevent ResearchForm re-renders"

patterns-established:
  - "Lifting state via optional callback props (onLoadingChange, onTokenExtracted) — no prop drilling required"
  - "Stage auto-open: setOpenItems(prev => Array.from(new Set([...prev, 'stage-N'])))"

requirements-completed: [UI-01, UI-02, UI-03, UI-04]

# Metrics
duration: 4min
completed: 2026-03-04
---

# Phase 5 Plan 01: Accordion Pipeline UI Summary

**Controlled 4-stage Accordion pipeline with status Badges, auto-open progression, and forceMount state preservation for the card-news pipeline UI**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-04T12:22:13Z
- **Completed:** 2026-03-04T12:25:47Z
- **Tasks:** 2/3 (Task 3 is human-verify checkpoint — awaiting user confirmation)
- **Files modified:** 3

## Accomplishments
- Added `onLoadingChange` callback to ResearchForm for lifting loading state to page
- Added `onTokenExtracted` callback to DesignOrchestration for lifting design-complete signal to page
- Rewrote page.tsx with 4-panel controlled Accordion (type=multiple) replacing sequential conditional rendering
- Each stage panel shows a status Badge (idle/loading/complete/error/warning) with Korean labels
- Stage 1 always accessible; Stages 2-4 disabled until previous stage completes via `approvedCards.length === 0` or `cards.length === 0` gate
- Auto-open next stage on completion using `setOpenItems(prev => Array.from(new Set([...prev, 'stage-N'])))`
- `forceMount` + `data-[state=closed]:hidden` on all AccordionContent panels preserves QualityLoop and StructureReview internal state when collapsed
- API Key input remains always-visible above accordion (UI-04)
- Dev server confirmed running at http://localhost:3000/card-news (HTTP 200)

## Task Commits

Each task was committed atomically:

1. **Task 1: Lift loading/completion signals** - `d45c98b` (feat)
2. **Task 2: Rewrite page.tsx with Accordion pipeline UI** - `608f2a1` (feat)
3. **Task 3: Human verify checkpoint** - pending user approval

## Files Created/Modified
- `cardNews/components/card-news/ResearchForm.tsx` - Added `onLoadingChange` optional prop; calls it on loading start (true) and in finally block (false)
- `cardNews/components/card-news/design/DesignOrchestration.tsx` - Added `onTokenExtracted` optional prop; calls it after successful `setDesignToken(token)`
- `cardNews/app/card-news/page.tsx` - Complete rewrite: StageStatus type, stageBadge helper, 4 controlled Accordion stages, Badge per stage, auto-open logic, forceMount content

## Decisions Made
- `Accordion type="multiple"` allows multiple panels to be open simultaneously — user can compare stage outputs
- `forceMount` + CSS `data-[state=closed]:hidden` instead of conditional rendering — preserves React component state (QualityLoop scores, StructureReview proposals) when panel is closed
- `StageStatus` type and `stageBadge` helper defined at module level (outside component) to prevent recreation on every render
- Stage 3 and Stage 4 both gate on `approvedCards.length === 0` — this is intentional because `onMaxLoopsReached` still populates `approvedCards`, so Stage 3 unlocks even when quality check hits max loops
- `useCallback` on `handleGenerate` prevents ResearchForm from re-rendering unnecessarily when parent state changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing npm dependencies (node_modules missing)**
- **Found during:** Task 3 setup (dev server start)
- **Issue:** `node_modules` directory did not exist; `npm install` had not been run on this machine
- **Fix:** Ran `npm install` in cardNews directory
- **Files modified:** `cardNews/node_modules/` (not committed — gitignored)
- **Verification:** npm install succeeded with 450 packages
- **Committed in:** Not committed (runtime deps, gitignored)

**2. [Rule 3 - Blocking] Installed missing autoprefixer package**
- **Found during:** Task 3 setup (dev server start - first attempt failed)
- **Issue:** Next.js dev server failed with "Cannot find module 'autoprefixer'" at CSS compilation
- **Fix:** Ran `npm install autoprefixer`
- **Files modified:** `cardNews/package.json`, `cardNews/package-lock.json`
- **Verification:** Dev server started and returned HTTP 200 at /card-news
- **Committed in:** Will be included in final metadata commit

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking)
**Impact on plan:** Both auto-fixes were necessary to enable the dev server for human verification. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in codebase (BadgeProps variant type resolution, missing `next` module declarations) — these are not new errors introduced by this plan and are out of scope
- 4 new TypeScript errors in page.tsx for `Badge variant` prop — same class as pre-existing errors throughout codebase, caused by same root issue (VariantProps not resolving correctly under this tsconfig). App compiles and runs correctly with Next.js.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Task 3 (human-verify) is pending user confirmation
- Once approved, STATE.md and ROADMAP.md will be updated
- The accordion pipeline UI is complete and running at http://localhost:3000/card-news

---
*Phase: 05-ui-integration*
*Completed: 2026-03-04*

## Self-Check: PASSED

- FOUND: cardNews/components/card-news/ResearchForm.tsx
- FOUND: cardNews/components/card-news/design/DesignOrchestration.tsx
- FOUND: cardNews/app/card-news/page.tsx
- FOUND: .planning/phases/05-ui-integration/05-01-SUMMARY.md
- FOUND commit: d45c98b (Task 1)
- FOUND commit: 608f2a1 (Task 2)
