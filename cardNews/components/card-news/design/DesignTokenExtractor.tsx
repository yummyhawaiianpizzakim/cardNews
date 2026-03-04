'use client';

import { useCallback } from 'react';
import { type DesignToken, getDefaultDesignToken } from '@/components/lib/types';

interface DesignTokenExtractorProps {
  base64Image: string;
  onTokenExtracted: (token: DesignToken) => void;
  onError?: (error: string) => void;
}

const VISION_PROMPT = `이 이미지의 디자인 토큰을 추출하세요. 반드시 다음 JSON 형식으로만 응답하세요:
{
  "primaryColor": "#RRGGBB",
  "secondaryColor": "#RRGGBB",
  "accentColor": "#RRGGBB",
  "fontCategory": "sans-serif"|"serif"|"mono",
  "layoutPattern": "minimal"|"bold"|"layered"|"centered",
  "mood": "professional"|"playful"|"serious"|"elegant",
  "backgroundColor": "#RRGGBB"|"transparent"
}

추출할 항목:
- 주색상 (primaryColor): 가장 많이 사용된 메인 컬러 (헥스 코드)
- 보조색상 (secondaryColor): 2번째로 많이 사용된 컬러 (헥스 코드)
- 강조색 (accentColor): CTA나 포인트 요소에 사용된 컬러 (헥스 코드)
- 폰트 카테고리 (fontCategory): sans-serif/serif/mono 중 하나
- 레이아웃 패턴 (layoutPattern): minimal/bold/layered/centered 중 하나
- 전체 무드 (mood): professional/playful/serious/elegant 중 하나
- 배경색 (backgroundColor): 메인 배경색 (헥스 코드) 또는 transparent`;

export async function analyzeReferenceImage(base64Image: string): Promise<DesignToken> {
  try {
    const response = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, prompt: VISION_PROMPT }),
    });

    if (!response.ok) {
      console.error('Vision API error:', await response.text());
      return getDefaultDesignToken();
    }

    const data = await response.json();
    if (data.error) {
      console.error('Vision API error:', data.error);
      return getDefaultDesignToken();
    }

    const text = data.text as string;
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/(\{[\s\S]*\})/);
      const raw = jsonMatch ? jsonMatch[1].trim() : text.trim();
      return JSON.parse(raw) as DesignToken;
    } catch {
      console.warn('Failed to parse design token JSON, using default');
      return getDefaultDesignToken();
    }
  } catch (error) {
    console.error('Vision API error:', error);
    return getDefaultDesignToken();
  }
}

export function DesignTokenExtractor({
  base64Image,
  onTokenExtracted,
  onError,
}: DesignTokenExtractorProps) {
  const extractToken = useCallback(async () => {
    try {
      const token = await analyzeReferenceImage(base64Image);
      onTokenExtracted(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : '이미지 분석에 실패했습니다.';
      onError?.(message);
    }
  }, [base64Image, onTokenExtracted, onError]);

  return { extractToken };
}
