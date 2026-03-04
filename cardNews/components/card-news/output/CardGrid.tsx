'use client';

import { useState, useCallback } from 'react';
import type { CardNewsItem, DesignToken } from '@/components/lib/types';
import { CardRenderer } from './CardRenderer';
import { Button } from '@/components/ui/button';

interface CardGridProps {
  /** All cards to render */
  cards: CardNewsItem[];
  /** Design token to apply */
  designToken: DesignToken;
  /** Called when a card is updated */
  onUpdate: (index: number, field: 'headline' | 'subtext', value: string) => void;
}

/**
 * Grid view for card news cards
 * DSGN-04: 그리드 뷰 (2x2 또는 3x3 그리드로 한눈에 보기)
 * DSGN-05: 편집 모드: 편집 중에는 다른 카드 상호작용 비활성화
 */
export function CardGrid({ cards, designToken, onUpdate }: CardGridProps) {
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [scale, setScale] = useState(0.25); // Default scale for grid view

  // Sort cards by order
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  const handleStartEdit = useCallback((index: number) => {
    setEditingCard(index);
  }, []);

  const handleFinishEdit = useCallback(() => {
    setEditingCard(null);
  }, []);

  const handleCardUpdate = useCallback(
    (index: number, field: 'headline' | 'subtext', value: string) => {
      onUpdate(index, field, value);
    },
    [onUpdate]
  );

  return (
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
  );
}
