'use client';

import { useState } from 'react';
import type { CardNewsResponse, CardNewsItem } from '@/components/lib/types';
import { ApiKeyInput } from '@/components/card-news/ApiKeyInput';
import { ResearchForm } from '@/components/card-news/ResearchForm';
import { ResearchResults } from '@/components/card-news/ResearchResults';
import { CardNewsList } from '@/components/card-news/CardNewsList';
import { QualityLoop } from '@/components/card-news/quality/QualityLoop';
import { StructureReview } from '@/components/card-news/structure/StructureReview';
import { DesignOrchestration } from '@/components/card-news/design/DesignOrchestration';

export default function CardNewsPage() {
  const [apiKey, setApiKey] = useState('');
  const [cardNewsData, setCardNewsData] = useState<CardNewsResponse | null>(null);
  const [cards, setCards] = useState<CardNewsItem[]>([]);
  const [approvedCards, setApprovedCards] = useState<CardNewsItem[]>([]);

  const handleGenerate = (data: CardNewsResponse) => {
    setCardNewsData(data);
    setCards(data.cards);
  };

  const handleUpdateCards = (updatedCards: CardNewsItem[]) => {
    setCards(updatedCards);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI 카드뉴스 자동 제작</h1>
          <p className="text-muted-foreground">
            주제를 입력하면 AI가 리서치부터 카피 작성, 품질 검수, 구조 검토, 최종 이미지 출력까지 전 과정을 자동화합니다.
          </p>
        </header>

        <div className="space-y-8">
          <ApiKeyInput value={apiKey} onChange={setApiKey} />

          <ResearchForm apiKey={apiKey} onGenerate={handleGenerate} />

          {cardNewsData && (
            <div className="space-y-8 pt-4">
              <hr className="border-border" />
              <ResearchResults sources={cardNewsData.researchSources} />

              {cards.length > 0 && (
                <>
                  <hr className="border-border" />
                  <CardNewsList cards={cards} onUpdate={handleUpdateCards} />
                  <hr className="border-border" />
                  <QualityLoop
                    cards={cards}
                    apiKey={apiKey}
                    onApproved={(approved) => {
                      setCards(approved);
                      setApprovedCards(approved);
                    }}
                    onMaxLoopsReached={(finalCards) => setCards(finalCards)}
                  />
                  {approvedCards.length > 0 && (
                    <>
                      <hr className="border-border" />
                      <StructureReview
                        cards={approvedCards}
                        apiKey={apiKey}
                        onApplied={(updatedCards) => {
                          setApprovedCards(updatedCards);
                          setCards(updatedCards);
                        }}
                      />
                      <hr className="border-border" />
                      <DesignOrchestration
                        cards={approvedCards}
                        apiKey={apiKey}
                        onCardsUpdate={(updatedCards) => {
                          setApprovedCards(updatedCards);
                          setCards(updatedCards);
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
