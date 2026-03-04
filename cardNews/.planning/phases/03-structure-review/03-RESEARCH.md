# Phase 3: Structure Review - Research

**Researched:** 2026-03-03
**Domain:** Multi-agent card flow analysis with accept/reject UI in Next.js client-side architecture
**Confidence:** HIGH

## Summary

Phase 3 builds a "structure review" layer that sits immediately after the quality-verification loop (Phase 2). Two AI agents run in parallel — a Story Flow agent and a Reader Retention agent — and together produce structured suggestions for card reordering, card addition/deletion, and per-card text edits. The user then sees each suggestion in a diff-style accept/reject UI before the changes are committed to state.

The domain splits into two independent halves: (1) the multi-agent orchestration pattern (already proven in Phase 2 via `QualityLoop.tsx` + `useEvaluationSystem`), and (2) a new "proposal/patch" UI pattern that has no existing analogue in the codebase. The Phase 2 parallel-call pattern (`Promise.all` over two `callClaude` calls) maps directly here; the accept/reject UI is the only genuinely new surface.

No external libraries beyond what already exists in `package.json` are required. All Claude calls continue to use the direct browser fetch pattern with `anthropic-dangerous-direct-browser-access: true`.

**Primary recommendation:** Mirror the QualityLoop / EvaluationSystem split (orchestration hook + display component) but add a `StructureProposal` type that carries discrete, individually-acceptable suggestions. Render proposals as a diff list with per-item and "accept all / reject all" buttons.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRC-01 | 2개 에이전트가 전체 카드 구성을 검토한다 | Phase 2 parallel `Promise.all` pattern applies directly |
| STRC-02 | 스토리 흐름 에이전트는 카드 순서가 논리적으로 연결되는지 검토한다 | Prompt engineering: agent receives ordered card list, outputs JSON suggestions |
| STRC-03 | 스토리 흐름 에이전트는 스크롤을 유도하는 흐름인지 검토한다 | Same agent prompt; second evaluation axis alongside logical order |
| STRC-04 | 독자 이탈 방지 에이전트는 각 카드가 다음 카드로 넘기고 싶은 궁금증을 남기는지 검토한다 | Second parallel agent with separate system prompt |
| STRC-05 | 검토 결과로 카드 순서 재배열/카드 추가·삭제/카드별 텍스트 수정을 자동 제안한다 | Structured JSON response schema; merge both agents' suggestions before rendering |
| STRC-06 | 사용자가 수락/거절할 수 있는 UI를 제공한다 | New `StructureReviewPanel` component; per-proposal checkbox or button pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | ^19.0.0 | UI state, hooks | Already in project |
| Next.js App Router | ^15.1.0 | Client component hosting | Already in project |
| Anthropic SDK (browser fetch) | ^0.33.0 | Claude API calls | Established pattern in QualityLoop |
| shadcn/ui (Card, Badge, Button, Progress) | current | UI components | Project standard; all pieces exist |
| Tailwind CSS | ^3.4.17 | Styling | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.469.0 | Icons (CheckCircle, XCircle, ArrowUpDown) | Accept/reject/reorder icons in suggestion list |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom accept/reject list | react-beautiful-dnd drag-and-drop | Only needed if user can manually drag to reorder; out of scope for v1 — accept/reject of AI suggestions is sufficient |
| Plain fetch in component | @anthropic-ai/sdk streaming | Streaming not needed; single-shot JSON responses are cleaner for structured output |

**Installation:** No new packages required. All dependencies already in `package.json`.

## Architecture Patterns

### Recommended Project Structure
```
components/card-news/
├── quality/                  # Phase 2 (already exists)
│   ├── EvaluationSystem.tsx
│   ├── QualityLoop.tsx
│   └── ScoreDisplay.tsx
└── structure/                # Phase 3 (new)
    ├── StructureSystem.tsx   # types, hook, utilities (mirrors EvaluationSystem.tsx)
    ├── StructureReview.tsx   # orchestration component (mirrors QualityLoop.tsx)
    └── ProposalList.tsx      # accept/reject UI (mirrors ScoreDisplay.tsx)
```

