import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type {
  CardNewsResponse,
  GenerateRequest,
} from '@/components/lib/types';

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json();
    const { topic, audience, apiKey } = body;

    // Validate required fields
    if (!topic || topic.trim() === '') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    if (!audience || audience.trim() === '') {
      return NextResponse.json(
        { error: 'Audience is required' },
        { status: 400 }
      );
    }

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Initialize Anthropic client with the API key from request
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Configure web search tool
    // Note: web_search is a built-in tool, no custom schema needed
    // The beta header enables web_search functionality

    // First API call: Research
    const researchResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: 'You are a research assistant. Search for at least 3 credible sources with recent statistics, examples, or case studies about the topic. Include specific URLs for citation.',
      messages: [
        {
          role: 'user',
          content: `Research the following topic for card news content: ${topic}. Target Audience: ${audience}. Search for at least 3 credible sources with recent statistics, examples, or case studies.`,
        },
      ],
      // Enable web_search via beta header, no tools array needed for built-in tools
    }, {
      headers: {
        'anthropic-beta': 'tools-2025-09-04',
      },
    });

    // Extract research context from the response
    const researchContext = researchResponse.content[0].type === 'text'
      ? researchResponse.content[0].text
      : '';

    // Second API call: Generate card news copy
    const copyResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: 'You are a professional copywriter specializing in Instagram card news. Generate card news in the following structure: 1 cover card (hook), 4-6 body cards (each with 1 headline + 2-3 sentences), 1 CTA card. Each card: headline 1 line, subtext 2-3 lines.',
      messages: [
        {
          role: 'user',
          content: `Based on the following research, generate card news copy. Topic: ${topic}. Target Audience: ${audience}. Research Context: ${researchContext}. Format as JSON with 'cards' array (type, headline, subtext, order) and 'researchSources' array (title, url, summary).`,
        },
      ],
    });

    // Parse the JSON response
    const responseText = copyResponse.content[0].type === 'text'
      ? copyResponse.content[0].text
      : '{}';

    let responseData: CardNewsResponse;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    // Return the structured response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Anthropic API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate card news. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}
