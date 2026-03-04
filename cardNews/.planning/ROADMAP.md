# Roadmap: AI 카드뉴스 자동 제작 웹앱

**Created:** 2026-03-03
**Depth:** Standard
**Phases:** 5

## Phases

- [x] **Phase 1: Research & Copy Generation** - 리서치 수집 및 카드뉴스 카피 초안 자동 작성 (completed 2026-03-03)
- [x] **Phase 2: Quality Verification** - 후킹팀 병렬 품질 검수 루프 (completed 2026-03-03)
- [x] **Phase 3: Structure Review** - 카드 흐름 검토 및 최적화 (completed 2026-03-03)
- [x] **Phase 4: Design & Output** - 레퍼런스 기반 디자인 적용 및 PNG 렌더링 (completed 2026-03-03)
- [ ] **Phase 5: UI Integration** - Accordion UI 및 상태 표시 완성

## Phase Details

### Phase 1: Research & Copy Generation

**Goal:** 사용자가 주제를 입력하면 AI가 최신 정보를 수집하고 카드뉴스용 카피 초안을 자동으로 생성한다.

**Depends on:** Nothing (first phase)

**Requirements:**
- RSCH-01: 사용자가 주제와 타깃 독자를 입력할 수 있다
- RSCH-02: Claude web_search 툴로 최신 정보·통계·사례를 수집한다
- RSCH-03: 수집 결과를 바탕으로 카드뉴스용 카피 초안을 자동 작성한다
- RSCH-04: 리서치 출처와 요약을 UI에 함께 표시한다
- RSCH-05: 카드 구성은 표지(훅) 1장 + 본문 4~6장 + 마무리(CTA) 1장이다
- RSCH-06: 각 카드당 헤드라인 1줄 + 서브텍스트 2~3줄 형식이다

**Success Criteria** (what must be TRUE):
1. 사용자가 주제와 타깃 독자를 입력하고 "생성" 버튼을 누르면 카드뉴스 카피 초안이 생성된다
2. 생성된 카드뉴스는 표지 1장, 본문 4~6장, 마무리 1장 구조를 가진다
3. 각 카드는 헤드라인 1줄과 서브텍스트 2~3줄로 구성된다
4. 리서치 출처와 요약이 화면에 표시되어 사용자가 정보 출처를 확인할 수 있다

**Plans:** 3/3 plans complete

---

### Phase 2: Quality Verification

**Goal:** 후킹 전문가와 카피 에디터 에이전트가 병렬로 카드뉴스 품질을 평가하고 75점 이상이면 통과한다.

**Depends on:** Phase 1 (Research & Copy Generation)

**Requirements:**
- QUAL-01: 2개 에이전트가 병렬로 독립 평가 후 점수를 합산한다
- QUAL-02: 후킹 전문가 에이전트는 표지의 클릭·정지 유발력을 평가한다 (궁금증 유발/감정 자극/숫자·구체성)
- QUAL-03: 카피 에디터 에이전트는 전체 카피 완성도를 평가한다 (명확성/간결성/브랜드 톤 일관성)
- QUAL-04: 각 에이전트는 0~100점 채점 + 개선 코멘트를 출력한다
- QUAL-05: 두 점수 평균 ≥ 75점 이상이어야 통과한다
- QUAL-06: 미달 시 에이전트 코멘트를 반영해 카피 자동 재작성 → 재평가 (최대 3회 루프)
- QUAL-07: UI에 각 시도별 점수 변화 히스토리를 표시한다

**Success Criteria** (what must be TRUE):
1. 품질 검수가 시작되면 두 에이전트가 병렬로 평가하고 각각 점수와 코멘트를 표시한다
2. 평균 점수가 75점 이상이면 검수가 통과되고 다음 단계로 진행한다
3. 평균 점수가 75점 미만이면 코멘트가 표시되고 자동 재작성 루프가 시작된다
4. 각 시도별 점수 변화가 히스토리로 표시되어 품질 향상 과정을 확인할 수 있다

**Plans:** 2/2 plans complete

---

### Phase 3: Structure Review

**Goal:** 스토리 흐름 에이전트와 독자 이탈 방지 에이전트가 카드 순서와 흐름을 검토하고 최적화를 제안한다.

**Depends on:** Phase 2 (Quality Verification)

**Requirements:**
- STRC-01: 2개 에이전트가 전체 카드 구성을 검토한다
- STRC-02: 스토리 흐름 에이전트는 카드 순서가 논리적으로 연결되는지 검토한다
- STRC-03: 스토리 흐름 에이전트는 스크롤을 유도하는 흐름인지 검토한다
- STRC-04: 독자 이탈 방지 에이전트는 각 카드가 다음 카드로 넘기고 싶은 궁금증을 남기는지 검토한다
- STRC-05: 검토 결과로 카드 순서 재배열/카드 추가·삭제/카드별 텍스트 수정을 자동 제안한다
- STRC-06: 사용자가 수락/거절할 수 있는 UI를 제공한다

