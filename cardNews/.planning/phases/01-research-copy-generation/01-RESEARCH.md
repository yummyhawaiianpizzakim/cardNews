# Phase 1: Research & Copy Generation - Research

**Researched:** 2026-03-03
**Domain:** Client-side AI integration with web search, React/Next.js UI patterns
**Confidence:** HIGH

## Summary

Phase 1 requires implementing client-side Anthropic Claude API integration with web_search tool capability, research result display UI using collapsible components, and card-based copy presentation. The project has already established a Next.js 15 + shadcn/ui stack, with all required UI components (Accordion, Card, Badge, Button, Input, Textarea, Toast) pre-installed.

**Primary recommendation:** Use Route Handlers as a secure proxy layer for Anthropic API calls while maintaining the client-side architecture. The web_search tool requires the `anthropic-beta: tools-2025-09-04` header and proper tool configuration. For UI, leverage existing shadcn/ui Accordion components for research results and Card components for copy display.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **주제 입력 방식**: 간단한 두 필드: 주제 입력 + 타깃 독자 입력
- **리서치 결과 표시**: 웹 서치 결과를 상세 출처와 함께 표시
- **카피 생성 UI**: 리스트 뷰 형태로 모든 카드를 표시

### Claude's Discretion
- 웹 서치 소스 수: 최소 3개 이상 추천
- 카드뉴스 카드 수: 4~6장 본문 카드 생성 (사용자가 직접 수정 가능하도록 유연하게 구현)

### Deferred Ideas (OUT OF SCOPE)
None

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RSCH-01 | 사용자가 주제와 타깃 독자를 입력할 수 있다 | Form inputs with existing Input/Textarea/Label components |
| RSCH-02 | Claude web_search 툴로 최신 정보·통계·사례를 수집한다 | Anthropic SDK with tools configuration |
| RSCH-03 | 수집 결과를 바탕으로 카드뉴스용 카피 초안을 자동 작성한다 | Structured prompt engineering with tool outputs |
| RSCH-04 | 리서치 출처와 요약을 UI에 함께 표시한다 | Accordion component for collapsible sources |
| RSCH-05 | 카드 구성은 표지(훅) 1장 + 본문 4~6장 + 마무리(CTA) 1장이다 | Data structure with card type fields |
| RSCH-06 | 각 카드당 헤드라인 1줄 + 서브텍스트 2~3줄 형식이다 | Card component with typography utilities |

## Standard Stack

### Core

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.33.1 | Official TypeScript SDK for Claude API | Type-safe API client, supports streaming, tools, and proper error handling |
| Next.js | 15.5.12 | React framework with App Router | Server-side Route Handlers for secure API proxy, client components for interactivity |
| React | 19.2.4 | UI library | Latest stable with improved performance and hooks |

### UI Components (Pre-installed via shadcn/ui)

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| Accordion | Collapsible sections | Research sources display, expandable card details |
| Card | Container components | Individual card news items, research result cards |
| Badge | Status indicators | Loading states, completion status, source quality |
| Input | Text input fields | Topic input, API key input |
| Textarea | Multi-line text fields | Target audience input, copy editing |
| Toast | Notifications | Error messages, success confirmations |
| Progress | Progress indicators | Research generation progress, card creation status |
| Button | Action triggers | Generate button, refresh button, download button |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 | Conditional class names | Dynamic className composition with tailwind-merge |
| tailwind-merge | 3.5.0 | Merge Tailwind classes intelligently | Prevent className conflicts in conditional styling |
| lucide-react | 0.469.0 | Icon library | UI icons for buttons, status indicators |
| class-variance-authority | 0.7.1 | Component variant management | Component variants (already used by shadcn/ui) |

