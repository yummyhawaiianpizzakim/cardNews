# External Integrations

**Analysis Date:** 2025-03-04

## APIs & External Services

**Anthropic Claude API:**
- Service: Anthropic Claude API
- What it's used for: Multi-stage AI-powered card news generation pipeline with web search, content generation, quality evaluation, and structural analysis
  - SDK/Client: @anthropic-ai/sdk (v0.33.0)
  - Auth: API key provided by user at runtime (no server-side key stored)

**Web Search Tool (via Claude API):**
- Service: Built-in Anthropic web search tool
- What it's used for: Research assistant performs web search to gather credible sources and statistics
  - Implementation: Server-side only in `app/api/anthropic/route.ts` with `anthropic-beta: tools-2025-09-04` header
  - Model: `claude-3-5-sonnet-20241022` with web search capability
  - Purpose: Generates research context for copy generation stage

## Data Flow & API Usage

**Server-Side Anthropic Calls (in `app/api/anthropic/route.ts`):**
- **Stage 1: Research** — POST request to Anthropic API with `claude-3-5-sonnet-20241022`, max_tokens 4096
  - Inputs: Topic, target audience
  - Outputs: Research context with sources and statistics
  - Uses web search tool via beta header

- **Stage 2: Copy Generation** — POST request to Anthropic API with `claude-3-5-sonnet-20241022`, max_tokens 4096
  - Inputs: Topic, audience, research context
  - Outputs: JSON with `CardNewsResponse` (cards array, research sources array)
  - No tools required

**Client-Side Direct Anthropic Calls (via browser, no server relay):**
- **Quality Loop Evaluation** (in `components/card-news/quality/QualityLoop.tsx`):
  - Model: `claude-sonnet-4-20250514`
  - Max tokens: 1024
  - Two agents run in parallel:
    - **Hooking Agent**: Scores hook/engagement quality (0–100)
    - **Copy Agent**: Scores copy quality/consistency (0–100)
  - Pass threshold: 75 average score
  - Max rewrite loops: 3 iterations
  - Header: `anthropic-dangerous-direct-browser-access: true` enables browser access

- **Structure Review** (in `components/card-news/structure/StructureReview.tsx`):
  - Model: `claude-sonnet-4-20250514`
  - Max tokens: 1024
  - Two agents run in parallel:
    - **Story-Flow Agent**: Proposes reorder/add/delete/edit changes for narrative flow
    - **Retention Agent**: Proposes changes to improve information retention
  - Returns proposals for user approval before applying

## Authentication & Identity

**Auth Provider:**
- Custom: User-provided API key
- Implementation: API key collected in `ApiKeyInput.tsx` component and passed to each API call
- No session management or backend authentication required
- User is responsible for keeping their API key secure

## Data Storage

**Databases:**
- None — Application is stateless
- All data (cards, research, scores) exists only in browser memory during session

**File Storage:**
- Local filesystem only via html2canvas + download (Stage 4, not yet implemented)
- No cloud storage integration

**Caching:**
- Browser memory via React state in `app/card-news/page.tsx`
- No HTTP caching headers or Redis-style caching

## Monitoring & Observability

**Error Tracking:**
- None — Errors logged to browser console and displayed in UI toast messages

**Logs:**
- Browser console only (`console.error()` statements in API route)
- No external logging service

## CI/CD & Deployment

**Hosting:**
- Not specified — Any Node.js hosting compatible with Next.js

**CI Pipeline:**
- None detected in codebase

## Environment Configuration

**Required Environment Variables:**
- **None for basic local development** — API key provided by user at runtime
- Optional for production deployment:
  - Node environment (`NODE_ENV`)
  - Base URL for CORS if deployed on different domain

**API Key Management:**
- User enters Anthropic API key directly in UI
- Key is stored in React state (`useState`) and passed in request headers
- Key is **never stored** in backend, .env files, or persistent storage
- Each new session requires re-entering the API key

**Secrets Location:**
- User credentials: Client-side input (transient)
- No stored secrets in repository

## Request/Response Patterns

**Server API Route (`/api/anthropic`):**
```
POST /api/anthropic
Content-Type: application/json

{
  "topic": "string",
  "audience": "string",
  "apiKey": "string"  // User's Anthropic API key
}

Response:
{
  "cards": [
    { "type": "cover|body|cta", "headline": "string", "subtext": "string", "order": 0 }
  ],
  "researchSources": [
    { "title": "string", "url": "string", "summary": "string" }
  ]
}
```

**Client-Side Direct API Calls:**
```
POST https://api.anthropic.com/v1/messages
Headers:
  - x-api-key: [user's API key]
  - anthropic-dangerous-direct-browser-access: true
  - anthropic-version: 2023-06-01

Body:
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "messages": [{ "role": "user", "content": "[prompt]" }]
}

Response:
{
  "content": [{ "type": "text", "text": "[JSON response]" }]
}
```

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2025-03-04*
