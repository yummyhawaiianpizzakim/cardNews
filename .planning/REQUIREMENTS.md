# Requirements: AI 카드뉴스 자동 제작 웹앱

**Defined:** 2026-03-03
**Core Value:** 사용자가 주제만 입력하면 검증된 품질의 카드뉴스를 자동으로 생성하고 1080×1350px PNG로 다운로드할 수 있다.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Stage 1: 리서치 & 카피 자동 생성

- [x] **RSCH-01**: 사용자가 주제와 타깃 독자를 입력할 수 있다
- [x] **RSCH-02**: Claude web_search 툴로 최신 정보·통계·사례를 수집한다
- [x] **RSCH-03**: 수집 결과를 바탕으로 카드뉴스용 카피 초안을 자동 작성한다
- [x] **RSCH-04**: 리서치 출처와 요약을 UI에 함께 표시한다
- [x] **RSCH-05**: 카드 구성은 표지(훅) 1장 + 본문 4~6장 + 마무리(CTA) 1장이다
- [x] **RSCH-06**: 각 카드당 헤드라인 1줄 + 서브텍스트 2~3줄 형식이다

### Stage 2: 후킹팀 — 품질 자동 검수 루프

- [x] **QUAL-01**: 2개 에이전트가 병렬로 독립 평가 후 점수를 합산한다
- [x] **QUAL-02**: 후킹 전문가 에이전트는 표지의 클릭·정지 유발력을 평가한다 (궁금증 유발/감정 자극/숫자·구체성)
- [x] **QUAL-03**: 카피 에디터 에이전트는 전체 카피 완성도를 평가한다 (명확성/간결성/브랜드 톤 일관성)
- [x] **QUAL-04**: 각 에이전트는 0~100점 채점 + 개선 코멘트를 출력한다
- [x] **QUAL-05**: 두 점수 평균 ≥ 75점 이상이어야 통과한다
- [x] **QUAL-06**: 미달 시 에이전트 코멘트를 반영해 카피 자동 재작성 → 재평가 (최대 3회 루프)
- [x] **QUAL-07**: UI에 각 시도별 점수 변화 히스토리를 표시한다

### Stage 3: 구조 토론 — 카드 흐름 검토

- [x] **STRC-01**: 2개 에이전트가 전체 카드 구성을 검토한다
- [x] **STRC-02**: 스토리 흐름 에이전트는 카드 순서가 논리적으로 연결되는지 검토한다
- [x] **STRC-03**: 스토리 흐름 에이전트는 스크롤을 유도하는 흐름인지 검토한다
- [x] **STRC-04**: 독자 이탈 방지 에이전트는 각 카드가 다음 카드로 넘기고 싶은 궁금증을 남기는지 검토한다
- [x] **STRC-05**: 검토 결과로 카드 순서 재배열/카드 추가·삭제/카드별 텍스트 수정을 자동 제안한다
- [x] **STRC-06**: 사용자가 수락/거절할 수 있는 UI를 제공한다

### Stage 4: 디자인 적용 & PNG 출력

- [x] **DSGN-01**: 사용자가 레퍼런스 이미지(JPG/PNG)를 업로드할 수 있다
- [x] **DSGN-02**: Claude Vision으로 레퍼런스 이미지를 분석한다
- [x] **DSGN-03**: 추출 항목: 주색상·보조색상, 폰트 스타일, 레이아웃 패턴, 전체 무드
- [x] **DSGN-04**: 분석 결과를 디자인 토큰(JSON)으로 변환해 각 카드에 자동 적용한다
- [x] **DSGN-05**: 렌더링된 카드 위에서 헤드라인·서브텍스트를 직접 클릭해 수정할 수 있다
- [x] **DSGN-06**: 수정 즉시 미리보기에 실시간 반영한다
- [x] **DSGN-07**: 각 카드를 1080×1350px PNG로 개별 렌더링한다
- [x] **DSGN-08**: 전체 카드를 ZIP 파일로 일괄 다운로드하는 버튼을 제공한다

### UI & UX

- [x] **UI-01**: 각 Stage는 Accordion 또는 Collapsible로 구현한다
- [x] **UI-02**: 진행 상태(로딩·완료·에러)를 Badge 컴포넌트로 명확히 표시한다
- [x] **UI-03**: 이전 Stage 결과는 접을 수 있는 패널로 유지한다
- [x] **UI-04**: Claude API Key를 입력받는 인터페이스를 제공한다

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### 기능 확장

- **V2-01**: 카드뉴스 저장 및 관리 기능
- **V2-02**: 생성 히스토리 확인
- **V2-03**: 다른 출력 포맷 지원 (PDF, GIF)
- **V2-04**: AI 응답 캐싱으로 비용 절감
- **V2-05**: 공유/게시 기능

## Out of Scope

| Feature | Reason |
|---------|--------|
| 사용자 인증/계정 시스템 | 별도 계정 없이 사용 가능하도록 단순화 |
| 카드뉴스 저장/관리 | v1에서는 생성 즉시 다운로드에 집중 |
| 공유/게시 기능 | 다른 서비스 연동 없이 독립적 도구로 사용 |
| AI 응답 캐싱 | 매번 실시간 생성으로 정확성 확보 |
| 다른 출력 포맷 | PNG만 지원으로 범위 한정 |
| 백엔드 서버 | 클라이언트 사이드 API 호출로 배포 간소화 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RSCH-01 | Phase 1 | Complete |
| RSCH-02 | Phase 1 | Complete |
| RSCH-03 | Phase 1 | Complete |
| RSCH-04 | Phase 1 | Complete |
| RSCH-05 | Phase 1 | Complete |
| RSCH-06 | Phase 1 | Complete |
| QUAL-01 | Phase 2 | Complete |
| QUAL-02 | Phase 2 | Complete |
| QUAL-03 | Phase 2 | Complete |
| QUAL-04 | Phase 2 | Complete |
| QUAL-05 | Phase 2 | Complete |
| QUAL-06 | Phase 2 | Complete |
| QUAL-07 | Phase 2 | Complete |
| STRC-01 | Phase 3 | Complete |
| STRC-02 | Phase 3 | Complete |
| STRC-03 | Phase 3 | Complete |
| STRC-04 | Phase 3 | Complete |
| STRC-05 | Phase 3 | Complete |
| STRC-06 | Phase 3 | Complete |
| DSGN-01 | Phase 4 | Complete |
| DSGN-02 | Phase 4 | Complete |
| DSGN-03 | Phase 4 | Complete |
| DSGN-04 | Phase 4 | Complete |
| DSGN-05 | Phase 4 | Complete |
| DSGN-06 | Phase 4 | Complete |
| DSGN-07 | Phase 4 | Complete |
| DSGN-08 | Phase 4 | Complete |
| UI-01 | Phase 5 | Complete |
| UI-02 | Phase 5 | Complete |
| UI-03 | Phase 5 | Complete |
| UI-04 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after roadmap creation*
