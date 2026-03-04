# Phase 1: Research & Copy Generation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 주제를 입력하면 AI가 Claude web_search 툴로 최신 정보·통계·사례를 수집하고, 카드뉴스용 카피 초안을 자동으로 생성. 리서치 출처와 요약을 UI에 함께 표시한다.

</domain>

<decisions>
## Implementation Decisions

### 주제 입력 방식
- 간단한 두 필드: 주제 입력 + 타깃 독자 입력

### 리서치 결과 표시
- 웹 서치 결과를 상세 출처와 함께 표시

### 카피 생성 UI
- 리스트 뷰 형태로 모든 카드를 표시

### Claude's Discretion
- 웹 서치 소스 수: 최소 3개 이상 추천
- 카드뉴스 카드 수: 4~6장 본문 카드 생성 (사용자가 직접 수정 가능하도록 유연하게 구현)
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Accordion 컴포넌트 (`components/ui/accordion.tsx`)
- Badge 컴포넌트 (`components/ui/badge.tsx`)
- Button, Input, Label, Progress, Toast 컴포넌트
- Textarea 컴포넌트
- Card 컴포넌트

### Established Patterns
- shadcn/ui + Tailwind CSS 패턴
- Radix UI 기반 컴포넌트 구조
- class-variance-authority + clsx + tailwind-merge 유틸리티 조합 패턴

### Integration Points
- Anthropic SDK를 사용하여 클라이언트 사이드에서 Claude API 직접 호출
- web_search 툴을 Claude 메시지와 함께 사용
</code_context>

<specifics>
## Specific Ideas

- 주제 입력은 단순한 텍스트 필드로 충분
- 타깃 독자는 선택지 대신 자유 텍스트 입력으로 유연하게 구현
- 리서치 결과는 출처 링크를 유지하여 신뢰성 확보

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope
</deferred>

---
*Phase: 01-research-copy-generation*
*Context gathered: 2026-03-03*
