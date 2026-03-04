# Codebase Concerns

**Analysis Date:** 2026-03-04

## Tech Debt

**Duplicate API client code:**
- Issue: `callClaude()` function is duplicated identically in `QualityLoop.tsx` and `StructureReview.tsx` (lines 104-127 and 24-47 respectively)
- Files: `components/card-news/quality/QualityLoop.tsx`, `components/card-news/structure/StructureReview.tsx`
- Impact: Maintenance burden; any bug fix or API change must be updated in two places; increases risk of divergence between implementations
- Fix approach: Extract to a shared utility module `lib/anthropic-client.ts` with `callClaude()` and `parseJsonFromText()` functions; import both files

**Duplicate JSON parsing logic:**
- Issue: `parseJsonFromText()` function with identical regex logic appears in both `QualityLoop.tsx` (lines 129-134) and `StructureReview.tsx` (lines 49-54)
- Files: `components/card-news/quality/QualityLoop.tsx`, `components/card-news/structure/StructureReview.tsx`
- Impact: Changes to JSON extraction regex (e.g., to handle new model outputs) require updates in multiple places
- Fix approach: Move to shared utility with `callClaude()`

**Stage 4 (Image Output) unimplemented:**
- Issue: Image generation pipeline is documented but not implemented; placeholder only
- Files: `app/card-news/page.tsx` (line 33 mentions "최종 이미지 출력"), no Stage 4 component exists
- Impact: Feature advertised to users but not available; users reach approval flow and cannot export final images
- Fix approach: Implement image export stage using `html2canvas` (already in `package.json`) with 1080×1350px PNG output and ZIP download

**No error recovery mechanism for API failures:**
- Issue: When Claude API calls fail in `QualityLoop.tsx` or `StructureReview.tsx`, state is set to `failed`/`error` but no automatic retry or user-guided recovery
- Files: `components/card-news/quality/QualityLoop.tsx` (lines 243-245), `components/card-news/structure/StructureReview.tsx` (lines 233-235)
- Impact: Transient network errors permanently block the pipeline; users must reset and restart from stage 1
- Fix approach: Implement exponential backoff retry (2-3 attempts) before surfacing error to user; provide explicit "Retry" button

## Security Considerations

**API key stored in browser memory without expiration:**
- Risk: User's Anthropic API key lives in React component state (`apiKey` in `page.tsx` line 13) for entire session; no timeout or auto-clear
- Files: `app/card-news/page.tsx`, `components/card-news/ApiKeyInput.tsx`
- Current mitigation: Stored only in memory (not localStorage), cleared on page reload
- Recommendations:
  - Consider server-side session storage with signed cookies instead of passing key through client state
  - Add explicit "Clear API Key" button to manually purge from memory
  - Warn users not to share sessions or take screenshots with key visible (add disclaimer in `ApiKeyInput`)

**Client-side direct Anthropic API calls expose API key in network traffic:**
- Risk: `QualityLoop.tsx` and `StructureReview.tsx` make direct fetch calls to `https://api.anthropic.com/v1/messages` with `x-api-key` header from browser (lines 105-127 and 24-47)
- Files: `components/card-news/quality/QualityLoop.tsx`, `components/card-news/structure/StructureReview.tsx`
- Current mitigation: Uses `anthropic-dangerous-direct-browser-access` header (indicates awareness of risk)
- Recommendations:
  - Migrate evaluation and structure stages to server-side API routes (like Stage 1 already does in `app/api/anthropic/route.ts`)
  - This eliminates key exposure and enables rate limiting, logging, and quota enforcement
  - Extract shared prompt builders into utility functions that can be called from new server routes

**API key validation is minimal:**
- Risk: No validation that provided API key is actually valid before using it in expensive operations; first real test happens during first API call (Stage 1), wasting tokens on full pipeline
- Files: `app/api/anthropic/route.ts` (lines 28-33), `components/card-news/quality/QualityLoop.tsx` (lines 185-188)
- Current mitigation: Error messages on failure
- Recommendations: Add lightweight key validation endpoint that tests auth without consuming significant tokens (e.g., `models.list()`)

## Performance Bottlenecks

**Sequential API calls in Stage 1 (Research + Copy):**
- Problem: Research API call completes, then Copy generation happens serially using results (lines 45-78 in `route.ts`)
- Files: `app/api/anthropic/route.ts`
- Cause: Copy prompt depends on research output, unavoidable sequence
- Impact: Pipeline latency scales with network round-trip time × 2; each additional stage adds another round-trip
- Improvement path: Acceptable as-is since dependency is real; consider client-side loading UI improvements instead

**Synchronous state mutations in `applyProposals()`:**
- Problem: Multiple array mapping/filtering passes on card list (lines 38-126 in `StructureSystem.tsx`; 8 separate operations)
- Files: `components/card-news/structure/StructureSystem.tsx`
- Cause: Non-optimized implementation; each step creates new arrays
- Impact: For large card lists (100+ cards), noticeable lag when applying structure changes; currently acceptable (typical 8-12 cards)
- Improvement path: Optimize later if card counts exceed 50; current implementation readable and maintainable

**No pagination or virtualization for large card lists:**
- Problem: All cards render in DOM simultaneously via `CardNewsList.tsx` regardless of count
- Files: `components/card-news/CardNewsList.tsx`
- Impact: Negligible for current scope (8-12 cards typical); would become issue at 100+ cards
- Improvement path: Not urgent; add virtual scrolling if card counts exceed 50

## Fragile Areas