### Existing CardNewsItem type (authoritative — from components/lib/types.ts)
```typescript
export interface CardNewsItem {
  type: 'cover' | 'body' | 'cta';
  headline: string;
  subtext: string;
  order: number;
}
```

Note: The additional context mentioned `'content'` as a type value, but the actual source file uses `'body'`. Use `'body'` throughout Phase 3.

### Pattern 1: Parallel Agent Calls (proven in Phase 2)
**What:** Two Claude API calls fire simultaneously via `Promise.all`; results are merged.
**When to use:** Any time two independent agents evaluate the same input.
**Example:**
```typescript
// Source: components/card-news/quality/QualityLoop.tsx (existing)
const [storyRaw, retentionRaw] = await Promise.all([
  callClaude(apiKey, buildStoryFlowPrompt(cards)),
  callClaude(apiKey, buildRetentionPrompt(cards)),
]);
```

### Pattern 2: Structured JSON Proposal Schema
**What:** Each Claude agent returns a typed list of discrete change proposals.
**When to use:** When the user needs to accept or reject individual changes.
**Example:**
```typescript
// Source: design derived from project patterns
export type ProposalType = 'reorder' | 'add' | 'delete' | 'edit';

export interface StructureProposal {
  id: string;                     // unique per proposal, e.g. "prop-0-reorder-2"
  type: ProposalType;
  source: 'story-flow' | 'retention';
  reason: string;                 // displayed to user — why is this change suggested?
  // For 'reorder':
  fromOrder?: number;
  toOrder?: number;
  // For 'add':
  insertAfterOrder?: number;
  newCard?: Omit<CardNewsItem, 'order'>;
  // For 'delete':
  targetOrder?: number;
  // For 'edit':
  targetOrder?: number;
  newHeadline?: string;
  newSubtext?: string;
}
```

### Pattern 3: State Machine Hook (mirrors EvaluationSystem.tsx)
**What:** A `useStructureSystem` hook manages phase transitions: `idle → reviewing → proposed → applying | cancelled`.
**When to use:** Same as Phase 2 — keeps component logic clean.
**Example:**
```typescript
// Source: mirrors components/card-news/quality/EvaluationSystem.tsx
export interface StructureState {
  phase: 'idle' | 'reviewing' | 'proposed' | 'applying' | 'done' | 'error';
  proposals: StructureProposal[];
  acceptedIds: Set<string>;
  error: string | null;
}

export function useStructureSystem() {
  const [state, setState] = useState<StructureState>(createInitialState());
  // startReview, setProposals, toggleAccept, acceptAll, rejectAll, applyAccepted, setError, reset
  return { state, ...actions };
}
```

### Pattern 4: Claude Prompt — Structured JSON Output
**What:** Force JSON-only responses from Claude using explicit schema instruction.
**When to use:** Every Claude call in this phase.
**Example:**
```typescript
function buildStoryFlowPrompt(cards: CardNewsItem[]): string {
  const cardSummary = cards
    .map((c) => `[${c.type.toUpperCase()} order=${c.order}]\n헤드라인: ${c.headline}\n서브텍스트: ${c.subtext}`)
    .join('\n\n');

  return `당신은 카드뉴스 스토리 흐름 전문가입니다. 다음 카드뉴스의 카드 순서와 논리적 흐름을 분석하고, 스크롤을 유도하는 흐름인지 검토하세요.

카드뉴스:
${cardSummary}

