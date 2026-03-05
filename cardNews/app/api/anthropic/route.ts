import { NextResponse } from 'next/server';
import type { CardNewsResponse } from '@/components/lib/types';

const GLM_API_URL = 'https://api.z.ai/api/paas/v4/chat/completions';

async function callGLM(
  messages: Array<{ role: string; content: string }>,
  model = 'glm-4.5-air'
): Promise<string> {
  const response = await fetch(GLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${process.env.GLM_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 4096 }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GLM API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, audience } = body;

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }
    if (!audience?.trim()) {
      return NextResponse.json({ error: 'Audience is required' }, { status: 400 });
    }
    if (!process.env.GLM_API_KEY) {
      return NextResponse.json({ error: 'GLM API key not configured' }, { status: 500 });
    }

    const responseText = await callGLM([
      {
        role: 'system',
        content:
          '당신은 카드뉴스 전문 카피라이터입니다. 주어진 주제로 인스타그램 카드뉴스를 생성하세요.',
      },
      {
        role: 'user',
        content: `주제: ${topic}\n타깃 독자: ${audience}\n\n다음 형식의 JSON으로만 응답하세요:\n{"cards": [{"type": "cover"|"body"|"cta", "headline": "...", "subtext": "...", "order": 1}], "researchSources": [{"title": "...", "url": "...", "summary": "..."}]}\n\n구성: 커버 카드 1개(훅), 본문 카드 4-6개(카드당 헤드라인 1줄 + 서브텍스트 2-3줄), CTA 카드 1개. researchSources는 관련 참고 자료 2-3개.`,
      },
    ]);

    let responseData: CardNewsResponse;
    try {
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/(\{[\s\S]*\})/);
      const raw = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      responseData = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GLM API error:', error);
    return NextResponse.json({ error: 'Failed to generate card news.' }, { status: 500 });
  }
}
