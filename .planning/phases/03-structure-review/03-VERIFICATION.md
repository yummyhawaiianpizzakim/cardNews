---
phase: 03-structure-review
verified: 2026-03-03T00:00:00Z
status: gaps_found
score: 9/11 must-haves verified
re_verification: false
gaps:
  - truth: "Clicking '변경 적용' applies accepted proposals and onApplied callback fires with updated cards — AND phase transitions to done"
    status: partial
    reason: "handleApply correctly computes updatedCards via applyProposals and fires onApplied, but never transitions state.phase to 'applying' or 'done'. The phase stays at 'proposed' permanently after apply. The success message (state.phase === 'done' block, line 301) and the reset button (lines 259-261) are both unreachable in normal flow."
    artifacts:
      - path: "components/card-news/structure/StructureReview.tsx"
        issue: "handleApply (lines 237-243) calls onApplied but never calls applyAccepted, setState, or any action that transitions phase to 'applying' → 'done'. The hook exposes applyAccepted which performs this transition, but it is not called."
    missing:
      - "In handleApply, after calling onApplied(updatedCards), also call a state transition to set phase to 'done' — either by calling the hook's applyAccepted (which handles the transition internally) or by adding a setState call that sets phase to 'done'. The plan explicitly states phase must move through 'applying' → 'done' on apply."
human_verification:
  - test: "Visual: 구조 검토 완료 success state"
    expected: "After clicking '변경 적용', the success message '구조 검토가 완료되었습니다. 변경사항이 적용되었습니다.' appears, and a '다시 검토' reset button appears in the card header"
    why_human: "The phase transition gap (gap above) means this cannot currently be reached. Once the gap is fixed, visual confirmation is still needed that the success message renders correctly with green styling."
  - test: "End-to-end: proposals appear pre-accepted after review completes"
    expected: "After clicking '구조 검토 시작', both agents run (loading state shows), then proposals appear with all checkmarks active (opt-out model — all accepted by default)"
    why_human: "Cannot verify real Claude API call behavior and response parsing programmatically without running the app with a live API key."
  - test: "Proposal diff preview for 'edit' proposals"
    expected: "Edit-type proposals show '변경 후 텍스트' with the new headline and subtext displayed clearly"
    why_human: "Visual rendering of the diff preview block requires human inspection to confirm readability and correct labeling."
---

# Phase 3: Structure Review Verification Report

**Phase Goal:** 스토리 흐름 에이전트와 독자 이탈 방지 에이전트가 카드 순서와 흐름을 검토하고 최적화를 제안한다.
**Verified:** 2026-03-03
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | StructureProposal type covers all four proposal kinds: reorder, add, delete, edit | VERIFIED | `StructureSystem.tsx` line 8: `export type ProposalType = 'reorder' \| 'add' \| 'delete' \| 'edit'`; StructureProposal interface lines 10-26 has all type-specific optional fields |
| 2  | useStructureSystem hook manages idle → reviewing → proposed → applying → done/error transitions | VERIFIED | Hook at lines 142-230 defines all six phases in StructureState; startReview→'reviewing', setProposals→'proposed', applyAccepted→'applying'→'done', setError→'error', reset→'idle' |
| 3  | ProposalList renders each proposal with accept/reject toggle, shows diff preview for edit proposals | VERIFIED | ProposalList.tsx lines 32-108 (ProposalCard): type-badge, source-badge, reason text, type-specific detail blocks for edit/reorder/delete/add, Check and X icon buttons |
| 4  | Accept All / Reject All bulk actions update acceptedIds correctly | VERIFIED | acceptAll (line 176-180): sets acceptedIds to all proposal IDs; rejectAll (line 183-187): sets acceptedIds to []; both exposed through hook and wired to ProposalList onAcceptAll/onRejectAll |
| 5  | Apply button is disabled until at least one proposal is accepted | VERIFIED | ProposalList.tsx line 178: `disabled={acceptedIds.length === 0 \|\| isApplying}` |
| 6  | User can click '구조 검토 시작' button and both agents run in parallel | VERIFIED | StructureReview.tsx line 251-258: button renders when phase==='idle'; runStructureReview fires on click; line 179: `await Promise.all([callClaude(...storyFlow), callClaude(...retention)])` |
| 7  | Story Flow agent and Reader Retention agent review all cards simultaneously via Promise.all | VERIFIED | Lines 179-182: `Promise.all([callClaude(apiKey, buildStoryFlowPrompt(cards)), callClaude(apiKey, buildRetentionPrompt(cards))])`; both prompt builders include "최대 3개 이하" cap |
| 8  | After review, all proposals are displayed in ProposalList with each proposal pre-accepted by default | VERIFIED | setProposals (StructureSystem line 154-162): `acceptedIds: proposals.map((p) => p.id)` — opt-out model confirmed |
| 9  | User can toggle individual proposals, accept all, reject all | VERIFIED | toggleAccept, acceptAll, rejectAll all wired from hook to ProposalList; toggleAccept uses Set for O(1) toggle |
| 10 | Clicking '변경 적용' applies accepted proposals and onApplied callback fires with updated cards | PARTIAL | handleApply (lines 237-243): correctly filters acceptedProposals, calls applyProposals, fires onApplied(updatedCards). However, phase never transitions to 'done' — handleApply does not call applyAccepted or any setState that moves phase forward. Phase stays 'proposed' after apply. |
| 11 | StructureReview appears on page only after QualityLoop onApproved fires | VERIFIED | page.tsx lines 55-73: QualityLoop onApproved sets approvedCards; StructureReview renders only inside `{approvedCards.length > 0 && (...)}` guard |

