'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AgentEvaluation, AgentScoreHistory } from './EvaluationSystem';
import { PASS_THRESHOLD } from './EvaluationSystem';

// ─── Score Badge ──────────────────────────────────────────────────────────────

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'lg';
}

function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  const isPass = score >= PASS_THRESHOLD;
  const variant = isPass ? 'default' : 'destructive';
  const label = isPass ? '통과' : '미달';
  const textSize = size === 'lg' ? 'text-2xl font-bold' : 'text-sm font-semibold';

  return (
    <div className="flex items-center gap-2">
      <span className={textSize}>{score}점</span>
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}

// ─── Agent Score Card ─────────────────────────────────────────────────────────

interface AgentScoreCardProps {
  evaluation: AgentEvaluation;
}

function AgentScoreCard({ evaluation }: AgentScoreCardProps) {
  const agentLabel = evaluation.agentType === 'hooking' ? '후킹 전문가' : '카피 에디터';
  const isPass = evaluation.score >= PASS_THRESHOLD;

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{agentLabel}</span>
        <ScoreBadge score={evaluation.score} />
      </div>
      <Progress
        value={evaluation.score}
        className={`h-2 ${isPass ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
      />
      {evaluation.comment && (
        <p className="text-xs text-muted-foreground border-l-2 border-muted pl-2 mt-1">
          {evaluation.comment}
        </p>
      )}
    </div>
  );
}

// ─── Average Score Display ────────────────────────────────────────────────────

interface AverageScoreProps {
  averageScore: number;
  loopIndex: number;
}

function AverageScorePanel({ averageScore, loopIndex }: AverageScoreProps) {
  const isPass = averageScore >= PASS_THRESHOLD;

  return (
    <div
      className={`rounded-lg p-4 flex items-center justify-between ${
        isPass ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}
    >
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">
          {loopIndex + 1}회차 평균 점수
        </p>
        <ScoreBadge score={averageScore} size="lg" />
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">
          {isPass ? `기준 ${PASS_THRESHOLD}점 이상 통과` : `기준 ${PASS_THRESHOLD}점 미달`}
        </p>
        <Progress
          value={averageScore}
          className={`mt-1 h-3 w-28 ${isPass ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
        />
      </div>
    </div>
  );
}

// ─── Single Evaluation Round Display ─────────────────────────────────────────

interface EvaluationRoundProps {
  entry: AgentScoreHistory;
  isLatest?: boolean;
}

export function EvaluationRound({ entry, isLatest = false }: EvaluationRoundProps) {
  return (
    <Card className={isLatest ? 'border-primary/50 shadow-sm' : 'opacity-70'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {entry.loopIndex + 1}회차 평가 결과
          </CardTitle>
          {isLatest && (
            <Badge variant="outline" className="text-xs">
              최신
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AverageScorePanel averageScore={entry.averageScore} loopIndex={entry.loopIndex} />
        <div className="space-y-2">
          {entry.scores.map((evaluation) => (
            <AgentScoreCard key={evaluation.agentId} evaluation={evaluation} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Full Score History Display ───────────────────────────────────────────────

interface ScoreDisplayProps {
  history: AgentScoreHistory[];
  isEvaluating?: boolean;
}

export function ScoreDisplay({ history, isEvaluating = false }: ScoreDisplayProps) {
  if (history.length === 0 && !isEvaluating) return null;

  if (isEvaluating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">품질 평가 중...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>에이전트 평가 진행 중</span>
            </div>
            <Progress value={undefined} className="h-2 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">품질 평가 결과</h3>
      {[...history].reverse().map((entry, reversedIndex) => (
        <EvaluationRound
          key={entry.evaluationId}
          entry={entry}
          isLatest={reversedIndex === 0}
        />
      ))}
    </div>
  );
}