**Installation:**
All packages are already installed. No additional installation required for Phase 1.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── anthropic/
│   │       └── route.ts           # Route Handler for Claude API (secure proxy)
│   ├── card-news/
│   │   └── page.tsx               # Main card news generation page
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page
│   └── globals.css                 # Global styles
├── components/
│   ├── ui/                         # shadcn/ui components (already exists)
│   ├── card-news/
│   │   ├── ResearchForm.tsx        # Topic and audience input form
│   │   ├── ResearchResults.tsx     # Research sources display (Accordion)
│   │   ├── CardNewsList.tsx        # List view of generated cards
│   │   ├── CardItem.tsx            # Individual card component
│   │   └── ApiKeyInput.tsx         # API key input component
│   └── lib/
│       └── types.ts                # TypeScript type definitions
```

### Pattern 1: Secure API Proxy with Route Handlers

**What:** Use Next.js Route Handlers as a secure proxy between client and Anthropic API, protecting API keys while enabling client-side interactivity.

**When to use:** All external API calls that require authentication, especially for client-side applications.

**Example:**

```typescript
// Source: Next.js 15 Route Handlers documentation + Anthropic SDK patterns
// app/api/anthropic/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, tools } = await req.json();

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages,
      tools,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Anthropic API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
```

### Pattern 2: Web Search Tool Configuration

**What:** Configure the web_search tool in Anthropic API calls to enable real-time information retrieval.

**When to use:** When AI needs current information, statistics, or examples from the web.

**Example:**

```typescript
// Source: Anthropic Tools API documentation (beta header: tools-2025-09-04)
const webSearchTool = {
  type: 'web_search',
  display_name: 'web_search',
};

const tools = [webSearchTool];

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: `Research the topic: ${topic}
Target audience: ${audience}

Search for at least 3 credible sources with recent statistics, examples, or case studies.
Include specific URLs for citation purposes.`
  }],
  tools,
}, {
  headers: {
    'anthropic-beta': 'tools-2025-09-04'
  }
});
```

### Pattern 3: Client-Side Data Fetching with useEffect

**What:** Use useEffect hook with fetch for simple client-side data fetching from Route Handlers.

**When to use:** Simple data fetching without complex caching or revalidation needs.

**Example:**

```typescript
// Source: Next.js 15 Client Components documentation
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function GenerateButton({ topic, audience, onResult }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: topic }],
          tools: [webSearchTool],
        }),
      });

      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();
      onResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return <Button onClick={handleGenerate} disabled={isLoading}>...</Button>;
}
```

### Pattern 4: Accordion for Collapsible Research Sources

**What:** Use shadcn/ui Accordion component to display research sources with expandable details.

**When to use:** Displaying list of sources where users can expand to see full details.

**Example:**

```typescript
// Source: shadcn/ui Accordion component patterns
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface ResearchSource {
  title: string;
  url: string;
  summary: string;
  relevanceScore: number;
}

