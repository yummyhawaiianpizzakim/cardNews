import { NextResponse } from 'next/server';

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export async function POST(req: Request) {
  try {
    const { base64Image, prompt } = await req.json();

    if (!process.env.GLM_API_KEY) {
      return NextResponse.json({ error: 'GLM API key not configured' }, { status: 500 });
    }

    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4v-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: base64Image },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`GLM Vision API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return NextResponse.json({ text: data.choices[0].message.content });
  } catch (error) {
    console.error('GLM vision error:', error);
    return NextResponse.json({ error: 'Vision analysis failed.' }, { status: 500 });
  }
}
