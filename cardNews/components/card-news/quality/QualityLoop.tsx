'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScoreDisplay } from './ScoreDisplay';
import {
  useEvaluationSystem,
  calcAverageScore,
  buildEvaluationId,
  MAX_LOOPS,
  PASS_THRESHOLD,
  type AgentEvaluation,
} from './EvaluationSystem';
import type { CardNewsItem } from '@/components/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QualityLoopProps {
  /** Cards to evaluate */
  cards: CardNewsItem[];
  /** Claude API key */
  apiKey: string;
  /** Called when cards are approved (quality >= 75) */
  onApproved: (cards: CardNewsItem[]) => void;
  /** Called when max loops reached without approval */
  onMaxLoopsReached?: (cards: CardNewsItem[]) => void;
}

// ─── Agent prompt builders ────────────────────────────────────────────────────

function buildHookingAgentPrompt(cards: CardNewsItem[]): string {
  const cardSummary = cards
    .map((c) => `[${c.type.toUpperCase()} ${c.order}]\n헤드라인: ${c.headline}\n서브텍스트: ${c.subtext}`)
    .join('\n\n');

  return `당신은 카드뉴스 후킹 전문가입니다. 다음 카드뉴스 콘텐츠를 평가하고 0~100점으로 채점하세요.

평가 기준:
- 표지(Cover) 헤드라인의 클릭 유도력 (30점)
- 본문 카드의 정보 전달력과 흥미 유지 (50점)
- CTA 카드의 행동 유도력 (20점)

평가할 카드뉴스:
${cardSummary}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "score": <0~100 정수>,
  "comment": "<구체적인 개선 제안 1~2문장>"
}`;
}

function buildCopyAgentPrompt(cards: CardNewsItem[]): string {
  const cardSummary = cards
    .map((c) => `[${c.type.toUpperCase()} ${c.order}]\n헤드라인: ${c.headline}\n서브텍스트: ${c.subtext}`)
    .join('\n\n');

  return `당신은 카드뉴스 카피 에디터입니다. 다음 카드뉴스 콘텐츠를 평가하고 0~100점으로 채점하세요.

평가 기준:
- 문체의 일관성과 자연스러움 (30점)
- 핵심 메시지의 명확성 (40점)
- 타겟 독자에 대한 적합성 (30점)

평가할 카드뉴스:
${cardSummary}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "score": <0~100 정수>,
  "comment": "<구체적인 개선 제안 1~2문장>"
}`;
}

function buildRewritePrompt(cards: CardNewsItem[], comments: string[]): string {
  const cardSummary = cards
    .map((c) => `[${c.type.toUpperCase()} ${c.order}]\n헤드라인: ${c.headline}\n서브텍스트: ${c.subtext}`)
    .join('\n\n');

  const commentsText = comments.map((c, i) => `${i + 1}. ${c}`).join('\n');

  return `다음 에이전트 피드백을 반영하여 카드뉴스 카피를 개선하세요.

에이전트 피드백:
${commentsText}

현재 카드뉴스:
${cardSummary}

반드시 다음 JSON 형식으로만 응답하세요 (카드 수와 type/order는 그대로 유지):
{
  "cards": [
    { "type": "cover", "order": 0, "headline": "...", "subtext": "..." },
    ...
  ]
}`;
}

// ─── Claude API helper ────────────────────────────────────────────────────────

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

function parseJsonFromText(text: string): unknown {
  // Extract JSON block from the response, handling markdown code fences
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(raw);
}

// ─── Status Bar ───────────────────────────────────────────────────────────────

interface StatusBarProps {
  phase: string;
  loopCount: number;
  maxLoops: number;
}

function StatusBar({ phase, loopCount, maxLoops }: StatusBarProps) {
  const phaseLabel: Record<string, string> = {
    idle: '대기 중',
    evaluating: '평가 중...',
    approved: '통과',
    rewriting: '재작성 중...',
    failed: '최대 시도 초과',
  };

  const phaseVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    idle: 'outline',
    evaluating: 'secondary',
    approved: 'default',
    rewriting: 'secondary',
    failed: 'destructive',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge variant={phaseVariant[phase] ?? 'outline'}>{phaseLabel[phase] ?? phase}</Badge>
        {loopCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {loopCount} / {maxLoops} 회차
          </span>
        )}
      </div>
      <div className="w-32">
        <Progress value={(loopCount / maxLoops) * 100} className="h-1.5" />
      </div>
    </div>
  );
}

