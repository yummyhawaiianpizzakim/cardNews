# Phase 2: Quality Verification - Plan 02-01

## Plan 02-01: 에이전트 병렬 평가 시스템 구축

### Overview

에이전트 병렬 평가를 위한 시스템을 구축합니다.
- 병렬 평가 루프: 두 에이전트가 각각 독립으로 점수를 산출
- 점수 합산: 두 에이전트 점수를 평균하여 최종 점수를 결정
- 통과 판단: 합산 점수가 75점 이상인지 통과, 미만이면 재작성 루프 시작
- 재작성 루프: 미달 시 에이전트 코멘트를 분석하고 새 카피를 자동으로 재작성

### Tasks

| ID | Task | Files | Action | Verify | Done |
|----|------|-------|------------|
| 01 | 에이전트 병렬 평가 시스템 | `components/card-news/quality/EvaluationSystem.tsx` | 구축 | 클라이언트 상태 관리, 점수 합산/평균 | 구현 | 2개 |
| 02 | 점수 합산 UI | `components/card-news/quality/ScoreDisplay.tsx` | 구축 | 점수 표시, 평균 계산, 진행 상태 표시 | 구현 | 2개 |
| 03 | 품질 검수 루프 시스템 | `components/card-news/quality/QualityLoop.tsx` | 구축 | 루프(최대 3회), 점수 히스토리, 사용자 제어반영 | 구현 | 3개 |

### Frontmatter

wave: 1
autonomous: true
depends_on: []
objective: 에이전트 병렬 평가 시스템 구축
requirements: QUAL-01, QUAL-02, QUAL-03
files_modified: [components/card-news/quality/EvaluationSystem.tsx, components/card-news/quality/ScoreDisplay.tsx, components/card-news/quality/QualityLoop.tsx]

---

## Plan 02-01: 에이전트 병렬 평가 시스템 구축

### Task 1: 에이전트 병렬 평가 시스템 구축

**Action:** 클라이언트 상태 관리용 타입 정의

**Files:**
- `components/card-news/quality/EvaluationSystem.tsx` - 상태 관리와 점수 합산을 위한 커스템 구축

**Code:**
```typescript
import { Card } from '@/components/ui/card';

export type EvaluationState = {
  phase: 'quality-evaluation',
  scores: [],
  averageScore: 0,
  loopCount: 0,
  maxLoops: 3,
  isEvaluating: false,
};

export type AgentRole = 'hooking' | 'copy';

export type AgentEvaluation = {
  agentId: string;
  agentType: 'hooking' | 'copy';
  score: number;
  comment: string;
};

export type AgentScoreHistory = {
  evaluationId: string;
  scores: AgentEvaluation[];
};

export type ReviewResult = {
  evaluationId: string;
  isApproved: boolean;
  comments: string[];
};
```

**Done**: 병렬 평가를 위한 상태 관리 시스템 구축 완료

---

## Plan 02-02: 점수 합산 UI

### Overview

에이전트 병렬 평가에서 산출된 점수를 표시하고 평균 점수를 계산합니다.

**Files:**
- `components/card-news/quality/ScoreDisplay.tsx` - 점수 및 평균 표시 컴포넌트

**Done**: 점수 합산 시스템 구축 완료