반드시 다음 JSON 형식으로만 응답하세요. proposals 배열이 비어있으면 변경 불필요:
{
  "summary": "<전체 흐름 분석 1~2문장>",
  "proposals": [
    {
      "type": "reorder"|"add"|"delete"|"edit",
      "reason": "<변경 이유>",
      "fromOrder": <number, reorder일 때>,
      "toOrder": <number, reorder일 때>,
      "insertAfterOrder": <number, add일 때>,
      "newCard": { "type": "body", "headline": "...", "subtext": "..." },
      "targetOrder": <number, delete/edit일 때>,
      "newHeadline": "<string, edit일 때>",
      "newSubtext": "<string, edit일 때>"
    }
  ]
}`;
}
```

### Pattern 5: Accept/Reject UI (ProposalList)
**What:** Renders each proposal as a card with accept (green checkmark) / reject (red X) toggle. Shows "Accept All" / "Reject All" buttons. Apply button commits accepted changes.
**When to use:** After both agents return proposals.
**Example:**
```typescript
// Per-proposal item pattern using shadcn/ui primitives
<Card key={proposal.id} className={accepted ? 'border-green-400' : 'border-muted'}>
  <CardContent className="flex items-start justify-between gap-4 pt-4">
    <div className="space-y-1">
      <Badge variant="outline">{proposalTypeLabel[proposal.type]}</Badge>
      <Badge variant="secondary" className="ml-2">{sourceLabel[proposal.source]}</Badge>
      <p className="text-sm">{proposal.reason}</p>
      {/* show diff preview for edit proposals */}
    </div>
    <div className="flex gap-2 shrink-0">
      <Button size="icon" variant={accepted ? 'default' : 'outline'} onClick={() => toggleAccept(proposal.id)}>
        <CheckIcon className="h-4 w-4" />
      </Button>
      <Button size="icon" variant={!accepted ? 'destructive' : 'outline'} onClick={() => toggleReject(proposal.id)}>
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  </CardContent>
</Card>
```

### Pattern 6: Applying Proposals to CardNewsItem[]
**What:** Pure function that takes the accepted proposals and the current card array and returns a new card array.
**When to use:** When the user clicks "Apply" after selecting proposals.

The application order matters:
1. Apply `edit` first (no structural change)
2. Apply `delete` (remove cards, adjust order)
3. Apply `add` (insert cards at correct positions)
4. Apply `reorder` (swap order values)
5. Re-sort by `order` and re-number sequentially (0, 1, 2...)

```typescript
// Source: design pattern from project
function applyProposals(cards: CardNewsItem[], accepted: StructureProposal[]): CardNewsItem[] {
  let result = [...cards];
  // apply edits first, then structural changes
  // always re-normalize order at the end
  return result.sort((a, b) => a.order - b.order)
    .map((card, idx) => ({ ...card, order: idx }));
}
```

### Anti-Patterns to Avoid
- **Mutating CardNewsItem objects directly:** Always spread into new objects; cards state is shared upstream with QualityLoop.
- **Applying proposals in arbitrary order:** `add` before `delete` can produce duplicate order values. Always normalize after all mutations.
- **Sending card arrays with gaps in order:** After deletions, re-number from 0 sequentially before passing to Claude in any future call.
- **Single monolithic component:** Phase 2 proved that separating types/hook (EvaluationSystem) from orchestration (QualityLoop) from display (ScoreDisplay) keeps code testable and readable. Do the same here.
- **Using React state directly for accepted set:** Use `Set<string>` (serialized to array for useState) rather than an array + `.includes()` for O(1) toggle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON parsing from Claude response | Custom regex parser | `parseJsonFromText` from QualityLoop (or copy verbatim) | Handles markdown code fences already |
| Claude API fetch | New fetch wrapper | Copy `callClaude` helper from QualityLoop | Same headers, same error handling |
| Icon buttons | Custom SVG icons | `lucide-react` (already installed: `CheckIcon`, `XCircleIcon`) | Consistent sizing, accessible |
| Card list diff display | Custom diff algorithm | Simple before/after text display per proposal | No need for character-level diff — just show reason + what changes |

