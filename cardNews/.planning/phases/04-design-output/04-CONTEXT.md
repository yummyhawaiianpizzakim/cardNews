# Phase 4: Design & Output - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

레퍼런스 이미지를 분석하여 디자인 토큰을 추출하고 카드에 적용한 뒤 1080×1350px PNG로 렌더링한다. 사용자는 렌더링된 카드에서 텍스트를 직접 편집할 수 있고, 개별 또는 ZIP 파일로 다운로드할 수 있다.

</domain>

<decisions>
## Implementation Decisions

### 이미지 업로드 UI
- 버튼 클릭으로 업로드 ("파일 선택" 버튼)
- 미리보기 필수 (업로드된 이미지를 항상 미리보기 표시)
- 이미지 변경 가능 ("이미지 변경" 버튼 또는 재업로드로 대체)
- 파일 형식 제한: JPG/PNG만 (요구사항 DSGN-01)
- 파일 크기 제한: 없음 (클라이언트 사이드에서만 처리)
- 진행 상태: 텍스트 메시지로 표시 ("업로드 중...", "분석 중...")

### 디자인 적용 방식
- CSS 변수로 디자인 토큰 적용 (재사용 가능, 유지보수 용이)
- 색상 없을 경우 기본 팔레트 사용 (미리 정의된 기본 색상)
- 폰트 추출 실패 시 시스템 폰트 사용 (기본 sans-serif)

### 카드 렌더링 뷰
- 카드 미리보기: 그리드 뷰 (2x2 또는 3x3 그리드로 한눈에 보기)
- 1080×1350px 비율: 실제 크기로 표시 (화면에 그대로 비율)
- 각 카드에 개별 다운로드 버튼 있음 (PNG 다운로드)
- ZIP 일괄 다운로드 버튼 별도 제공

### 텍스트 편집 경험
- 편집 방식: 클릭으로 편집 모드 진입
- 피드백: 실시간 미리보기 (입력할 때마다 즉시 반영)
- 저장: 자동 저장 (편집 내용이 항상 자동 저장됨)
- 편집 모드: 편집 중에는 다른 카드 상호작용 비활성화

### Claude's Discretion
- 그리드 뷰의 정확한 컬럼 수 (모바일 vs 데스크탑)
- 디자인 토큰 JSON 구조의 세부 항목
- 렌더링 진행 상태 표시 방식
- ZIP 다운로드 시 파일 네이밍 규칙

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card`, `Badge`, `Button`, `Input`, `Label`, `Progress` (shadcn/ui) — UI 컴포넌트 활용
- `CardNewsList` — 기존 카드 리스트 컴포넌트 (편집 패턴 참조)
- `html2canvas` (1.4.1) — 1080×1350px PNG 렌더링
- `jszip` (3.10.1) — ZIP 파일 생성

### Established Patterns
- 클라이언트 컴포넌트 + useState
- 콜백 패턴으로 부모 상태 업데이트
- Tailwind CSS 스타일링 (CSS 변수 활용 가능)
- 한국어 UI 사용 (기존 패턴 따르기)

### Integration Points
- `app/card-news/page.tsx` — 메인 페이지에 새로운 섹션 추가
- 기존 `approvedCards` 상태에서 디자인 적용 및 렌더링 시작
- API 라우트 (`/api/anthropic`) — Claude Vision 호출 확장

</code_context>

<specifics>
## Specific Ideas

- "버튼 클릭으로 업로드" — 드래그 앤 드롭보다 간단하고 명확
- "미리보기 필수" — 사용자가 업로드한 이미지를 항상 확인할 수 있어야 함
- "실제 크기 표시" — 1080×1350px 비율이 명확히 보이도록 실제 크기로 표시
- "자동 저장" — 편집이 자동 저장되어 편리함

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-design-output*
*Context gathered: 2026-03-04*
