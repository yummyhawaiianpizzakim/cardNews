'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface DownloadControlsProps {
  /** Array of card elements to download */
  cards: Array<{
    element: HTMLElement | null;
    cardType: 'cover' | 'body' | 'cta';
    order: number;
  }>;
  /** Is currently downloading? */
  isDownloading?: boolean;
}

/**
 * Download controls for individual PNG and ZIP batch downloads
 * DSGN-07: 각 카드를 1080×1350px PNG로 개별 렌더링한다
 * DSGN-08: 전체 카드를 ZIP 파일로 일괄 다운로드하는 버튼을 제공한다
 */

/**
 * Download single card as PNG
 */
async function downloadCardAsPNG(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2, // 2x for high quality (RESEARCH.md pitfall 2)
    width: 1080,
    height: 1350,
    useCORS: true, // RESEARCH.md pitfall 1
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    imageTimeout: 15000,
    onclone: (clonedDoc: Document) => {
      // Remove export-only elements (badges, etc.)
      const badges = clonedDoc.querySelectorAll('.export-hidden');
      badges.forEach(b => b.remove());
    },
  });

  // Convert to blob for better memory handling
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b: Blob | null) => resolve(b!), 'image/png', 1.0);
  });

  saveAs(blob, filename);
}

/**
 * Download all cards as ZIP
 */
async function downloadAllCardsAsZip(
  cards: DownloadControlsProps['cards'],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < cards.length; i++) {
    const { element, cardType, order } = cards[i];
    if (!element) continue;

    const canvas = await html2canvas(element, {
      scale: 2,
      width: 1080,
      height: 1350,
      useCORS: true,
      allowTaint: false,
      logging: false,
    });

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b: Blob | null) => resolve(b!), 'image/png', 1.0);
    });

    // Filename pattern: card-{order}-{type}.png
    const typeLabel = cardType === 'cover' ? 'cover' : cardType === 'cta' ? 'cta' : `body-${order}`;
    zip.file(`card-${typeLabel}.png`, blob);

    onProgress?.(i + 1, cards.length);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'card-news.zip');
}

export function DownloadControls({ cards, isDownloading = false }: DownloadControlsProps) {
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const handleDownloadAll = useCallback(async () => {
    const validCards = cards.filter(c => c.element !== null);
    if (validCards.length === 0) return;

    await downloadAllCardsAsZip(validCards, (current, total) => {
      setDownloadProgress({ current, total });
    });

    setDownloadProgress({ current: 0, total: 0 });
  }, [cards]);

  const handleDownloadSingle = useCallback(
    async (index: number) => {
      const { element, cardType, order } = cards[index];
      if (!element) return;

      const typeLabel = cardType === 'cover' ? 'cover' : cardType === 'cta' ? 'cta' : `body-${order}`;
      await downloadCardAsPNG(element, `card-${typeLabel}.png`);
    },
    [cards]
  );

  const validCards = cards.filter(c => c.element !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">다운로드</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ZIP batch download (DSGN-08) */}
        <div className="space-y-2">
          <Button
            onClick={handleDownloadAll}
            disabled={isDownloading || validCards.length === 0}
            className="w-full"
          >
            {isDownloading ? '다운로드 중...' : '전체 다운로드 (ZIP)'}
          </Button>

          {downloadProgress.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{downloadProgress.current} / {downloadProgress.total}</span>
                <span>{Math.round((downloadProgress.current / downloadProgress.total) * 100)}%</span>
              </div>
              <Progress value={(downloadProgress.current / downloadProgress.total) * 100} />
            </div>
          )}
        </div>

        {/* Individual downloads (DSGN-07) */}
        <div className="space-y-2">
          <p className="text-sm font-medium">개별 다운로드</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {cards.map((card, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleDownloadSingle(index)}
                disabled={!card.element || isDownloading}
                className="text-sm"
              >
                {card.cardType === 'cover'
                  ? '표지'
                  : card.cardType === 'cta'
                    ? '마무리'
                    : `본문 ${card.order + 1}`}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
