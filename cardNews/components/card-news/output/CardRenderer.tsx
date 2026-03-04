'use client';

import { forwardRef } from 'react';
import type { CardNewsItem, DesignToken } from '@/components/lib/types';
import { getCardStyle } from '@/components/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TextEditor } from './TextEditor';

interface CardRendererProps {
  /** Card data */
  card: CardNewsItem;
  /** Design token to apply */
  designToken: DesignToken;
  /** Is this card currently being edited? */
  isEditing?: boolean;
  /** Called when text changes */
  onUpdate: (index: number, field: 'headline' | 'subtext', value: string) => void;
  /** Card index in the array */
  index: number;
  /** Hide UI elements (for export) */
  hideUI?: boolean;
}

/**
 * Card renderer at 1080×1350px with design token application
 * DSGN-07: 각 카드를 1080×1350px PNG로 개별 렌더링한다
 * DSGN-04: CSS 변수로 디자인 토큰 적용
 */
export const CardRenderer = forwardRef<HTMLDivElement, CardRendererProps>(({
  card,
  designToken,
  isEditing = false,
  onUpdate,
  index,
  hideUI = false,
}, ref) => {
  // Get CSS styles from design token
  const cardStyle = getCardStyle(designToken);

  // Layout classes based on pattern
  const layoutClasses = {
    minimal: 'flex flex-col p-12 justify-between',
    bold: 'flex flex-col p-8 space-y-12',
    layered: 'relative p-12 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5',
    centered: 'flex flex-col items-center justify-center p-16 text-center',
  };

  // Text size classes
  const headlineClass = {
    minimal: 'text-6xl font-bold',
    bold: 'text-7xl font-black',
    layered: 'text-6xl font-bold',
    centered: 'text-6xl font-bold',
  };

  const subtextClass = {
    minimal: 'text-3xl leading-relaxed',
    bold: 'text-4xl font-medium',
    layered: 'text-3xl leading-relaxed',
    centered: 'text-3xl leading-relaxed',
  };

  const cardTypeLabel = card.type === 'cover' ? '표지' : card.type === 'cta' ? '마무리' : `본문 ${card.order}`;

  return (
    <div
      ref={ref}
      className={`w-[1080px] h-[1350px] bg-[var(--bg-color)] text-[var(--color-secondary)] font-[var(--font-family)] ${layoutClasses[designToken.layoutPattern as keyof typeof layoutClasses] || layoutClasses.minimal} transition-all`}
      style={cardStyle}
    >
      {/* Card type indicator (hidden during export) */}
      {!hideUI && (
        <Badge variant="outline" className="absolute top-6 right-6 z-10">
          {cardTypeLabel}
        </Badge>
      )}

      {/* Headline - editable */}
      <TextEditor
        value={card.headline}
        onChange={(value) => onUpdate(index, 'headline', value)}
        type="headline"
        className={`${headlineClass[designToken.layoutPattern as keyof typeof headlineClass] || headlineClass.minimal} text-[var(--color-primary)]`}
        disabled={!isEditing}
      />

      {/* Subtext - editable */}
      <TextEditor
        value={card.subtext}
        onChange={(value) => onUpdate(index, 'subtext', value)}
        type="subtext"
        rows={6}
        className={`${subtextClass[designToken.layoutPattern as keyof typeof subtextClass] || subtextClass.minimal}`}
        disabled={!isEditing}
      />

      {/* CTA button for CTA cards */}
      {card.type === 'cta' && (
        <Button
          className="w-80 h-20 text-2xl bg-[var(--color-accent)] hover:bg-[var(--color-primary)] text-[var(--bg-color)] font-semibold transition-colors"
        >
          {card.headline.split(' ').slice(-2).join(' ')}
        </Button>
      )}

      {/* Order indicator for body cards */}
      {card.type === 'body' && !hideUI && (
        <div className="absolute bottom-6 right-6 text-4xl font-bold text-[var(--color-primary)] opacity-20">
          {card.order + 1}
        </div>
      )}
    </div>
  );
});

CardRenderer.displayName = 'CardRenderer';