**Score: 9/11 truths verified** (10 is partial)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/card-news/structure/StructureSystem.tsx` | StructureProposal type, StructureState, useStructureSystem hook, applyProposals pure function | VERIFIED | File exists (231 lines), substantive, exports all required symbols. 'use client' directive present. applyProposals applies edit→delete→add→reorder with re-normalization after each destructive step. |
| `components/card-news/structure/ProposalList.tsx` | Accept/reject proposal UI component | VERIFIED | File exists (206 lines), substantive. Exports ProposalList and ReviewingState. All four proposal type renderings present. Bulk accept/reject. Apply button with correct disabled logic. |
| `components/card-news/structure/StructureReview.tsx` | Orchestration component — parallel agent calls, proposal management, apply flow | PARTIAL | File exists (309 lines), substantive. Exports StructureReview. Promise.all confirmed. callClaude/parseJsonFromText copied verbatim. Proposal validation present. handleApply fires onApplied with correct cards. Gap: phase does not transition to 'done' after apply. |
| `app/card-news/page.tsx` | Page-level integration wiring StructureReview after QualityLoop | VERIFIED | approvedCards state added (line 16); QualityLoop onApproved sets both cards and approvedCards (lines 55-58); StructureReview conditionally rendered (lines 61-73); onApplied syncs both states. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/card-news/structure/ProposalList.tsx` | `components/card-news/structure/StructureSystem.tsx` | imports StructureProposal, ProposalType | WIRED | Line 8: `import type { StructureProposal, ProposalType } from './StructureSystem'` — types used in ProposalCardProps and ProposalListProps interfaces |
| `components/card-news/structure/StructureReview.tsx` | `components/card-news/structure/StructureSystem.tsx` | useStructureSystem, applyProposals | WIRED | Lines 7-11: imports useStructureSystem, applyProposals, StructureProposal. useStructureSystem() called line 155. applyProposals called line 241. |
| `components/card-news/structure/StructureReview.tsx` | `https://api.anthropic.com/v1/messages` | callClaude helper, Promise.all | WIRED | callClaude function lines 24-47 posts to Anthropic API with correct headers. Promise.all at line 179 invokes both agents in parallel. |
| `app/card-news/page.tsx` | `components/card-news/structure/StructureReview.tsx` | import and render inside approvedCards.length > 0 block | WIRED | Line 10: `import { StructureReview } from '@/components/card-news/structure/StructureReview'`; rendered at lines 64-71 inside `{approvedCards.length > 0 && (...)}` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| STRC-01 | 03-01, 03-02 | 2개 에이전트가 전체 카드 구성을 검토한다 | SATISFIED | StructureReview.tsx calls two distinct Claude agents (story-flow and retention) in parallel via Promise.all |
| STRC-02 | 03-01, 03-02 | 스토리 흐름 에이전트는 카드 순서가 논리적으로 연결되는지 검토한다 | SATISFIED | buildStoryFlowPrompt (line 58) system: "카드의 논리적 순서 연결과 스크롤 유도 흐름을 분석하세요"; source tagged 'story-flow' |
| STRC-03 | 03-01, 03-02 | 스토리 흐름 에이전트는 스크롤을 유도하는 흐름인지 검토한다 | SATISFIED | Same prompt as STRC-02 — scroll guidance explicitly included in story-flow agent's system instruction |
| STRC-04 | 03-01, 03-02 | 독자 이탈 방지 에이전트는 각 카드가 다음 카드로 넘기고 싶은 궁금증을 남기는지 검토한다 | SATISFIED | buildRetentionPrompt (line 90) system: "각 카드가 다음 카드로 넘기고 싶은 궁금증을 남기는지 검토하세요"; source tagged 'retention' |
| STRC-05 | 03-01, 03-02 | 검토 결과로 카드 순서 재배열/카드 추가·삭제/카드별 텍스트 수정을 자동 제안한다 | SATISFIED | StructureProposal type covers reorder/add/delete/edit; proposals collected from both agents and displayed in ProposalList |
| STRC-06 | 03-01, 03-02 | 사용자가 수락/거절할 수 있는 UI를 제공한다 | SATISFIED | ProposalList renders per-proposal accept/reject buttons, bulk accept/reject, apply button. Minor functional gap (phase not transitioning to done) does not prevent the accept/reject UI from working. |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/card-news/structure/StructureReview.tsx` | 237-243 | Missing phase transition after apply | Warning | After '변경 적용' is clicked and onApplied fires, the component stays in 'proposed' phase indefinitely. The success message at line 301-305 is unreachable. The '다시 검토' button at lines 259-261 is unreachable. Users get no visual confirmation that changes were applied. |
| `hooks/use-toast.ts` | 143 | TS2783: 'id' specified more than once (pre-existing) | Info | Pre-existing error not introduced by Phase 3. TypeScript build shows this error but it is out of scope for this phase. No new TypeScript errors introduced by Phase 3. |

---

## Human Verification Required

### 1. Success State After Apply

**Test:** With a live API key, complete the full flow: generate cards, pass quality loop, click '구조 검토 시작', wait for proposals, accept some, click '변경 적용'.
**Expected:** Success message "구조 검토가 완료되었습니다. 변경사항이 적용되었습니다." appears with green styling. '다시 검토' button appears in card header.
**Why human:** The phase transition gap means this currently does NOT work. After the gap is fixed, visual confirmation is needed.

### 2. Opt-Out Default Acceptance

**Test:** After '구조 검토 시작' completes and proposals appear.
**Expected:** All proposals are pre-checked (green border, Check button highlighted). Progress bar shows 100%. Counter shows "N / N 개 제안 선택됨".
**Why human:** Requires live Claude API call to produce real proposals. Opt-out model verified in code but visual rendering needs human confirmation.

### 3. Edit Proposal Diff Preview

**Test:** Observe an 'edit' type proposal card in the ProposalList.
**Expected:** A muted bordered block shows "변경 후 텍스트" label with "제목:" and "내용:" fields displaying the new headline/subtext.
**Why human:** Visual inspection needed to confirm readability and Korean label accuracy.

### 4. Proposal Agent Segregation by Source Badge

**Test:** Inspect rendered proposal cards after review.
**Expected:** Story-flow proposals show "스토리 흐름" secondary badge; retention proposals show "독자 이탈 방지" secondary badge.
**Why human:** Requires live API call with both agents returning results to verify badge rendering.

---

## Gaps Summary

One functional gap blocks a complete user experience: after the user clicks '변경 적용', `handleApply` correctly computes the updated cards and fires `onApplied` (syncing page state), but the StructureReview component's internal phase never transitions to 'done'. The hook's `applyAccepted` method handles this transition but is not called from `handleApply`. As a result:

1. The success message ("구조 검토가 완료되었습니다...") never renders.
2. The '다시 검토' reset button never appears.
3. The ProposalList remains visible after applying, which is misleading.

The card page state IS correctly updated (onApplied fires), so the functional data flow works — this is a UX completion gap, not a data gap. The fix is straightforward: in `handleApply`, after `onApplied(updatedCards)`, call a state transition (e.g., via `setState` or the hook's action) that moves phase to 'done'.

All six STRC requirements are substantively satisfied in code. The phase transition gap affects STRC-06's completeness (the accept/reject UI flow is incomplete as the post-apply confirmation state is never reached).

---

_Verified: 2026-03-03_
_Verifier: Claude (gsd-verifier)_
