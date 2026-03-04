'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CardNewsItem, DesignToken } from '@/components/lib/types';
import { getDefaultDesignToken } from '@/components/lib/types';
import { ImageUpload } from './ImageUpload';
import { DesignTokenExtractor, analyzeReferenceImage } from './DesignTokenExtractor';
import { useDesignTokenSystem } from './DesignTokenSystem';
import { CardRenderer } from '../output/CardRenderer';
import { Button } from '@/components/ui/button';
import { DownloadControls } from '../output/DownloadControls';
import { Badge } from '@/components/ui/badge';

interface DesignOrchestrationProps {
  /** Cards from structure review */
  cards: CardNewsItem[];
  /** Called when cards are updated */
  onCardsUpdate: (cards: CardNewsItem[]) => void;
  /** Called when design token is successfully extracted from a reference image */
  onTokenExtracted?: () => void;
}

/**
 * Main design section orchestration component
 * Combines image upload, token extraction, card rendering, and downloads
 */
export function DesignOrchestration({
  cards,
  onCardsUpdate,
  onTokenExtracted,
}: DesignOrchestrationProps) {
  const { state: designState, setDesignToken, setError } = useDesignTokenSystem();
  const [analyzing, setAnalyzing] = useState(false);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [scale, setScale] = useState(0.25);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize card refs
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, cards.length);
  }, [cards.length]);

  const handleImageUpload = useCallback(
    async (base64Image: string) => {
      setAnalyzing(true);

      try {
        const token = await analyzeReferenceImage(base64Image);
        setDesignToken(token);
        onTokenExtracted?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : '이미지 분석에 실패했습니다.';
        setError(message);
      } finally {
        setAnalyzing(false);
      }
    },
    [setDesignToken, setError, onTokenExtracted]
  );

  const handleCardUpdate = useCallback(
    (index: number, field: 'headline' | 'subtext', value: string) => {
      const updatedCards = [...cards];
      updatedCards[index] = {
        ...updatedCards[index],
        [field]: value,
      };
      onCardsUpdate(updatedCards);
    },
    [cards, onCardsUpdate]
  );

  const handleSetCardRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[index] = el;
  }, []);

  const handleStartEdit = useCallback((index: number) => {
    setEditingCard(index);
  }, []);

  const handleFinishEdit = useCallback(() => {
    setEditingCard(null);
  }, []);

  // Sort cards by order for consistent display
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  // Prepare card elements for download (using original order, not sorted)
  const cardElements = cards.map((card, index) => ({
    element: cardRefs.current[index],
    cardType: card.type,
    order: card.order,
  }));

  const designToken = designState.token || getDefaultDesignToken();

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">디자인 & 출력</h2>
        <Badge variant="outline">Phase 4</Badge>
      </div>

      {/* Image upload section */}
      <ImageUpload
        onAnalyze={handleImageUpload}
        isAnalyzing={analyzing}
      />

      {/* Error display */}
      {designState.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
          {designState.error}
        </div>
      )}

      {/* Card grid with design tokens */}
      {cards.length > 0 && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">카드 미리보기</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  스케일: {Math.round(scale * 100)}%
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(Math.max(0.1, scale - 0.05))}
                  >
                    -
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(Math.min(1, scale + 0.05))}
                  >
                    +
                  </Button>
                </div>
                <Button
                  variant={editingCard !== null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (editingCard !== null) {
                      handleFinishEdit();
                    } else {
                      handleStartEdit(0);
                    }
                  }}
                >
                  {editingCard !== null ? '편집 완료' : '편집 모드'}
                </Button>
              </div>
            </div>

            {/* Grid view - responsive: 1 col mobile, 2 cols tablet, 3 cols desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-auto p-4">
              {sortedCards.map((card, index) => (
                <div
                  key={`${card.type}-${card.order}`}
                  className="flex justify-center"
                  style={{ transform: `scale(${scale})` }}
                >
                  <CardRenderer
                    ref={handleSetCardRef(card.order)}
                    card={card}
                    designToken={designToken}
                    isEditing={editingCard === index}
                    onUpdate={handleCardUpdate}
                    index={card.order}
                  />
                </div>
              ))}
            </div>

            {editingCard !== null && (
              <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
                카드 {editingCard + 1} 편집 중입니다. 클릭하여 텍스트를 수정하세요.
              </div>
            )}
          </div>

          {/* Download controls */}
          <DownloadControls cards={cardElements} isDownloading={analyzing} />
        </>
      )}
    </div>
  );
}
