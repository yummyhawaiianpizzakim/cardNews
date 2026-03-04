'use client';

import { useState, useCallback } from 'react';
import type { CardNewsResponse, CardNewsItem } from '@/components/lib/types';
import { ApiKeyInput } from '@/components/card-news/ApiKeyInput';
import { ResearchForm } from '@/components/card-news/ResearchForm';
import { ResearchResults } from '@/components/card-news/ResearchResults';
import { CardNewsList } from '@/components/card-news/CardNewsList';
import { QualityLoop } from '@/components/card-news/quality/QualityLoop';
import { StructureReview } from '@/components/card-news/structure/StructureReview';
import { DesignOrchestration } from '@/components/card-news/design/DesignOrchestration';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

type StageStatus = 'idle' | 'loading' | 'complete' | 'error' | 'warning';

function stageBadge(status: StageStatus): { variant: 'outline' | 'secondary' | 'success' | 'destructive' | 'warning'; label: string } {
  switch (status) {
    case 'loading':  return { variant: 'secondary',    label: '진행 중...' };
    case 'complete': return { variant: 'success',      label: '완료' };
    case 'error':    return { variant: 'destructive',  label: '오류' };
    case 'warning':  return { variant: 'warning',      label: '최대 시도' };
    default:         return { variant: 'outline',      label: '대기 중' };
  }
}

export default function CardNewsPage() {
  const [apiKey, setApiKey] = useState('');
  const [cardNewsData, setCardNewsData] = useState<CardNewsResponse | null>(null);
  const [cards, setCards] = useState<CardNewsItem[]>([]);
  const [approvedCards, setApprovedCards] = useState<CardNewsItem[]>([]);

  const [openItems, setOpenItems] = useState<string[]>(['stage-1']);
  const [stage1Status, setStage1Status] = useState<StageStatus>('idle');
  const [stage2Status, setStage2Status] = useState<StageStatus>('idle');
  const [stage3Status, setStage3Status] = useState<StageStatus>('idle');
  const [stage4Status, setStage4Status] = useState<StageStatus>('idle');

  const handleGenerate = useCallback((data: CardNewsResponse) => {
    setCardNewsData(data);
    setCards(data.cards);
    setStage1Status('complete');
    setStage2Status('idle');
    setOpenItems(prev => Array.from(new Set([...prev, 'stage-2'])));
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-4xl font-bold mb-2">AI 카드뉴스 자동 제작</h1>
          <p className="text-muted-foreground">
            주제를 입력하면 AI가 리서치부터 카피 작성, 품질 검수, 구조 검토, 최종 이미지 출력까지 전 과정을 자동화합니다.
          </p>
        </header>

        {/* API Key always visible above accordion (UI-04) */}
        <ApiKeyInput value={apiKey} onChange={setApiKey} />

        <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>

          {/* Stage 1: Research & Copy (UI-01, UI-02, UI-03) */}
          <AccordionItem value="stage-1">
            <AccordionTrigger>
              <div className="flex items-center gap-3 flex-1 pr-2">
                <span className="font-medium">1단계: 리서치 & 카피 생성</span>
                <Badge variant={stageBadge(stage1Status).variant}>
                  {stageBadge(stage1Status).label}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent forceMount className="data-[state=closed]:hidden">
              <div className="space-y-6 pt-2">
                <ResearchForm
                  apiKey={apiKey}
                  onGenerate={handleGenerate}
                  onLoadingChange={(loading) =>
                    setStage1Status(loading ? 'loading' : (cardNewsData ? 'complete' : 'idle'))
                  }
                />
                {cardNewsData && (
                  <ResearchResults sources={cardNewsData.researchSources} />
                )}
                {cards.length > 0 && (
                  <CardNewsList cards={cards} onUpdate={setCards} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Stage 2: Quality Verification (UI-01, UI-02, UI-03) */}
          <AccordionItem value="stage-2">
            <AccordionTrigger
              disabled={cards.length === 0}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3 flex-1 pr-2">
                <span className="font-medium">2단계: 품질 검수</span>
                <Badge variant={stageBadge(stage2Status).variant}>
                  {stageBadge(stage2Status).label}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent forceMount className="data-[state=closed]:hidden">
              <div className="pt-2">
                <QualityLoop
                  cards={cards}
                  apiKey={apiKey}
                  onApproved={(approved) => {
                    setCards(approved);
                    setApprovedCards(approved);
                    setStage2Status('complete');
                    setOpenItems(prev => Array.from(new Set([...prev, 'stage-3'])));
                  }}
                  onMaxLoopsReached={(finalCards) => {
                    setCards(finalCards);
                    setApprovedCards(finalCards);
                    setStage2Status('warning');
                    setOpenItems(prev => Array.from(new Set([...prev, 'stage-3'])));
                  }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Stage 3: Structure Review (UI-01, UI-02, UI-03) */}
          <AccordionItem value="stage-3">
            <AccordionTrigger
              disabled={approvedCards.length === 0}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3 flex-1 pr-2">
                <span className="font-medium">3단계: 구조 검토</span>
                <Badge variant={stageBadge(stage3Status).variant}>
                  {stageBadge(stage3Status).label}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent forceMount className="data-[state=closed]:hidden">
              <div className="pt-2">
                <StructureReview
                  cards={approvedCards}
                  apiKey={apiKey}
                  onApplied={(updatedCards) => {
                    setApprovedCards(updatedCards);
                    setCards(updatedCards);
                    setStage3Status('complete');
                    setOpenItems(prev => Array.from(new Set([...prev, 'stage-4'])));
                  }}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Stage 4: Design & Output (UI-01, UI-02, UI-03) */}
          <AccordionItem value="stage-4">
            <AccordionTrigger
              disabled={approvedCards.length === 0}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3 flex-1 pr-2">
                <span className="font-medium">4단계: 디자인 & 출력</span>
                <Badge variant={stageBadge(stage4Status).variant}>
                  {stageBadge(stage4Status).label}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent forceMount className="data-[state=closed]:hidden">
              <div className="pt-2">
                <DesignOrchestration
                  cards={approvedCards}
                  apiKey={apiKey}
                  onCardsUpdate={(updatedCards) => {
                    setApprovedCards(updatedCards);
                    setCards(updatedCards);
                  }}
                  onTokenExtracted={() => setStage4Status('complete')}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  );
}
