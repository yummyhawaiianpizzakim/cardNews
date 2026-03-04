# Architecture

**Analysis Date:** 2026-03-04

## Pattern Overview

**Overall:** Four-stage sequential AI pipeline with separated state management and UI components

**Key Characteristics:**
- Client-side and server-side Claude API calls at different stages
- State logic decoupled from UI components (*System.tsx hooks paired with component files)
- Direct browser access to Anthropic API for quality and structure evaluation stages
- Progressive form-based input → output flow with manual intervention points
- Iterative refinement loops with configurable thresholds and max attempts

## Layers

**Presentation Layer (UI):**
- Purpose: Render forms, display results, manage user interactions
- Location: `app/card-news/page.tsx`, `components/card-news/*.tsx`, `components/ui/*`
- Contains: React components using shadcn/ui, form inputs, card displays, proposal lists
- Depends on: State hooks, types, API calls
- Used by: End users in browser

**State Management Layer:**
- Purpose: Handle complex state transitions and business logic without UI coupling
- Location: `components/card-news/quality/EvaluationSystem.tsx`, `components/card-news/structure/StructureSystem.tsx`
- Contains: Custom hooks (`useEvaluationSystem`, `useStructureSystem`), state factories, utility functions
- Depends on: Types, React hooks
- Used by: UI components that need state management

**API Layer:**
- Purpose: Communication with Anthropic Claude and internal server endpoints
- Location: `app/api/anthropic/route.ts` (server), inline `callClaude()` in QualityLoop.tsx and StructureReview.tsx (client)
- Contains: Request/response handling, error validation, prompt building
- Depends on: Anthropic SDK, types
- Used by: Components and hooks during pipeline execution

**Type Layer:**
- Purpose: Centralized type definitions for domain objects
- Location: `components/lib/types.ts`
- Contains: Interfaces for CardNewsItem, CardNewsResponse, ResearchSource, GenerateRequest
- Depends on: Nothing (pure types)
- Used by: All other layers

## Data Flow

**Stage 1: Research & Copy Generation**

1. User enters topic, target audience, and API key in `ResearchForm`
2. Client calls `POST /api/anthropic` with GenerateRequest
3. Server creates Anthropic client with user's API key
4. First Claude call (web search enabled via `anthropic-beta: tools-2025-09-04` header) researches topic
5. Second Claude call generates structured copy as JSON: CardNewsResponse with cards array and researchSources array
6. Response returned to client, triggers `onGenerate` callback
7. Cards displayed in `CardNewsList` (allows inline editing)
8. Research sources displayed in `ResearchResults`

**Stage 2: Quality Loop (Client-side)**

1. User clicks "품질 검수 시작" in `QualityLoop`
2. `runEvaluationLoop` runs:
   - Parallel Claude calls: `hooking` agent (scores engagement) and `copy` agent (scores quality)
   - Both agents score 0–100 using `buildHookingAgentPrompt()` and `buildCopyAgentPrompt()`
   - Average score calculated via `calcAverageScore()`
   - Score history recorded in EvaluationSystem state
3. If average ≥ 75 (`PASS_THRESHOLD`): cards approved, moved to Stage 3
4. If average < 75 and loops < 3 (`MAX_LOOPS`): rewrite agent improves cards, loop recursively
5. If max loops reached: cards moved to Stage 3 with notification
6. `ScoreDisplay` renders loop history and current scores

**Stage 3: Structure Review (Client-side)**

1. User clicks "구조 검토 시작" in `StructureReview`
2. `runStructureReview` runs:
   - Parallel Claude calls: `story-flow` agent (ordering, flow) and `retention` agent (engagement, curiosity)
   - Agents return proposals (up to 3 each) for reorder/add/delete/edit operations
   - Proposals validated via `validateRawProposal()` and mapped to StructureProposal type
3. `ProposalList` displays proposals, user selects which to accept
4. `applyProposals()` applies accepted proposals in order: edit → delete → re-order → add → re-sort
5. Cards updated with final structure, passed to Stage 4

**Stage 4: Image Output**

- Not yet implemented (planned: html2canvas → 1080×1350px PNG download)

**State Management:**

- Page-level state in `CardNewsPage` (cardNewsData, cards, approvedCards) manages flow between stages
- EvaluationSystem state tracks loop history, scores, phase transitions (idle → evaluating → approved/rewriting/failed)
- StructureSystem state tracks proposals, accepted IDs, review phase
- Each stage reads from previous stage's output; no global state manager (all props/callbacks)

