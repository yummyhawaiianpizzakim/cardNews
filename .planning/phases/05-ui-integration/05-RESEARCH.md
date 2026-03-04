# Phase 5: UI Integration - Research

**Researched:** 2026-03-04
**Domain:** React/Next.js component refactoring — Accordion UI, Badge status, API key UX
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | 각 Stage는 Accordion 또는 Collapsible로 구현한다 | shadcn/ui `Accordion` already installed and used in `ResearchResults.tsx`; Radix `@radix-ui/react-accordion@^1.2.1` is in `package.json` |
| UI-02 | 진행 상태(로딩·완료·에러)를 Badge 컴포넌트로 명확히 표시한다 | `Badge` component at `components/ui/badge.tsx` already has `success`, `warning`, `info`, `destructive`, `outline` variants; all stage components expose phase/status strings |
| UI-03 | 이전 Stage 결과는 접을 수 있는 패널로 유지한다 | Radix Accordion `type="multiple"` allows any item to remain open independently; completed stages should default to `data-state=closed` |
| UI-04 | Claude API Key를 입력받는 인터페이스를 제공한다 | `ApiKeyInput.tsx` already exists and is rendered in `page.tsx`; requirement is marked Complete in REQUIREMENTS.md — needs only positioning review |
</phase_requirements>

---

## Summary

Phase 5 is a **UI refactoring phase**, not a feature-addition phase. All four pipeline stages (Research/Copy, Quality, Structure, Design) are fully implemented and wired. The task is to reorganise the existing `page.tsx` layout so that each stage is wrapped in an `Accordion` panel, displays a status `Badge`, and collapses correctly once complete.

The critical insight is that **all the building blocks already exist in the codebase**:
- `Accordion / AccordionItem / AccordionTrigger / AccordionContent` — installed, shadcn-wrapped, used in `ResearchResults.tsx`
- `Badge` — installed with custom `success`/`warning`/`info` variants already added to `badge.tsx`
- `ApiKeyInput` — fully implemented; just needs placement decision

The primary challenge is **state management**: deciding which accordion items are open/closed and how that interacts with the pipeline's sequential dependency logic (each stage only unlocks after the previous stage completes). A controlled Accordion (`type="single"` or `type="multiple"` with explicit `value` prop) is needed so the page, not the user, can open the next stage automatically.

**Primary recommendation:** Refactor `page.tsx` to use a controlled `Accordion type="multiple"` with an `openItems` state array. Each stage accordion opens automatically when it becomes available, collapses when the next stage starts, and can always be manually re-opened.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-accordion` | ^1.2.1 | Accordion primitive | Already in `package.json`; shadcn wrapper already at `components/ui/accordion.tsx` |
| `shadcn/ui Badge` | (local) | Status badges | Already at `components/ui/badge.tsx` with all needed variants |
| `lucide-react` | ^0.469.0 | Status icons (Loader2, CheckCircle2, XCircle) | Already in `package.json`; used in other components |
| `shadcn/ui Card` | (local) | Section containers | Already used in `QualityLoop`, `StructureReview` |

### No New Packages Required

This phase requires **zero new npm installs**. All libraries are present. The work is component restructuring only.

---

## Architecture Patterns

### Current Page Structure (to be refactored)

```
page.tsx
├── <header>                    # static title
├── <ApiKeyInput>               # always visible, top of page
├── <ResearchForm>              # Stage 1 input form
└── {cardNewsData && (
    ├── <ResearchResults>       # Stage 1 results (sources)
    ├── {cards.length > 0 && (
        ├── <CardNewsList>      # Stage 1 card list
        ├── <QualityLoop>       # Stage 2
        └── {approvedCards && (
            ├── <StructureReview>   # Stage 3
            └── <DesignOrchestration>  # Stage 4
        )}
    )}
)}
```

**Problem:** Deeply nested conditional rendering. Long page with no collapse. No status badges. API key is a separate unsectioned element at the top.

### Target Page Structure

```
page.tsx
├── <header>                    # title
├── <ApiKeyInput>               # always visible at top (UI-04: already done)
└── <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
    ├── <AccordionItem value="stage-1">   # Stage 1: Research & Copy
    │   ├── <AccordionTrigger>
    │   │   ├── "1단계: 리서치 & 카피 생성"
    │   │   └── <Badge variant={stage1StatusVariant}>stage1StatusLabel</Badge>
    │   └── <AccordionContent>
    │       ├── <ResearchForm>
    │       └── {cardNewsData && <ResearchResults> && <CardNewsList>}
    ├── <AccordionItem value="stage-2">   # Stage 2: Quality (disabled until stage1 done)
    │   ├── <AccordionTrigger disabled={!cards.length}>
    │   │   └── <Badge> loading/complete/error
    │   └── <AccordionContent>
    │       └── <QualityLoop>
    ├── <AccordionItem value="stage-3">   # Stage 3: Structure
    │   └── ...
    └── <AccordionItem value="stage-4">   # Stage 4: Design & Output
        └── ...
