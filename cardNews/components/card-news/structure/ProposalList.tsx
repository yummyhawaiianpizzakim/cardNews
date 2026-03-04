'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { StructureProposal, ProposalType } from './StructureSystem';

// ─── Internal Constants ───────────────────────────────────────────────────────

const proposalTypeLabel: Record<ProposalType, string> = {
  reorder: '순서 변경',
  add: '카드 추가',
  delete: '카드 삭제',
  edit: '텍스트 수정',
};

const sourceLabel: Record<'story-flow' | 'retention', string> = {
  'story-flow': '스토리 흐름',
  retention: '독자 이탈 방지',
};

// ─── Proposal Card ────────────────────────────────────────────────────────────

interface ProposalCardProps {
  proposal: StructureProposal;
  accepted: boolean;
  onToggle: () => void;
}

function ProposalCard({ proposal, accepted, onToggle }: ProposalCardProps) {
  return (
    <Card
      className={`transition-colors ${
        accepted ? 'border-green-400' : 'border-muted'
      }`}
    >
      <CardContent className="pt-4 space-y-3">
        {/* Header row: type + source badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge>{proposalTypeLabel[proposal.type]}</Badge>
          <Badge variant="secondary">{sourceLabel[proposal.source]}</Badge>
        </div>

        {/* Reason */}
        <p className="text-sm text-muted-foreground">{proposal.reason}</p>

        {/* Type-specific detail */}
        {proposal.type === 'edit' && (
          <div className="rounded-md border border-muted bg-muted/30 p-3 space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground font-medium">변경 후 텍스트</span>
            </div>
            {proposal.newHeadline && (
              <p className="text-foreground">
                <span className="font-medium">제목:</span> {proposal.newHeadline}
              </p>
            )}
            {proposal.newSubtext && (
              <p className="text-foreground">
                <span className="font-medium">내용:</span> {proposal.newSubtext}
              </p>
            )}
          </div>
        )}

        {proposal.type === 'reorder' && (
          <p className="text-sm text-muted-foreground">
            {proposal.fromOrder}번 → {proposal.toOrder}번 위치 변경
          </p>
        )}

        {proposal.type === 'delete' && (
          <p className="text-sm text-muted-foreground">
            {proposal.targetOrder}번 카드 삭제
          </p>
        )}

        {proposal.type === 'add' && (
          <p className="text-sm text-muted-foreground">
            {proposal.insertAfterOrder}번 카드 뒤에 추가
          </p>
        )}

        {/* Accept / Reject toggle buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={accepted ? 'default' : 'outline'}
            onClick={onToggle}
            className={accepted ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Check className="h-4 w-4 mr-1" />
            수락
          </Button>
          <Button
            size="sm"
            variant={!accepted ? 'destructive' : 'outline'}
            onClick={onToggle}
          >
            <X className="h-4 w-4 mr-1" />
            거절
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Proposal List ────────────────────────────────────────────────────────────

interface ProposalListProps {
  proposals: StructureProposal[];
  acceptedIds: string[];
  onToggle: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onApply: () => void;
  isApplying: boolean;
}

export function ProposalList({
  proposals,
  acceptedIds,
  onToggle,
  onAcceptAll,
  onRejectAll,
  onApply,
  isApplying,
}: ProposalListProps) {
  if (proposals.length === 0) {
    return (
      <div className="rounded-md border border-muted p-6 text-center text-sm text-muted-foreground">
        제안 사항이 없습니다.
      </div>
    );
  }

  const acceptedCount = acceptedIds.length;
  const totalCount = proposals.length;
  const progressValue = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {acceptedCount} / {totalCount} 개 제안 선택됨
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onAcceptAll}>
            전체 수락
          </Button>
          <Button size="sm" variant="outline" onClick={onRejectAll}>
            전체 거절
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progressValue} className="h-2" />

      {/* Proposal cards */}
      <div className="space-y-3">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            accepted={acceptedIds.includes(proposal.id)}
            onToggle={() => onToggle(proposal.id)}
          />
        ))}
      </div>

      {/* Apply button */}
      <Button
        className="w-full"
        disabled={acceptedIds.length === 0 || isApplying}
        onClick={onApply}
      >
        {isApplying ? '적용 중...' : '변경 적용'}
      </Button>
    </div>
  );
}

// ─── Reviewing State ──────────────────────────────────────────────────────────

export function ReviewingState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">구조 검토 중...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>AI 에이전트가 카드 구조를 분석하고 있습니다</span>
          </div>
          <Progress value={undefined} className="h-2 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