## Key Abstractions

**CardNewsItem:**
- Purpose: Represents a single card in the news sequence
- Examples: `type: 'cover' | 'body' | 'cta'`, `headline` (1 line), `subtext` (2–3 lines), `order` (sequence position)
- Pattern: Immutable data structure; modifications create new arrays

**CardNewsResponse:**
- Purpose: Complete structured output from AI generation (Stage 1)
- Examples: Contains `cards: CardNewsItem[]` and `researchSources: ResearchSource[]`
- Pattern: Single source of truth after Stage 1; progressively refined through stages

**AgentEvaluation:**
- Purpose: Score and comment from a single evaluation agent
- Examples: `{ agentId, agentType: 'hooking' | 'copy', score: 0–100, comment: string }`
- Pattern: Immutable, recorded in history; multiple evaluations averaged for pass/fail decision

**StructureProposal:**
- Purpose: Suggested structural change from analysis agents
- Examples: Type `reorder | add | delete | edit` with agent source `story-flow | retention`
- Pattern: Validated before application; user explicitly accepts/rejects before applying

**AgentScoreHistory:**
- Purpose: Snapshot of evaluations at each loop iteration
- Examples: Tracks loop index, all agent scores, average, approval status, timestamp
- Pattern: Immutable log; enables inspection of refinement process

## Entry Points

**`app/page.tsx` (Home):**
- Location: `app/page.tsx`
- Triggers: Initial page load at `/`
- Responsibilities: Landing page with link to `/card-news`

**`app/card-news/page.tsx` (Card News Pipeline):**
- Location: `app/card-news/page.tsx`
- Triggers: User navigates to `/card-news`
- Responsibilities: Main page component; orchestrates all four stages; manages flow state (cardNewsData, cards, approvedCards)

**`app/api/anthropic/route.ts` (Research & Copy Generation):**
- Location: `app/api/anthropic/route.ts`
- Triggers: POST request from `ResearchForm.handleSubmit()` via `fetch('/api/anthropic')`
- Responsibilities: Execute Stage 1 (web search research + structured copy generation); validate inputs; return JSON

**`components/card-news/quality/QualityLoop.tsx` (Quality Evaluation):**
- Location: `components/card-news/quality/QualityLoop.tsx`
- Triggers: User clicks "품질 검수 시작" button
- Responsibilities: Execute Stage 2 (parallel agent evaluation, recursive refinement); display scores and history

**`components/card-news/structure/StructureReview.tsx` (Structure Analysis):**
- Location: `components/card-news/structure/StructureReview.tsx`
- Triggers: User clicks "구조 검토 시작" button after approval
- Responsibilities: Execute Stage 3 (parallel agent analysis, proposal generation and user selection); apply accepted changes

## Error Handling

**Strategy:** Try-catch blocks with user-facing error messages; failed API calls abort current stage without affecting previous data

**Patterns:**

- **Server-side (route.ts):** Validate request fields; return 400 for missing inputs, 500 for API errors with descriptive messages
  ```typescript
  if (!topic || topic.trim() === '') {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }
  ```

- **Client-side (QualityLoop, StructureReview):** Wrap async calls in try-catch; call `setError(message)` to update phase to 'error' and display toast
  ```typescript
  } catch (err) {
    setError(err instanceof Error ? err.message : '평가 중 오류가 발생했습니다.');
  }
  ```

- **JSON Parsing:** Use `parseJsonFromText()` to extract JSON from Claude response (handles markdown code fences and raw JSON)
  ```typescript
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  ```

- **API Errors:** Catch fetch failures and non-200 responses; log to console; show generic user message to avoid exposing internals

## Cross-Cutting Concerns

**Logging:** Console.error for unexpected errors (JSON parse failures, proposal validation issues); no external logging service

**Validation:**
- Input validation on server (topic, audience, apiKey required)
- Proposal validation in StructureReview before application (`validateRawProposal()`)
- Card validation in Quality loop (ensure non-empty cards array before rewrite)

**Authentication:**
- No persistent authentication; API key supplied by user at runtime per session
- Key passed in request body (server-side Stage 1) and headers (client-side Stages 2–3 with `x-api-key`)
- Key stored in React state only; never persisted to localStorage or server

**Type Safety:** TypeScript strict mode enabled; all component props and state are typed via centralized types.ts

---

*Architecture analysis: 2026-03-04*