```

### Pattern 1: Controlled Accordion with Auto-Open

**What:** Use `value` (array) + `onValueChange` on `Accordion type="multiple"` to programmatically control which panels are open.
**When to use:** Whenever the parent needs to auto-open the next stage when it becomes available.

```typescript
// Source: components/ui/accordion.tsx (Radix AccordionPrimitive.Root)
// Radix Accordion type="multiple" accepts value: string[] for controlled mode

const [openItems, setOpenItems] = useState<string[]>(['stage-1']);

// Auto-open next stage when data arrives:
useEffect(() => {
  if (cards.length > 0 && !openItems.includes('stage-2')) {
    setOpenItems(prev => [...prev, 'stage-2']);
  }
}, [cards.length]);

// In JSX:
<Accordion
  type="multiple"
  value={openItems}
  onValueChange={setOpenItems}
>
  <AccordionItem value="stage-1">...</AccordionItem>
  <AccordionItem value="stage-2">...</AccordionItem>
</Accordion>
```

**Key:** `type="multiple"` keeps all previously opened items open unless explicitly removed from the `value` array. This satisfies UI-03 (previous stage results remain accessible).

### Pattern 2: Stage Status Badge

**What:** Map each stage's internal phase/state to a Badge variant.
**When to use:** In every `AccordionTrigger` to show loading / complete / error at a glance.

```typescript
// Source: components/ui/badge.tsx (already has success/destructive/outline/secondary variants)

type StageStatus = 'idle' | 'loading' | 'complete' | 'error';

function getStageBadge(status: StageStatus): { variant: BadgeProps['variant']; label: string } {
  switch (status) {
    case 'loading':  return { variant: 'secondary',    label: '진행 중...' };
    case 'complete': return { variant: 'success',      label: '완료' };
    case 'error':    return { variant: 'destructive',  label: '오류' };
    default:         return { variant: 'outline',      label: '대기 중' };
  }
}

// In AccordionTrigger:
<AccordionTrigger>
  <div className="flex items-center gap-3 flex-1">
    <span>2단계: 품질 검수</span>
    <Badge variant={badge.variant}>{badge.label}</Badge>
  </div>
</AccordionTrigger>
```

**Note:** The `AccordionTrigger` in `accordion.tsx` uses `flex flex-1 items-center justify-between` and appends the `ChevronDown` icon at the end. Put the badge inside the `children` div (before the chevron) by wrapping in a flex container.

### Pattern 3: Derive Stage Status from Existing Component State

Each stage component already tracks its own phase state. The cleanest approach is to **lift minimal status signals** to `page.tsx` via new callback props or to infer status from the existing state variables already in `page.tsx`.

**Stage 1 (Research & Copy):**
- `idle` → no `cardNewsData`
- `loading` → not directly accessible; `ResearchForm` manages `isLoading` internally
- `complete` → `cardNewsData !== null && cards.length > 0`
- Best approach: Add `onLoadingChange?: (loading: boolean) => void` to `ResearchForm`, or track a `stage1Status` local state in page.tsx via `onGenerate` callback timing

**Stage 2 (Quality):**
- `QualityLoop` exposes `state.phase` ('idle' | 'evaluating' | 'approved' | 'rewriting' | 'failed')
- Easiest: pass `onPhaseChange?: (phase: string) => void` to `QualityLoop`, or track via existing `onApproved`
- `approved` → `approvedCards.length > 0`

**Stage 3 (Structure):**
- `StructureReview` exposes `state.phase` ('idle' | 'reviewing' | 'proposed' | 'applying' | 'done' | 'error')
- Track via existing `onApplied` callback

**Stage 4 (Design):**
- `DesignOrchestration` — no phase exposed to parent; infer from whether download has been triggered

**Simplest viable approach for page.tsx:** Add 4 `useState<StageStatus>` signals and update them via callbacks. No need to lift all sub-state.

```typescript
// In page.tsx
const [stage1Status, setStage1Status] = useState<StageStatus>('idle');
const [stage2Status, setStage2Status] = useState<StageStatus>('idle');
const [stage3Status, setStage3Status] = useState<StageStatus>('idle');
const [stage4Status, setStage4Status] = useState<StageStatus>('idle');
```

### Pattern 4: Disabled AccordionItem for Future Stages

Radix `AccordionItem` does not have a native `disabled` prop on the Item level, but `AccordionTrigger` forwards all props to the underlying `<button>`, so `disabled` works on the Trigger:

```typescript
// Source: Radix AccordionPrimitive.Trigger — renders as <button>
<AccordionTrigger disabled={cards.length === 0} className="disabled:opacity-50 disabled:cursor-not-allowed">
  3단계: 구조 검토
