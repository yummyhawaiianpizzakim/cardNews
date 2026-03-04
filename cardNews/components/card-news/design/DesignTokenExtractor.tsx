'use client';

import { useCallback } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { type DesignToken, getDefaultDesignToken } from '@/components/lib/types';

interface DesignTokenExtractorProps {
  apiKey: string;
  base64Image: string;
  onTokenExtracted: (token: DesignToken) => void;
  onError?: (error: string) => void;
}

/**
 * Extract design tokens from reference image using Claude Vision API
 * DSGN-02: Claude Vision으로 레퍼런스 이미지를 분석한다
 * DSGN-03: 추출 항목: 주색상·보조색상, 폰트 스타일, 레이아웃 패턴, 전체 무드
 */
export async function analyzeReferenceImage(
  apiKey: string,
  base64Image: string
): Promise<DesignToken> {
  const anthropic = new Anthropic({ apiKey });

  const mediaType = base64Image.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
  const imageData = base64Image.split(',')[1]; // Remove data URL prefix

  const prompt = `이 이미지의 디자인 토큰을 추출하세요. 반드시 다음 JSON 형식으로만 응답하세요:
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

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON with fallback (following QualityLoop.tsx pattern)
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
  apiKey,
  base64Image,
  onTokenExtracted,
  onError,
}: DesignTokenExtractorProps) {
  const extractToken = useCallback(async () => {
    if (!apiKey) {
      onError?.('API 키가 필요합니다.');
      return;
    }

    try {
      const token = await analyzeReferenceImage(apiKey, base64Image);
      onTokenExtracted(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : '이미지 분석에 실패했습니다.';
      onError?.(message);
    }
  }, [apiKey, base64Image, onTokenExtracted, onError]);

  // Extract when component mounts with valid image
  // Parent component can call this if needed for manual trigger
  return {
    extractToken,
  };
}
