# Phase 2: Quality Verification - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

후킹 전문가와 카피 에디터 에이전트가 병렬로 카드뉴스 품질을 평가하고 75점 이상이면 통과한다. 평균 점수가 미달 시 자동 재작성 루프가 최대 3회 반복된다.

</domain>

<decisions>
## Implementation Decisions

### 에이전트 평가 시스템 구축
- 두 에이전트가 병렬로 독립 평가 (각각 0~100점 채점)
- 평균 점수 = (에이전트1 점수 + 에이전트2 점수) / 2
- 통과 판단: 평균 점수 ≥ 75점
- 미달 시: 평균 점수 < 75점

### 품질 검수 루프
- 최대 루프 횟수: 3회
- 각 시도별 점수와 코멘트를 UI에 표시
- 사용자가 수락/거절할 수 있는 제안 UI

### Claude's Discretion
- 웹 서치 소스 수: 최소 3개 이상 추천
- 각 에이전트의 채점 가중치 평등 적용

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Accordion 컴포넌트 (`components/ui/accordion.tsx`)
- Badge 컴포넌트 (`components/ui/badge.tsx`)
- Button 컴포넌트 (`components/ui/button.tsx`)
- Progress 컴포넌트 (`components/ui/progress.tsx`)
- Toast 컴포넌트 (`components/ui/toast.tsx`)
- Textarea 컴포넌트 (`components/ui/textarea.tsx`)
- Card 컴포넌트 (`components/ui/card.tsx`)
- Input 컴포넌트 (`components/ui/input.tsx`)

### Established Patterns
- shadcn/ui + Tailwind CSS 패턴
- class-variance-authority + clsx + tailwind-merge 유틸리티 조합 패턴
- Radix UI 기반 컴포넌트 구조

### Integration Points
- Phase 1 생성된 컴포넌트들 (types, route, components)와 통합
- Phase 1 생성된 페이지 (`app/card-news/page.tsx`)에 통합

</code_context>

<specifics>
## Specific Ideas

- 점수 표시: 각 에이전트의 점수와 평균 점수를 카드 형태로 표시
- 코멘트 표시: 에이전트가 제공한 개선 코멘트를 하이라이트로 표시
- 진행 바: 로딩 중 → 진행 중 → 완료 → 에러 상태

</specifics>

<deferred>
None — discussion stayed within phase scope
</deferred>

---
*Phase: 02-quality-verification*
*Context gathered: 2026-03-03*