</AccordionTrigger>
```

Add `disabled:opacity-50 disabled:cursor-not-allowed` to the trigger className when stage is not yet available.

### Anti-Patterns to Avoid

- **Uncontrolled Accordion for pipeline UX:** Using `type="multiple"` without `value` prop means the user controls open/close but the app can never auto-open the next stage. Use controlled mode.
- **Nesting `<QualityLoop>` conditionally inside `AccordionContent`:** The component will unmount and remount when the accordion closes, resetting all internal evaluation state. Always render the component but hide it, OR use `forceMount` on `AccordionContent`.
- **Hiding ApiKeyInput inside an accordion:** The API key is needed across all stages. Keep it always visible above the accordion (current position is correct).
- **Re-creating stage status from scratch:** QualityLoop and StructureReview already have internal state machines. Don't duplicate that logic in page.tsx — just lift a minimal `StageStatus` signal via callbacks.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible sections | Custom `useState(open)` div toggle | `Accordion` from `components/ui/accordion.tsx` | Animation, keyboard nav, ARIA attributes handled by Radix |
| Status colors | Custom CSS classes per state | `Badge variant` from `components/ui/badge.tsx` | Variants already defined including `success`, `warning` |
| Loading spinner | Custom CSS spinner | `Loader2` from `lucide-react` + `animate-spin` | Already used in the project |
| Controlled open state | Complex event system | `value` + `onValueChange` on Accordion root | Native Radix controlled API |

---

## Common Pitfalls

### Pitfall 1: AccordionContent Unmounts on Close — State Loss

**What goes wrong:** `QualityLoop`, `StructureReview` etc. have internal `useState` hooks. When `AccordionContent` closes, React unmounts the children, destroying all state (evaluation history, score displays).

**Why it happens:** Radix `AccordionContent` by default unmounts children when `data-state=closed` and the close animation finishes.

**How to avoid:** Use the `forceMount` prop on `AccordionContent` to keep children mounted regardless of open/close state:

```typescript
<AccordionContent forceMount className="data-[state=closed]:hidden">
  <QualityLoop ... />
</AccordionContent>
```

`data-[state=closed]:hidden` hides the content visually while keeping it mounted. This preserves all internal hook state.

**Warning signs:** Score history disappears when accordion is toggled; QualityLoop resets to idle when you reopen the panel.

### Pitfall 2: AccordionTrigger Children Layout Breaks with Badge

**What goes wrong:** The default `AccordionTrigger` uses `justify-between` and appends `ChevronDown` as the last child. Adding a Badge naively as a direct child pushes the chevron off-layout.

**Why it happens:** The trigger renders `{children}` then `<ChevronDown>` in a flex row. If `children` is a flex container with `flex-1`, the chevron stays at the end correctly.

**How to avoid:**

```typescript
<AccordionTrigger>
  {/* Wrap in flex-1 so chevron stays at far right */}
  <div className="flex items-center gap-3 flex-1 pr-2">
    <span className="font-medium">1단계: 리서치 & 카피 생성</span>
    <Badge variant={stage1Badge.variant}>{stage1Badge.label}</Badge>
  </div>