**Key insight:** The project already has `parseJsonFromText` and `callClaude` in `QualityLoop.tsx`. Extract these to a shared `lib/claude.ts` or copy them into `StructureReview.tsx`. Do NOT build a new fetch abstraction.

## Common Pitfalls

### Pitfall 1: Order Gaps After Delete
**What goes wrong:** After deleting card at order=2 from a 6-card set, orders become [0,1,3,4,5]. The next Claude call or `add` proposal at `insertAfterOrder=2` silently fails.
**Why it happens:** Order values are used as addresses. Deletion creates holes.
**How to avoid:** After every structural mutation (add or delete), run `cards.map((c, i) => ({ ...c, order: i }))` to re-normalize.
**Warning signs:** New proposals reference order values that don't exist in the current array.

### Pitfall 2: Merging Conflicting Proposals from Two Agents
**What goes wrong:** Story Flow agent says "delete card at order=3"; Retention agent says "edit card at order=3". Both are applied → crash / wrong result.
**Why it happens:** Agents operate independently and may target the same card.
**How to avoid:** When rendering proposals, detect conflicts (same `targetOrder` targeted by both `delete` and `edit`). Mark conflicting proposals; if a delete is accepted, auto-reject edits on that same card.
**Warning signs:** Console error when applying proposals — target card not found.

### Pitfall 3: Claude Returns Invalid JSON with Proposal Omissions
**What goes wrong:** Claude occasionally omits required fields (`fromOrder` on a `reorder` proposal). Applying the proposal throws.
**Why it happens:** LLM output is probabilistic. Complex schemas increase omission rate.
**How to avoid:** Validate each proposal object after parsing. If required fields are missing, discard the proposal silently (don't error the entire review). Log discarded proposals in dev.
**Warning signs:** Type errors when accessing `proposal.fromOrder` — it's `undefined`.

### Pitfall 4: Stale Cards Passed to Structure Review
**What goes wrong:** User edits cards manually in `CardNewsList` after quality loop approved them. The edited cards are not passed to `StructureReview` — it uses the approved-version snapshot.
**Why it happens:** `onApproved` in `QualityLoop` captures cards at approval time; page state `cards` may have since changed.
**How to avoid:** Pass the current `cards` state (not the snapshot from `onApproved`) into `StructureReview`. The page component already maintains `const [cards, setCards]` — use that.
**Warning signs:** User sees structure suggestions that reference old text.

### Pitfall 5: Accept Set Not Initialized
**What goes wrong:** When proposals first arrive, none are pre-selected. User clicks "Apply" immediately → nothing changes. Confusing UX.
**Why it happens:** Default state `acceptedIds = new Set()`.
**How to avoid:** Initialize `acceptedIds` with ALL proposal IDs when proposals are set (opt-out model: accept all by default, user rejects what they don't want). Or display a clear "0 of N selected" counter and disable Apply until at least one is selected.
**Warning signs:** "Apply" button works but cards don't change.

## Code Examples

### callClaude helper (copy from QualityLoop.tsx — do not re-implement)
```typescript
// Source: components/card-news/quality/QualityLoop.tsx (existing)
async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorBody}`);
  }
  const data = await response.json();
  return data.content[0].text as string;
}
```

### parseJsonFromText helper (copy from QualityLoop.tsx)
```typescript
// Source: components/card-news/quality/QualityLoop.tsx (existing)
function parseJsonFromText(text: string): unknown {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(raw);
}
```

### Parallel agent review pattern
```typescript
// Source: mirrors QualityLoop.tsx Promise.all pattern
const [storyRaw, retentionRaw] = await Promise.all([
  callClaude(apiKey, buildStoryFlowPrompt(cards)),
  callClaude(apiKey, buildRetentionPrompt(cards)),
]);

const storyParsed = parseJsonFromText(storyRaw) as { summary: string; proposals: RawProposal[] };
const retentionParsed = parseJsonFromText(retentionRaw) as { summary: string; proposals: RawProposal[] };