// ─── Main QualityLoop Component ───────────────────────────────────────────────

export function QualityLoop({ cards, apiKey, onApproved, onMaxLoopsReached }: QualityLoopProps) {
  const { state, startEvaluation, recordEvaluationResult, setError, reset } = useEvaluationSystem();

  const runEvaluationLoop = useCallback(
    async (currentCards: CardNewsItem[]) => {
      if (!apiKey) {
        setError('API 키가 필요합니다.');
        return;
      }

      startEvaluation();

      try {
        // ── Parallel evaluation: run both agents simultaneously ──
        const [hookingRaw, copyRaw] = await Promise.all([
          callClaude(apiKey, buildHookingAgentPrompt(currentCards)),
          callClaude(apiKey, buildCopyAgentPrompt(currentCards)),
        ]);

        const hookingParsed = parseJsonFromText(hookingRaw) as { score: number; comment: string };
        const copyParsed = parseJsonFromText(copyRaw) as { score: number; comment: string };

        const evaluations: AgentEvaluation[] = [
          {
            agentId: buildEvaluationId(state.loopCount) + '-hooking',
            agentType: 'hooking',
            score: Math.max(0, Math.min(100, Math.round(hookingParsed.score))),
            comment: hookingParsed.comment,
          },
          {
            agentId: buildEvaluationId(state.loopCount) + '-copy',
            agentType: 'copy',
            score: Math.max(0, Math.min(100, Math.round(copyParsed.score))),
            comment: copyParsed.comment,
          },
        ];

        const avg = calcAverageScore(evaluations);
        recordEvaluationResult(evaluations);

        if (avg >= PASS_THRESHOLD) {
          onApproved(currentCards);
          return;
        }

        const nextLoopCount = state.loopCount + 1;
        if (nextLoopCount >= MAX_LOOPS) {
          onMaxLoopsReached?.(currentCards);
          return;
        }

        // ── Rewrite: improve cards based on agent comments ──
        const comments = evaluations.map((e) => e.comment);
        const rewriteRaw = await callClaude(apiKey, buildRewritePrompt(currentCards, comments));
        const rewriteParsed = parseJsonFromText(rewriteRaw) as { cards: CardNewsItem[] };

        if (!Array.isArray(rewriteParsed.cards) || rewriteParsed.cards.length === 0) {
          setError('재작성 결과를 파싱할 수 없습니다.');
          return;
        }

        // Recursively run next evaluation loop with rewritten cards
        await runEvaluationLoop(rewriteParsed.cards);
      } catch (err) {
        setError(err instanceof Error ? err.message : '평가 중 오류가 발생했습니다.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiKey, state.loopCount, startEvaluation, recordEvaluationResult, setError, onApproved, onMaxLoopsReached]
  );

  const handleStart = () => {
    runEvaluationLoop(cards);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">품질 검수</CardTitle>
          <div className="flex gap-2">
            {state.phase === 'idle' && (
              <Button onClick={handleStart} disabled={!apiKey || cards.length === 0}>
                품질 검수 시작
              </Button>
            )}
            {(state.phase === 'approved' || state.phase === 'failed') && (
              <Button variant="outline" onClick={handleReset}>
                다시 검수
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.phase !== 'idle' && (
          <StatusBar
            phase={state.phase}
            loopCount={state.loopCount}
            maxLoops={state.maxLoops}
          />
        )}

        {state.error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {state.phase === 'approved' && (
          <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
            품질 검수 통과! 다음 단계로 진행할 수 있습니다.
          </div>
        )}

        {state.phase === 'failed' && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            최대 {MAX_LOOPS}회 재작성 후에도 기준({PASS_THRESHOLD}점)을 충족하지 못했습니다.
            직접 수정하거나 다시 검수를 진행하세요.
          </div>
        )}

        <ScoreDisplay
          history={state.history}
          isEvaluating={state.isEvaluating}
        />

        {state.phase === 'idle' && cards.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            카드뉴스를 먼저 생성해 주세요.
          </p>
        )}

        {state.phase === 'idle' && !apiKey && (
          <p className="text-sm text-muted-foreground text-center py-4">
            API 키를 입력해야 품질 검수를 시작할 수 있습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