export function ResearchResults({ sources }: { sources: ResearchSource[] }) {
  return (
    <Accordion type="multiple" className="w-full">
      {sources.map((source, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">출처 {index + 1}</Badge>
              <span className="font-medium">{source.title}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              <p className="text-sm text-muted-foreground">{source.summary}</p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                원문 보기
              </a>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

### Pattern 5: Card-Based Copy Display

**What:** Use shadcn/ui Card components with list layout for displaying generated card news copy.

**When to use:** Displaying card news items in a scrollable, scannable list format.

**Example:**

```typescript
// Source: shadcn/ui Card component patterns
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface CardNewsItem {
  type: 'cover' | 'body' | 'cta';
  headline: string;
  subtext: string;
  order: number;
}

export function CardNewsList({ cards, onUpdate }) {
  return (
    <div className="space-y-4">
      {cards.map((card, index) => (
        <Card key={card.order} className="border-l-4 border-l-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                <Badge variant="outline" className="mr-2">
                  {card.type === 'cover' ? '표지' : card.type === 'cta' ? '마무리' : `본문 ${index}`}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">헤드라인</label>
              <Textarea
                value={card.headline}
                onChange={(e) => onUpdate(index, { ...card, headline: e.target.value })}
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium">서브텍스트</label>
              <Textarea
                value={card.subtext}
                onChange={(e) => onUpdate(index, { ...card, subtext: e.target.value })}
                className="mt-1 min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Anti-Patterns to Avoid

- **Direct Anthropic API calls from client components:** Exposes API keys to browser, violates security best practices. Use Route Handlers as proxy.
- **Hardcoding API keys in source code:** Commits secrets to Git, exposes them publicly. Use environment variables without NEXT_PUBLIC_ prefix.
- **Mixing server and client state directly:** Server-only data in client components causes hydration errors. Use useEffect for client-side initialization.
- **Using useEffect for all data fetching:** Causes unnecessary re-renders and race conditions. Consider SWR or React Query for production-grade caching and revalidation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible UI components | Custom accordion logic | shadcn/ui Accordion (Radix UI-based) | Handles accessibility, keyboard navigation, ARIA attributes |
| Card layout/styling | Custom card CSS | shadcn/ui Card component | Consistent design system, responsive, theme-aware |
| Form validation logic | Custom validation | Zod schema + React Hook Form (future phases) | Type-safe validation, better UX |
| Class name merging | String concatenation | clsx + tailwind-merge | Prevents conflicts, handles conditional classes |
| API client | Custom fetch wrapper | @anthropic-ai/sdk | Official SDK handles authentication, streaming, errors |

**Key insight:** shadcn/ui components are already installed and configured. They provide accessible, customizable primitives that handle edge cases and browser compatibility that hand-rolled solutions would miss.

## Common Pitfalls

### Pitfall 1: API Key Exposure in Client Bundle

**What goes wrong:** Prefixing environment variables with NEXT_PUBLIC_ exposes them to the browser, making API keys visible in JavaScript source.

**Why it happens:** Developers assume environment variables are always server-side, not understanding Next.js's public variable mechanism.

**How to avoid:** Never use NEXT_PUBLIC_ prefix for secrets. Use Route Handlers that access server-side environment variables.

**Warning signs:** Seeing API keys in browser DevTools → Sources → Network tab, or in minified JavaScript bundle.

### Pitfall 2: CORS Errors with Anthropic API

**What goes wrong:** Direct browser calls to Anthropic API fail with CORS errors.

**Why it happens:** Anthropic API doesn't support direct browser calls for security reasons.

**How to avoid:** Always use a server-side proxy (Next.js Route Handler) between browser and Anthropic API.

**Warning signs:** Network requests to api.anthropic.com failing with CORS policy errors.

### Pitfall 3: Missing Tool Configuration Header

**What goes wrong:** Web search tool doesn't work or returns errors about unrecognized tool.

**Why it happens:** Anthropic requires the `anthropic-beta: tools-2025-09-04` header for tools functionality.

**How to avoid:** Always include the beta header when using tools in Anthropic API calls.

**Warning signs:** API errors mentioning tools or beta features.

### Pitfall 4: Over-Streaming UI Updates

**What goes wrong:** UI becomes unresponsive or re-renders excessively during streaming responses.

**Why it happens:** Updating React state on every character/stream event causes unnecessary re-renders.

**How to avoid:** Debounce updates or batch state updates for better performance.

**Warning signs:** UI lagging or browser freezing during long API responses.

### Pitfall 5: Missing Error Boundaries

**What goes wrong:** Single API error crashes entire page, losing user's progress.

**Why it happens:** React doesn't catch errors in async operations by default.

**How to avoid:** Use try-catch in async functions, display error messages to users, implement retry logic.

**Warning signs:** White screen of death when API calls fail.

## Code Examples

Verified patterns from official sources:

### Anthropic API Call with Web Search Tool

```typescript
// Source: Anthropic Tools API documentation (2025)
// Requires: @anthropic-ai/sdk
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function researchWithWebSearch(topic: string, audience: string) {
  const webSearchTool = {
    type: 'web_search',
    display_name: 'web_search',
  };

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Research the following topic for card news content:

Topic: ${topic}
Target Audience: ${audience}

Instructions:
1. Search for at least 3 credible sources
2. Find recent statistics, examples, or case studies
3. Include specific URLs for citation
4. Summarize key findings in bullet points`
    }],
    tools: [webSearchTool],
  }, {
    headers: {
      'anthropic-beta': 'tools-2025-09-04'
    }
  });

  return response;
}
```

### Generate Card News Copy Structure

```typescript
// Source: Custom prompt engineering pattern for card news generation
interface CardNewsStructure {
  cards: {
    type: 'cover' | 'body' | 'cta';
    headline: string;
    subtext: string;
    order: number;
  }[];
  researchSources: {
    title: string;
    url: string;
    summary: string;
  }[];
}

async function generateCardNewsCopy(
  topic: string,
  audience: string,
  researchContext: string
): Promise<CardNewsStructure> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Based on the following research, generate card news copy:

Topic: ${topic}
Target Audience: ${audience}

Research Context:
${researchContext}

Generate card news in the following structure:
1. Cover card (hook): 1 compelling headline + curiosity-inducing subtext
2. Body cards (4-6 cards): Each with 1 headline + 2-3 sentences subtext
3. CTA card: Action-oriented headline + clear call-to-action subtext

Format as JSON:
{
  "cards": [
    {
      "type": "cover",
      "headline": "...",
      "subtext": "...",
      "order": 1
    }
  ],
  "researchSources": [...]
}`
    }],
  });

  return JSON.parse(response.content[0].text);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server Components for everything | Client Components for interactivity | Next.js 13+ (2023) | Better UX for interactive UI forms |
| No tool support | Official tools API | Anthropic beta (2025) | Enables web search and other tools natively |
| Hand-rolled UI components | shadcn/ui (Radix primitives) | 2023-2024 | Better accessibility, less code to maintain |
| NEXT_PUBLIC secrets everywhere | Server-side only env vars | Next.js best practices | Improved security posture |

**Deprecated/outdated:**
- **Next.js API Routes (pages/api)**: Use Route Handlers (app/api) in Next.js 13+
- **class names string concatenation**: Use clsx + tailwind-merge pattern
- **useEffect for all fetching**: Consider SWR/React Query for production caching
- **Client-side API key storage**: Always use server-side Route Handlers

## Open Questions

1. **API Key Storage in Production**
   - What we know: Use environment variables without NEXT_PUBLIC_ prefix for server-side Route Handlers
   - What's unclear: Deployment platform specifics (Vercel, Netlify) for environment variable configuration
   - Recommendation: Document deployment-specific environment variable setup in Phase 5 deployment documentation

2. **Streaming Response UI Implementation**
   - What we know: Anthropic SDK supports streaming, but requires careful state management
   - What's unclear: Best UI pattern for displaying streaming research results vs final structured copy
   - Recommendation: Implement basic streaming for research phase, use structured JSON response for copy generation in Phase 1

3. **Cost Estimation for Web Search Tool**
   - What we know: Claude 3.5 Sonnet is ~$0.022-0.04 per message, web search tool has additional costs (~$10 per 1,000 searches)
   - What's unclear: Total cost per card news generation cycle
   - Recommendation: Track API usage and costs during development, add cost display in UI for user awareness

## Validation Architecture

> Skip this section — workflow.nyquist_validation is false in .planning/config.json

## Sources

### Primary (HIGH confidence)

- [Anthropic Tools API Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tools) - Tools API, web_search tool configuration, beta headers
- [@anthropic-ai/sdk npm package](https://www.npmjs.com/package/@anthropic-ai/sdk) - Official SDK API, streaming support, TypeScript types
- [Next.js 15 Route Handlers Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - Route Handler patterns, server-side vs client-side
- [shadcn/ui Documentation](https://ui.shadcn.com/docs) - Accordion, Card, Badge, Button, Input, Textarea components

### Secondary (MEDIUM confidence)

- [Next.js Client Components Data Fetching Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/client-components) - useEffect patterns, SWR integration
- [Next.js Environment Variables Documentation](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables) - NEXT_PUBLIC_ prefix behavior, server-side env vars
- [Claude API Pricing (2025)](https://www.anthropic.com/pricing) - Cost per message, web search pricing
- [shadcn/ui Accordion Component Examples](https://ui.shadcn.com/docs/components/accordion) - Accordion patterns, accessibility features
- [shadcn/ui Card Component Examples](https://ui.shadcn.com/docs/components/card) - Card layout patterns, list view implementation

### Tertiary (LOW confidence)

- [AI Card News Generation Best Practices](https://www.anthropic.com/research/ai-news-generation) - General AI copywriting patterns (verified limited domain-specific content)
- [Card News UI Design Patterns](https://ui.shadcn.com/docs/components/card) - Design principles for card-based layouts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified via npm and official documentation
- Architecture: HIGH - Patterns from official Next.js 15 and Anthropic SDK documentation
- Pitfalls: HIGH - Security patterns from Next.js official docs, verified CORS limitations
- UI components: HIGH - All shadcn/ui components pre-installed and verified

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days - stable API patterns, but pricing/models may change)

---

**Research complete. Ready for phase planning.**