// Merge and assign source, generate unique IDs
const allProposals: StructureProposal[] = [
  ...storyParsed.proposals.map((p, i) => ({ ...p, id: `story-${i}`, source: 'story-flow' as const })),
  ...retentionParsed.proposals.map((p, i) => ({ ...p, id: `retention-${i}`, source: 'retention' as const })),
];
```

### Page integration pattern
```typescript
// Source: app/card-news/page.tsx — add after QualityLoop
const [approvedCards, setApprovedCards] = useState<CardNewsItem[]>([]);

// In JSX, after QualityLoop:
{approvedCards.length > 0 && (
  <>
    <hr className="border-border" />
    <StructureReview
      cards={approvedCards}
      apiKey={apiKey}
      onApplied={(updatedCards) => {
        setApprovedCards(updatedCards);
        setCards(updatedCards); // keep page state in sync
      }}
    />
  </>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sequential Claude calls | Parallel `Promise.all` | Phase 2 established | Both agents respond together, not one waiting for the other |
| Accept all AI suggestions automatically | Per-suggestion accept/reject | Phase 3 (new) | User maintains editorial control |

**Deprecated/outdated:**
- `'content'` card type: The additional context mentioned `type: 'cover'|'content'|'cta'` but the actual `components/lib/types.ts` uses `'body'` not `'content'`. Use `'body'` in all Phase 3 code. Do not introduce `'content'`.

## Open Questions

1. **Where should `callClaude` and `parseJsonFromText` live?**
   - What we know: Both are currently duplicated between any future phase files; they already exist only in `QualityLoop.tsx`.
   - What's unclear: The planner must decide — copy-paste into `StructureReview.tsx` (fast, zero refactor risk) or extract to `components/lib/claude.ts` (cleaner, touches existing file).
   - Recommendation: For Phase 3 only, copy-paste. If Phase 4 also needs Claude calls, extract to shared lib then.

2. **Should structure review run automatically after quality approval, or require a manual trigger?**
   - What we know: Phase 2's `QualityLoop` uses a manual "품질 검수 시작" button. The page wires `onApproved` to update state.
   - What's unclear: STRC-06 specifies a user accept/reject UI for proposals but not for starting the review itself.
   - Recommendation: Add a manual "구조 검토 시작" button (consistent with Phase 2). Auto-trigger would run even when user doesn't want it.

3. **How many proposals should Claude generate per agent?**
   - What we know: No upper bound is specified in requirements.
   - What's unclear: Too many proposals overwhelm the user; too few add no value.
   - Recommendation: Cap at 3 proposals per agent (6 total max) in the prompt instruction. Instruct Claude: "최대 3개 이하의 제안만 출력하세요."

## Sources

### Primary (HIGH confidence)
- `components/card-news/quality/QualityLoop.tsx` — parallel agent call pattern, callClaude, parseJsonFromText
- `components/card-news/quality/EvaluationSystem.tsx` — state machine hook pattern
- `components/card-news/quality/ScoreDisplay.tsx` — display component decomposition pattern
- `components/lib/types.ts` — authoritative CardNewsItem type (uses `'body'` not `'content'`)
- `package.json` — exact dependency versions
- `app/card-news/page.tsx` — existing page integration points

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — STRC-01 through STRC-06 definitions
- `.planning/STATE.md` — confirmed tech stack decisions and claude model: `claude-sonnet-4-20250514`
- `.planning/phases/01-research-copy-generation/01-CONTEXT.md` — upstream context and existing component inventory

### Tertiary (LOW confidence)
- None — all research based on project's own code and authoritative requirements documents.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json, no new packages needed
- Architecture: HIGH — directly mirrors proven Phase 2 patterns in the same codebase
- Pitfalls: HIGH — derived from code analysis of actual CardNewsItem type and QualityLoop implementation
- Prompt engineering: MEDIUM — JSON schema design is reasonable but Claude's exact compliance must be tested at implementation time

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable stack, internal codebase patterns)