</AccordionTrigger>
```

### Pitfall 3: Sequential Stage Unlock — Auto-Open Timing

**What goes wrong:** Auto-opening `stage-2` when `cards.length > 0` fires inside a `useEffect`. If the effect runs before the accordion value state updates, there can be a render cycle where the item appears briefly as closed.

**Why it happens:** React batches state updates but `useEffect` runs after paint.

**How to avoid:** Update `openItems` inside the `handleGenerate` callback directly (not a `useEffect`), since that's where `cards` state is set:

```typescript
const handleGenerate = (data: CardNewsResponse) => {
  setCardNewsData(data);
  setCards(data.cards);
  setStage1Status('complete');
  // Open stage 2 immediately, not in a useEffect
  setOpenItems(prev => Array.from(new Set([...prev, 'stage-2'])));
};
```

### Pitfall 4: `disabled` on AccordionTrigger Still Allows Programmatic Open

**What goes wrong:** Even with `disabled` on the trigger button, the parent can still put the `value` in the `openItems` array and force-open the panel.

**Why it happens:** Radix separates user interaction disable from programmatic control.

**How to avoid:** This is actually desired behavior — the app can auto-open stage-2 when stage-1 completes, but the user can't click it themselves if stage-2 is not yet ready. Just don't add stage-2 to `openItems` until stage-1 is complete.

### Pitfall 5: `ResearchForm` Loading State Not Visible to page.tsx

**What goes wrong:** `ResearchForm` has `isLoading` as internal state. When generation starts, `page.tsx` doesn't know, so `stage1Status` stays 'idle' during loading.

**Why it happens:** `ResearchForm` was designed to be self-contained.

**How to avoid:** Add an `onLoadingChange` prop to `ResearchForm`:

```typescript
// ResearchForm.tsx addition:
interface ResearchFormProps {
  apiKey: string;
  onGenerate: (data: CardNewsResponse) => void;
  onLoadingChange?: (loading: boolean) => void;  // NEW
}
// In handleSubmit:
setIsLoading(true);
onLoadingChange?.(true);
// In finally:
setIsLoading(false);
onLoadingChange?.(false);
```

---

## Code Examples

### Full Controlled Accordion Skeleton for page.tsx

```typescript
// Source: Radix AccordionPrimitive controlled API + components/ui/accordion.tsx

'use client';

import { useState, useCallback } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

type StageStatus = 'idle' | 'loading' | 'complete' | 'error';

function stageBadgeProps(status: StageStatus) {
  switch (status) {
    case 'loading':  return { variant: 'secondary'   as const, label: '진행 중...' };
    case 'complete': return { variant: 'success'     as const, label: '완료' };
    case 'error':    return { variant: 'destructive' as const, label: '오류' };
    default:         return { variant: 'outline'     as const, label: '대기 중' };
  }
}

export default function CardNewsPage() {
  const [openItems, setOpenItems] = useState<string[]>(['stage-1']);
  const [stage1Status, setStage1Status] = useState<StageStatus>('idle');
  const [stage2Status, setStage2Status] = useState<StageStatus>('idle');
  const [stage3Status, setStage3Status] = useState<StageStatus>('idle');
  const [stage4Status, setStage4Status] = useState<StageStatus>('idle');

  // ... existing state: apiKey, cardNewsData, cards, approvedCards

  const handleGenerate = useCallback((data: CardNewsResponse) => {
    setCardNewsData(data);
    setCards(data.cards);
    setStage1Status('complete');
    setStage2Status('idle');
    // Auto-open stage 2
    setOpenItems(prev => Array.from(new Set([...prev, 'stage-2'])));
  }, []);

  const s1 = stageBadgeProps(stage1Status);
  const s2 = stageBadgeProps(stage2Status);
  const s3 = stageBadgeProps(stage3Status);
  const s4 = stageBadgeProps(stage4Status);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>...</header>

        {/* API Key always visible */}
        <ApiKeyInput value={apiKey} onChange={setApiKey} />

        <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>

          {/* Stage 1 */}
          <AccordionItem value="stage-1">
            <AccordionTrigger>
              <div className="flex items-center gap-3 flex-1 pr-2">
                <span>1단계: 리서치 & 카피 생성</span>
                <Badge variant={s1.variant}>{s1.label}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent forceMount className="data-[state=closed]:hidden">
              <ResearchForm
                apiKey={apiKey}
                onGenerate={handleGenerate}
                onLoadingChange={(loading) => setStage1Status(loading ? 'loading' : stage1Status)}
              />
              {cardNewsData && <ResearchResults sources={cardNewsData.researchSources} />}
              {cards.length > 0 && <CardNewsList cards={cards} onUpdate={setCards} />}
            </AccordionContent>
          </AccordionItem>

          {/* Stage 2 */}
          <AccordionItem value="stage-2">
            <AccordionTrigger disabled={cards.length === 0}>
              <div className="flex items-center gap-3 flex-1 pr-2">
                <span>2단계: 품질 검수</span>
                <Badge variant={s2.variant}>{s2.label}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent forceMount className="data-[state=closed]:hidden">
              <QualityLoop
                cards={cards}
                apiKey={apiKey}
                onApproved={(approved) => {
                  setCards(approved);
                  setApprovedCards(approved);
                  setStage2Status('complete');
                  setOpenItems(prev => Array.from(new Set([...prev, 'stage-3'])));
                }}
                onMaxLoopsReached={(final) => {
                  setCards(final);
                  setStage2Status('error');
                }}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Stage 3, 4 follow same pattern */}

        </Accordion>
      </div>
    </div>
  );
}
```

### AccordionTrigger with Badge — Correct Layout

```typescript
// Source: components/ui/accordion.tsx — trigger renders children then ChevronDown