**Recursive evaluation loop in `QualityLoop.tsx`:**
- Files: `components/card-news/quality/QualityLoop.tsx` (lines 183-249)
- Why fragile: `runEvaluationLoop()` calls itself recursively (line 242) after rewrite, relying on closure over `state.loopCount`. Complex state transitions across multiple callbacks (`startEvaluation`, `recordEvaluationResult`, loop recursion) make control flow hard to trace. No explicit loop counter prevents infinite recursion if condition checks fail.
- Safe modification:
  - Add explicit loop counter as function parameter: `runEvaluationLoop(cards, loopNum = 0)` instead of relying on `state.loopCount`
  - Consider switching to a state machine pattern (e.g., XState) to model evaluation lifecycle explicitly
  - Test coverage: Add tests for MAX_LOOPS boundary conditions
- Test coverage: No unit tests present; logic relies on E2E testing in UI

**Unvalidated agent responses in evaluation:**
- Files: `components/card-news/quality/QualityLoop.tsx` (lines 199-215)
- Why fragile: After parsing JSON from Claude, score values are clamped (line 206) but assumptions about response shape are brittle; if Claude adds unexpected fields or changes format, silent parsing could fail
- Safe modification:
  - Add Zod or TypeScript validation schema for `{ score: number; comment: string }` before using
  - Add detailed logging when clamping occurs (if score > 100 or < 0)
- Test coverage: No validation tests

**Proposal application with conflicting edits/deletes:**
- Files: `components/card-news/structure/StructureSystem.tsx` (lines 38-126 in `applyProposals()`)
- Why fragile: Logic assumes no conflicts between accepted proposals (e.g., what if user accepts both "delete card 3" and "edit card 3"?). Current code handles this by checking deletions first (lines 44-49), but the interaction is implicit and not documented
- Safe modification:
  - Document assumption explicitly in comment above `applyProposals()`
  - Add conflict detection that warns user before applying (e.g., "Cannot edit card 3 if it's being deleted")
  - Add test cases for conflicting proposal combinations
- Test coverage: No tests for edge cases like conflicting proposals

**JSON response parsing assumes Claude always returns valid structure:**
- Files: `app/api/anthropic/route.ts` (lines 86-94), `components/card-news/quality/QualityLoop.tsx` (lines 199-200, 234)
- Why fragile: `JSON.parse()` wrapped in try-catch, but success path doesn't validate structure. If Claude returns `{ cards: null }` or missing required fields, downstream code crashes
- Safe modification:
  - Use runtime validation (Zod/io-ts) on all Claude responses before consuming
  - Add structured logging with response previews for debugging
- Test coverage: No tests for malformed responses

## Missing Critical Features

**No test coverage:**
- Problem: No unit tests, integration tests, or E2E tests in codebase
- Files: Entire project; no `*.test.ts` or `*.spec.ts` files
- Blocks: Confidence in refactoring; difficult to validate changes don't break recursive evaluation or proposal application logic
- Priority: High
- Approach: Start with tests for fragile areas: `applyProposals()`, JSON parsing, evaluation loop boundary conditions

**No input sanitization or length limits:**
- Problem: Topic and audience inputs have no character limits; can be arbitrarily long and cause prompt injection risks
- Files: `components/card-news/ResearchForm.tsx` (lines 25-26), `app/api/anthropic/route.ts` (lines 14-26)
- Blocks: Unpredictable prompt sizes; potential cost overruns
- Priority: Medium
- Approach: Add client-side maxLength to textareas (e.g., 500 chars); server-side validation in route

**No API cost estimation or quota management:**
- Problem: No tracking of tokens consumed; users can accidentally spend significant budget
- Files: No cost-tracking code exists
- Blocks: Cost-conscious users cannot estimate expenses
- Priority: Low (nice-to-have for production)
- Approach: Log token counts from API responses; surface to user after each stage

**No offline mode or draft persistence:**
- Problem: All work lost on browser close; no way to save progress and return later
- Files: State only in React (`useState`); no localStorage or database persistence
- Blocks: Long sessions require uninterrupted connection
- Priority: Low
- Approach: Add localStorage persistence for cards and evaluation history with version stamps

## Test Coverage Gaps

**Evaluation loop boundary conditions:**
- What's not tested: MAX_LOOPS enforcement, approval threshold transitions, state consistency after recursion
- Files: `components/card-news/quality/EvaluationSystem.tsx`, `components/card-news/quality/QualityLoop.tsx`
- Risk: Infinite loops or unexpected phase transitions undetected
- Priority: High

**Proposal application edge cases:**
- What's not tested: Conflicting delete+edit, out-of-bounds indices, empty proposal lists
- Files: `components/card-news/structure/StructureSystem.tsx`
- Risk: Silent data corruption or index errors
- Priority: High

**JSON parsing error handling:**
- What's not tested: Malformed JSON, missing required fields, unexpected types
- Files: `components/card-news/quality/QualityLoop.tsx`, `components/card-news/structure/StructureReview.tsx`
- Risk: Unhandled parsing errors crash component mid-pipeline
- Priority: Medium

**API error scenarios:**
- What's not tested: Network timeouts, rate limits, 401 auth errors, malformed responses
- Files: `app/api/anthropic/route.ts`, `components/card-news/quality/QualityLoop.tsx`, `components/card-news/structure/StructureReview.tsx`
- Risk: No known behavior on API failure; users face cryptic errors
- Priority: Medium

**Form validation:**
- What's not tested: Empty inputs, whitespace-only inputs, extremely long inputs
- Files: `components/card-news/ResearchForm.tsx`
- Risk: Unexpected prompts sent to API
- Priority: Low

---

*Concerns audit: 2026-03-04*
