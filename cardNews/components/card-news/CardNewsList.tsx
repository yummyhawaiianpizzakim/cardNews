'use client';

import type { CardNewsItem } from '@/components/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface CardNewsListProps {
  cards: CardNewsItem[];
  onUpdate: (cards: CardNewsItem[]) => void;
}

export function CardNewsList({ cards, onUpdate }: CardNewsListProps) {
  // Sort cards by order for consistent display
  const sortedCards = [...cards].sort((a, b) => a.order - b.order);

  const handleCardUpdate = (index: number, field: 'headline' | 'subtext', value: string) => {
    const updatedCards = [...sortedCards];
    updatedCards[index] = {
      ...updatedCards[index],
      [field]: value,
    };
    onUpdate(updatedCards);
  };

  const getCardTypeLabel = (card: CardNewsItem): string => {
    switch (card.type) {
      case 'cover':
        return '표지';
      case 'cta':
        return '마무리';
      case 'body':
        return `본문 ${card.order}`;
      default:
        return card.type;
    }
  };

  if (sortedCards.length === 0) {
    return (
      <div className="p-6 border rounded-md bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">카드뉴스가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">카드뉴스</h2>
      <div className="space-y-4">
        {sortedCards.map((card, index) => (
          <Card key={`${card.type}-${card.order}`} className="border-l-4 border-l-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  <Badge variant="outline">{getCardTypeLabel(card)}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">헤드라인</label>
                <Textarea
                  value={card.headline}
                  onChange={(e) => handleCardUpdate(index, 'headline', e.target.value)}
                  className="mt-1 min-h-[60px]"
                  placeholder="헤드라인을 입력하세요"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">서브텍스트</label>
                <Textarea
                  value={card.subtext}
                  onChange={(e) => handleCardUpdate(index, 'subtext', e.target.value)}
                  className="mt-1 min-h-[120px]"
                  placeholder="서브텍스트를 입력하세요"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
