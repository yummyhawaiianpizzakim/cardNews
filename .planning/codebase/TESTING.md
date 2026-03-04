# Testing Patterns

**Analysis Date:** 2026-03-04

## Test Framework

**Status:** Not implemented

**Current State:**
- No test files found in codebase (0 `.test.*` or `.spec.*` files)
- No test framework installed (Jest, Vitest, etc. not in devDependencies)
- No test configuration files (`jest.config.*`, `vitest.config.*`)
- Code is untested

**Development Strategy:**
- Manual testing only via `npm run dev`
- Relies on TypeScript strict mode for type safety
- Runtime validation through try-catch error handling

## Test File Organization

**Recommended Structure (not yet implemented):**
- Test files would co-locate with source: `ComponentName.tsx` → `ComponentName.test.tsx` in same directory
- Pattern observed in codebase suggests this would follow: `components/card-news/quality/QualityLoop.test.tsx` for testing `QualityLoop.tsx`
- System hooks would be tested separately: `EvaluationSystem.test.tsx`
- API routes would be tested: `app/api/anthropic/route.test.ts`

## Testing Gaps and Risks

**Untested Areas:**

1. **API Route Handler** (`app/api/anthropic/route.ts`)
   - Sequential API calls to Anthropic (research + copy generation)
   - JSON parsing and error handling
   - Request validation logic
   - Risk: Silent failures if response format changes; no validation that research context is properly passed

2. **State Management Hooks** (`EvaluationSystem.tsx`, `StructureSystem.tsx`)
   - Complex state transitions (idle → evaluating → approved/rewriting/failed)
   - Callback logic for recording evaluations
   - Loop counting and max-loop enforcement
   - Risk: State bugs could cause infinite loops or lost evaluations

3. **Proposal Application Logic** (`StructureSystem.tsx` - `applyProposals()`)
   - Complex 8-step algorithm: edit → delete → add → reorder → normalize
   - Conflict detection (e.g., edit + delete on same card)
   - Order renormalization
   - Risk: Edge cases like simultaneous operations could corrupt card order

4. **Client-Side Claude API Calls** (`QualityLoop.tsx` - `callClaude()`)
   - Direct Anthropic API calls from browser with dangerous header
   - JSON response parsing with markdown fence extraction
   - Parallel Promise.all for both agent evaluations
   - Risk: API errors, malformed responses, timeout handling not tested

5. **Form Validation** (`ResearchForm.tsx`)
   - Input trimming and required field checks
   - Error state display
   - Loading state management during API call
   - Risk: XSS if user input not properly escaped (though React should handle this)

6. **Quality Loop Recursion** (`QualityLoop.tsx` - `runEvaluationLoop()`)
   - Recursive calls up to MAX_LOOPS iterations
   - Proper unwinding on approval or max-loops reached
   - Comments modification for rewrite loop
   - Risk: Stack overflow on malformed responses; callback dependencies critical

7. **UI Component Rendering**
   - Component prop passing and conditional rendering
   - Status bar phase transitions
   - Score display with history
   - Risk: UI bugs, missing edge case renders

## Test Coverage Gaps by Priority

**High Priority (Core Logic):**
- `StructureSystem.applyProposals()` - Complex algorithm with 8 steps
- `app/api/anthropic/route.ts` - Data pipeline
- `EvaluationSystem` hook state machine
- `QualityLoop` recursive evaluation logic

**Medium Priority (Integration):**
- Full pipeline from form input → approved cards
- Error handling across async boundaries
- Modal/dialog cancellation and cleanup

**Low Priority:**
- UI styling and appearance
- Accessibility features (though should test)

## Recommended Test Implementation

### Unit Tests (No Framework Yet)
Would test pure functions first:
- `EvaluationSystem.calcAverageScore()` - Sum and average calculation
- `EvaluationSystem.isApproved()` - Threshold comparison
- `EvaluationSystem.buildEvaluationId()` - ID generation
- `StructureSystem.applyProposals()` - Complex algorithm with multiple scenarios

### Integration Tests
Would test hook and component interaction:
- `useEvaluationSystem()` with state transitions
- Quality loop with mocked Claude API responses
- Structure review with multiple proposal types

### E2E Tests (Not Currently Used)
Could use Playwright or Cypress:
- Full user journey: API key → form input → quality checks → structure review
- Happy path and error scenarios
- Network error handling

## Error Handling Testing Needs

**Currently Untested Error Scenarios:**

1. **API Failures:**
   - Network timeout on Anthropic API calls
   - 401/403 API key errors
   - Rate limiting (429 responses)
   - Malformed JSON responses

2. **State Edge Cases:**
   - Max loops enforcement (3 iterations max)
   - Missing cards array in state
   - Concurrent evaluation attempts
   - Memory leaks from recursive calls

3. **User Input:**
   - Empty topic/audience in form
   - Very long input strings
   - Special characters in prompts
   - API key with invalid format

4. **Response Parsing:**
   - JSON wrapped in markdown code fences
   - Malformed score values (non-integer, out of range)
   - Missing required fields in parsed response
   - Empty comment strings

## Manual Testing Checklist

Since no automated tests exist, manual testing follows this pattern:

**Development Workflow:**
1. `npm run dev` starts dev server at localhost:3000
2. Manual browser testing via `/card-news` page
3. Console error checking during usage
4. TypeScript compile errors caught at build time

**Current Test Approach:**
- Type safety via strict TypeScript (`tsconfig.json` with `"strict": true`)
- Error boundaries via try-catch blocks
- UI feedback for all error states
- No automated regression detection

---

*Testing analysis: 2026-03-04*

## Summary

**Status:** No testing framework installed or configured. Code is untested but uses TypeScript strict mode and try-catch error handling as safety mechanisms. Implementation of Jest or Vitest with test files would be a critical next step, starting with pure function tests (state utilities, proposal logic) before moving to integration tests.
