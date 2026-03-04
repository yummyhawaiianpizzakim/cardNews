---
phase: 02-quality-verification
plan: "02"
subsystem: ui
tags: [react, typescript, claude-api, parallel-agents, quality-loop, shadcn-ui]

# Dependency graph
requires:
  - phase: 01-research-copy-generation
    provides: CardNewsItem types and generated card content consumed by QualityLoop

provides:
  - EvaluationSystem: AgentEvaluation/AgentScoreHistory/ReviewResult types + useEvaluationSystem hook
  - ScoreDisplay: per-agent score cards with progress bars and averaged round display
  - QualityLoop: orchestration component running parallel Claude evaluation agents with auto-rewrite loop

affects: [03-structure-review, 04-design-output]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parallel Claude API calls via Promise.all for simultaneous agent evaluation"
    - "State machine pattern (idle/evaluating/approved/rewriting/failed) for evaluation phase tracking"
    - "Recursive async loop with max iteration guard for quality retry logic"

key-files:
  created:
    - components/card-news/quality/EvaluationSystem.tsx
    - components/card-news/quality/ScoreDisplay.tsx
    - components/card-news/quality/QualityLoop.tsx
  modified: []

key-decisions:
  - "Pass threshold set to 75 points average of two agents (hooking expert + copy editor)"
  - "Maximum 3 rewrite loops; on failure user is shown warning and can manually retry"
  - "Agent prompts request JSON-only output; parseJsonFromText strips markdown code fences for robustness"
  - "Rewrite uses agent comments as direct feedback to Claude for targeted improvement"

patterns-established:
  - "EvaluationSystem hook: centralised state machine separates concerns from UI components"
  - "AgentEvaluation score clamped to 0-100 after parsing to guard against malformed API responses"

requirements-completed: [QUAL-01, QUAL-02, QUAL-03]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 2 Plan 02: 에이전트 병렬 평가 시스템 Summary

**Parallel Claude agent quality evaluation system with 75-point pass threshold, automatic rewrite loop (max 3 iterations), and full score history UI using shadcn/ui components**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-03T11:59:59Z
- **Completed:** 2026-03-03T12:02:00Z
- **Tasks:** 3
- **Files modified:** 3 (all created)

## Accomplishments
- Typed state machine hook (`useEvaluationSystem`) managing the full evaluation lifecycle
- Parallel Claude API calls via `Promise.all` for hooking expert and copy editor agents
- Auto-rewrite loop: agent comments fed back into Claude for targeted improvement up to 3 times
- `ScoreDisplay` component renders per-agent scores, progress bars, comments, and round averages
- `QualityLoop` orchestration component with status bar, error handling, and user retry control

## Task Commits

Each task was committed atomically:

1. **Task 1: EvaluationSystem types and hook** - `80b8587` (feat)
2. **Task 2: ScoreDisplay UI component** - `b282c0b` (feat)
3. **Task 3: QualityLoop orchestration** - `107fde4` (feat)

## Files Created/Modified
- `components/card-news/quality/EvaluationSystem.tsx` - Core types (AgentEvaluation, AgentScoreHistory, ReviewResult, EvaluationState), utility functions (calcAverageScore, isApproved), and useEvaluationSystem hook
- `components/card-news/quality/ScoreDisplay.tsx` - AgentScoreCard, AverageScorePanel, EvaluationRound, ScoreDisplay components with shadcn/ui Card, Badge, Progress
- `components/card-news/quality/QualityLoop.tsx` - Main orchestration: Claude API calls, JSON parsing, parallel evaluation, rewrite loop, StatusBar, full UI with approved/failed states

## Decisions Made
- Pass threshold 75 points (average of two agents) per CONTEXT.md specification
- Max 3 loops hard-coded as `MAX_LOOPS = 3` constant exported for reuse
- `parseJsonFromText` strips markdown code fences before `JSON.parse` for robustness against Claude formatting variations
- Score values clamped to `[0, 100]` after parsing to guard against unexpected API responses
- Recursive async pattern for rewrite loop (rather than iterative) for clean state progression

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `hooks/use-toast.ts` (id specified twice) - unrelated to this plan, deferred.

## User Setup Required
None - no external service configuration required beyond the existing Claude API key flow.

## Next Phase Readiness
- Quality system is ready to be integrated into `app/card-news/page.tsx` after `CardNewsList` produces cards
- `QualityLoop` accepts `cards: CardNewsItem[]`, `apiKey: string`, `onApproved`, `onMaxLoopsReached` callbacks
- Phase 3 (structure review) can consume the approved cards from `onApproved`

---
*Phase: 02-quality-verification*
*Completed: 2026-03-03*

## Self-Check: PASSED

- FOUND: components/card-news/quality/EvaluationSystem.tsx
- FOUND: components/card-news/quality/ScoreDisplay.tsx
- FOUND: components/card-news/quality/QualityLoop.tsx
- FOUND: .planning/phases/02-quality-verification/02-02-SUMMARY.md
- FOUND commit: 80b8587 (EvaluationSystem)
- FOUND commit: b282c0b (ScoreDisplay)
- FOUND commit: 107fde4 (QualityLoop)
