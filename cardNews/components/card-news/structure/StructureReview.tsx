'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalList, ReviewingState } from './ProposalList';
import {
  useStructureSystem,
  applyProposals,
  type StructureProposal,
} from './StructureSystem';
import type { CardNewsItem } from '@/components/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StructureReviewProps {
  cards: CardNewsItem[];
  onApplied: (updatedCards: CardNewsItem[]) => void;
}

// ─── GLM API helper ───────────────────────────────────────────────────────────

async function callGLM(prompt: string): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.text as string;
}

function parseJsonFromText(text: string): unknown {
  // Extract JSON block from the response, handling markdown code fences
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(raw);
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildStoryFlowPrompt(cards: CardNewsItem[]): string {
  const cardSummary = cards
    .map((c) => `[${c.type.toUpperCase()} order=${c.order}]\n헤드라인: ${c.headline}\n서브텍스트: ${c.subtext}`)
    .join('\n\n');

  return `당신은 카드뉴스 스토리 흐름 전문가입니다. 카드의 논리적 순서 연결과 스크롤 유도 흐름을 분석하세요.

다음 카드뉴스 구조를 검토하고 개선 제안을 제시하세요. 최대 3개 이하의 제안만 출력하세요.

카드뉴스:
${cardSummary}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "summary": "전체 구조 평가 요약",
  "proposals": [
    {
      "type": "reorder",
      "reason": "변경 이유",
      "fromOrder": 1,
      "toOrder": 3
    }
  ]
}

각 proposal의 type별 필수 필드:
- "reorder": fromOrder, toOrder 필수
- "add": insertAfterOrder 필수, newCard 필수 (newCard는 { "type": "body", "headline": "...", "subtext": "..." })
- "delete": targetOrder 필수
- "edit": targetOrder 필수, newHeadline 또는 newSubtext 중 하나 이상 필수`;
}

function buildRetentionPrompt(cards: CardNewsItem[]): string {
  const cardSummary = cards
    .map((c) => `[${c.type.toUpperCase()} order=${c.order}]\n헤드라인: ${c.headline}\n서브텍스트: ${c.subtext}`)
    .join('\n\n');

  return `당신은 독자 이탈 방지 전문가입니다. 각 카드가 다음 카드로 넘기고 싶은 궁금증을 남기는지 검토하세요.

다음 카드뉴스 구조를 검토하고 개선 제안을 제시하세요. 최대 3개 이하의 제안만 출력하세요.

카드뉴스:
${cardSummary}

반드시 다음 JSON 형식으로만 응답하세요:
{
  "summary": "전체 구조 평가 요약",
  "proposals": [
    {
      "type": "edit",
      "reason": "변경 이유",
      "targetOrder": 2,
      "newHeadline": "새 헤드라인",
      "newSubtext": "새 서브텍스트"
    }
  ]
}

각 proposal의 type별 필수 필드:
- "reorder": fromOrder, toOrder 필수
- "add": insertAfterOrder 필수, newCard 필수 (newCard는 { "type": "body", "headline": "...", "subtext": "..." })
- "delete": targetOrder 필수
- "edit": targetOrder 필수, newHeadline 또는 newSubtext 중 하나 이상 필수`;
}

// ─── Raw proposal interface (for parsing) ────────────────────────────────────

interface RawProposal {
  type?: string;
  reason?: string;
  fromOrder?: number;
  toOrder?: number;
  insertAfterOrder?: number;
  newCard?: { type: string; headline: string; subtext: string };
  targetOrder?: number;
  newHeadline?: string;
  newSubtext?: string;
}

// ─── Proposal validation ──────────────────────────────────────────────────────

function isValidProposalType(type: string): type is StructureProposal['type'] {
  return ['reorder', 'add', 'delete', 'edit'].includes(type);
}

function validateRawProposal(raw: RawProposal): boolean {
  if (!raw.type || !isValidProposalType(raw.type) || !raw.reason) return false;
  if (raw.type === 'reorder') return raw.fromOrder !== undefined && raw.toOrder !== undefined;
  if (raw.type === 'add') return raw.insertAfterOrder !== undefined && raw.newCard !== undefined;
  if (raw.type === 'delete') return raw.targetOrder !== undefined;
  if (raw.type === 'edit') return raw.targetOrder !== undefined && (raw.newHeadline !== undefined || raw.newSubtext !== undefined);
  return false;
}

// ─── Main StructureReview Component ──────────────────────────────────────────

export function StructureReview({ cards, onApplied }: StructureReviewProps) {
  const {
    state,
    startReview,
    setProposals,
    toggleAccept,
    acceptAll,
    rejectAll,
    applyAccepted,
    setError,
    reset,
  } = useStructureSystem();

  const runStructureReview = useCallback(async () => {
    if (cards.length === 0) {
      setError('검토할 카드가 없습니다.');
      return;
    }

    startReview();

    try {
      const [storyRaw, retentionRaw] = await Promise.all([
        callGLM(buildStoryFlowPrompt(cards)),
        callGLM(buildRetentionPrompt(cards)),
      ]);

      const storyParsed = parseJsonFromText(storyRaw) as { summary: string; proposals: RawProposal[] };
      const retentionParsed = parseJsonFromText(retentionRaw) as { summary: string; proposals: RawProposal[] };

      const rawStoryProposals: RawProposal[] = Array.isArray(storyParsed.proposals) ? storyParsed.proposals : [];
      const rawRetentionProposals: RawProposal[] = Array.isArray(retentionParsed.proposals) ? retentionParsed.proposals : [];

      const storyProposals: StructureProposal[] = rawStoryProposals
        .filter((p) => {
          const valid = validateRawProposal(p);
          if (!valid) console.warn('[StructureReview] Invalid story-flow proposal discarded:', p);
          return valid;
        })
        .map((p, i) => ({
          id: `story-${i}`,
          type: p.type as StructureProposal['type'],
          source: 'story-flow' as const,
          reason: p.reason!,
          fromOrder: p.fromOrder,
          toOrder: p.toOrder,
          insertAfterOrder: p.insertAfterOrder,
          newCard: p.newCard as Omit<CardNewsItem, 'order'> | undefined,
          targetOrder: p.targetOrder,
          newHeadline: p.newHeadline,
          newSubtext: p.newSubtext,
        }));

      const retentionProposals: StructureProposal[] = rawRetentionProposals
        .filter((p) => {
          const valid = validateRawProposal(p);
          if (!valid) console.warn('[StructureReview] Invalid retention proposal discarded:', p);
          return valid;
        })
        .map((p, i) => ({
          id: `retention-${i}`,
          type: p.type as StructureProposal['type'],
          source: 'retention' as const,
          reason: p.reason!,
          fromOrder: p.fromOrder,
          toOrder: p.toOrder,
          insertAfterOrder: p.insertAfterOrder,
          newCard: p.newCard as Omit<CardNewsItem, 'order'> | undefined,
          targetOrder: p.targetOrder,
          newHeadline: p.newHeadline,
          newSubtext: p.newSubtext,
        }));

      const allProposals: StructureProposal[] = [...storyProposals, ...retentionProposals];
      setProposals(allProposals);
    } catch (err) {
      setError(err instanceof Error ? err.message : '구조 검토 중 오류가 발생했습니다.');
    }
  }, [cards, startReview, setProposals, setError]);

  const handleApply = useCallback(() => {
    const updatedCards = applyAccepted(cards);
    onApplied(updatedCards);
  }, [cards, applyAccepted, onApplied]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">구조 검토</CardTitle>
          <div className="flex gap-2">
            {state.phase === 'idle' && (
              <Button
                onClick={runStructureReview}
                disabled={cards.length === 0}
              >
                구조 검토 시작
              </Button>
            )}
            {(state.phase === 'done' || state.phase === 'error') && (
              <Button variant="outline" onClick={reset}>
                다시 검토
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {state.phase === 'idle' && cards.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            검토할 카드뉴스가 없습니다.
          </p>
        )}

{state.phase === 'reviewing' && <ReviewingState />}

        {(state.phase === 'proposed' || state.phase === 'applying') && (
          <ProposalList
            proposals={state.proposals}
            acceptedIds={state.acceptedIds}
            onToggle={toggleAccept}
            onAcceptAll={acceptAll}
            onRejectAll={rejectAll}
            onApply={handleApply}
            isApplying={state.phase === 'applying'}
          />
        )}

        {state.phase === 'done' && (
          <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
            구조 검토가 완료되었습니다. 변경사항이 적용되었습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