// CORRECT: wrap in flex-1 div so chevron stays pinned right
<AccordionTrigger>
  <div className="flex items-center gap-3 flex-1 pr-2">
    <span className="font-medium text-left">3단계: 구조 검토</span>
    <Badge variant="outline">대기 중</Badge>
  </div>
</AccordionTrigger>

// WRONG: Badge as direct sibling — chevron gets pushed
<AccordionTrigger>
  3단계: 구조 검토
  <Badge>대기 중</Badge>  {/* pushes ChevronDown off-screen */}
</AccordionTrigger>
```

### forceMount Pattern to Preserve State

```typescript
// Source: Radix AccordionContent docs — forceMount prop
// Keeps children mounted even when closed; hide with data attribute

<AccordionContent
  forceMount
  className="overflow-hidden data-[state=closed]:hidden"
>
  {/* Component state persists across open/close cycles */}
  <QualityLoop ... />
</AccordionContent>
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Uncontrolled accordion (user controls open/close) | Controlled accordion (app controls open/close via `value` prop) | App can auto-open next stage on completion |
| Conditional rendering (`{condition && <Stage />}`) | `forceMount` + `data-[state=closed]:hidden` | Preserves component state across collapse cycles |
| Plain `<hr>` separators between stages | `AccordionItem` with animated open/close | Smooth UX, keyboard accessible, ARIA compliant |

---

## Open Questions

1. **Should stage-1 auto-collapse when generation completes?**
   - What we know: ResearchResults and CardNewsList are large — keeping stage-1 open makes the page very long
   - What's unclear: User expectation — do they want to review research sources while in stage 2?
   - Recommendation: Keep stage-1 open by default after completion (UI-03 says previous results stay accessible); user can collapse manually

2. **QualityLoop `onMaxLoopsReached` — what status to show?**
   - What we know: It means quality check failed after 3 tries; user can still proceed manually
   - What's unclear: Should the badge show 'error' or a new 'warning' variant?
   - Recommendation: Use `variant="warning"` (already in badge.tsx as `bg-yellow-500`) with label "최대 시도"

3. **Stage 4 status — how to know when "complete"?**
   - What we know: `DesignOrchestration` does not expose a phase to parent
   - What's unclear: Is "download started" the right completion signal, or "design tokens extracted"?
   - Recommendation: Add `onTokenExtracted?: () => void` callback to `DesignOrchestration`; show 'complete' when design tokens are extracted (not download, which is optional)

---

## Sources

### Primary (HIGH confidence)

- `components/ui/accordion.tsx` — Full shadcn/ui accordion implementation with Radix primitives; verified forwardRef, className, data-state attributes
- `components/ui/badge.tsx` — Badge variants: default, secondary, destructive, outline, success, warning, info — all pre-defined
- `app/card-news/page.tsx` — Current page structure with all 4 stage components and their props/callbacks
- `package.json` — `@radix-ui/react-accordion: ^1.2.1`, `lucide-react: ^0.469.0` — both installed
- `components/card-news/quality/EvaluationSystem.tsx` — `EvaluationState.phase` enum: idle | evaluating | approved | rewriting | failed
- `components/card-news/structure/StructureSystem.tsx` — (by reference from StructureReview.tsx) phase states available

### Secondary (MEDIUM confidence)

- Radix UI Accordion docs pattern: `type="multiple"` + `value` array for controlled multi-open — standard Radix controlled API, consistent with how `ResearchResults.tsx` already uses `Accordion type="multiple"`
- `forceMount` on `AccordionContent` — documented Radix escape hatch for keeping children mounted; widely used pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, everything verified in package.json and components/ui/
- Architecture: HIGH — page.tsx structure fully read and understood; all stage component APIs verified
- Pitfalls: HIGH — forceMount pattern verified in Radix docs pattern; trigger layout verified from accordion.tsx source; state-loss risk is standard React behavior

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable stack, no fast-moving dependencies)