**Success Criteria** (what must be TRUE):
1. 구조 검토가 완료되면 두 에이전트의 검토 결과가 요약되어 표시된다
2. 검토 결과에 따라 카드 재배열, 추가, 삭제, 텍스트 수정 제안이 표시된다
3. 사용자가 제안을 수락하면 변경이 적용되고 거절하면 원래 상태가 유지된다
4. 검토 전후 카드 순서를 비교할 수 있어 변경 내용을 명확히 알 수 있다

**Plans:** 2/2 plans complete

Plans:
- [ ] 03-01-PLAN.md — StructureSystem types + hook + applyProposals utility; ProposalList accept/reject UI
- [ ] 03-02-PLAN.md — StructureReview orchestration component + page integration

---

### Phase 4: Design & Output

**Goal:** 레퍼런스 이미지를 분석하여 디자인 토큰을 추출하고 카드에 적용한 뒤 1080×1350px PNG로 렌더링한다.

**Depends on:** Phase 3 (Structure Review)

**Requirements:**
- DSGN-01: 사용자가 레퍼런스 이미지(JPG/PNG)를 업로드할 수 있다
- DSGN-02: Claude Vision으로 레퍼런스 이미지를 분석한다
- DSGN-03: 추출 항목: 주색상·보조색상, 폰트 스타일, 레이아웃 패턴, 전체 무드
- DSGN-04: 분석 결과를 디자인 토큰(JSON)으로 변환해 각 카드에 자동 적용한다
- DSGN-05: 렌더링된 카드 위에서 헤드라인·서브텍스트를 직접 클릭해 수정할 수 있다
- DSGN-06: 수정 즉시 미리보기에 실시간 반영한다
- DSGN-07: 각 카드를 1080×1350px PNG로 개별 렌더링한다
- DSGN-08: 전체 카드를 ZIP 파일로 일괄 다운로드하는 버튼을 제공한다

**Success Criteria** (what must be TRUE):
1. 사용자가 레퍼런스 이미지를 업로드하면 색상, 폰트, 레이아웃, 무드가 자동으로 추출되어 카드에 적용된다
2. 렌더링된 카드에서 텍스트를 직접 클릭하여 수정할 수 있고 변경사항이 실시간으로 반영된다
3. 각 카드가 1080×1350px PNG로 렌더링되어 미리보기로 표시된다
4. "전체 다운로드" 버튼을 클릭하면 모든 카드가 ZIP 파일로 다운로드된다

**Plans:** 4/4 plans complete

Plans:
- [ ] 04-01-PLAN.md — DesignToken types + ImageUpload component + DesignTokenExtractor Vision API integration
- [ ] 04-02-PLAN.md — DesignTokenSystem hook for state management
- [ ] 04-03-PLAN.md — CardRenderer (1080×1350px) + CardGrid + TextEditor (click-to-edit)
- [ ] 04-04-PLAN.md — DownloadControls (PNG + ZIP) + DesignOrchestration + page integration

---

### Phase 5: UI Integration

**Goal:** 각 단계가 Accordion UI로 구현되고 진행 상태가 명확히 표시되며 Claude API Key를 입력할 수 있다.

**Depends on:** Phase 4 (Design & Output)

**Requirements:**
- UI-01: 각 Stage는 Accordion 또는 Collapsible로 구현한다
- UI-02: 진행 상태(로딩·완료·에러)를 Badge 컴포넌트로 명확히 표시한다
- UI-03: 이전 Stage 결과는 접을 수 있는 패널로 유지한다
- UI-04: Claude API Key를 입력받는 인터페이스를 제공한다

**Success Criteria** (what must be TRUE):
1. 각 Stage가 Accordion 형태로 접고 펼칠 수 있어 화면 공간을 효율적으로 사용한다
2. 각 Stage 옆에 로딩, 완료, 에러 상태를 나타내는 Badge가 표시된다
3. 완료된 Stage의 결과는 접을 수 있는 패널로 유지되어 언제든 다시 볼 수 있다
4. Claude API Key를 입력하는 인터페이스가 제공되어 API 호출을 할 수 있다

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Research & Copy Generation | 3/3 | Complete   | 2026-03-03 |
| 2. Quality Verification | 2/2 | Complete   | 2026-03-03 |
| 3. Structure Review | 2/2 | Complete   | 2026-03-03 |
| 4. Design & Output | 0/4 | Complete    | 2026-03-03 |
| 5. UI Integration | 0/0 | Not started | - |

---

**Roadmap created:** 2026-03-03
**Updated:** 2026-03-04 (Phase 4 plans added)
