# Coding Conventions

**Analysis Date:** 2026-03-04

## Naming Patterns

**Files:**
- PascalCase for React components: `QualityLoop.tsx`, `EvaluationSystem.tsx`, `CardNewsList.tsx`
- camelCase for utility files and hooks: `utils.ts`
- kebab-case for route segments: `api/anthropic/route.ts`, `card-news/page.tsx`
- `*System.tsx` suffix for hook implementations: `EvaluationSystem.tsx`, `StructureSystem.tsx`
- `types.ts` for centralized type definitions: `components/lib/types.ts`

**Functions:**
- camelCase for all functions: `handleSubmit()`, `buildHookingAgentPrompt()`, `parseJsonFromText()`, `calcAverageScore()`
- Descriptive verb-first naming: `startEvaluation()`, `recordEvaluationResult()`, `applyProposals()`, `toggleAccept()`
- Utility factory functions prefixed with `create`: `createInitialEvaluationState()`, `createInitialStructureState()`
- Prompt builders prefixed with `build`: `buildHookingAgentPrompt()`, `buildCopyAgentPrompt()`, `buildRewritePrompt()`, `buildEvaluationId()`

**Variables:**
- camelCase for all variable names: `apiKey`, `cardNewsData`, `isLoading`, `approvedCards`, `acceptedIds`
- Boolean variables prefixed with `is`: `isLoading`, `isEvaluating`, `isApproved`, `isLatest`
- Collections use plural nouns: `cards`, `proposals`, `evaluations`, `sources`
- Destructured function parameters: `{ topic, audience, apiKey } = body`, `{ phase, loopCount, maxLoops }`

**Types:**
- PascalCase for interfaces and types: `CardNewsItem`, `CardNewsResponse`, `GenerateRequest`, `ResearchSource`
- Suffix `-Props` for React component prop interfaces: `QualityLoopProps`, `ResearchFormProps`, `ScoreBadgeProps`
- Suffix `-State` for state type interfaces: `EvaluationState`, `StructureState`
- Union types as string literals: `type AgentRole = 'hooking' | 'copy'`, `type ProposalType = 'reorder' | 'add' | 'delete' | 'edit'`

## Code Style

**Formatting:**
- Automatic linting via Next.js built-in ESLint config
- No explicit `.eslintrc` or `.prettierrc` file (uses Next.js defaults)
- Indentation: 2 spaces
- Single quotes preferred in JSX templates (double quotes in some legacy code like `button.tsx`)
- Line length: Not enforced but ~80-100 chars observed

**Linting:**
- ESLint via `npm run lint` (Next.js ESLint config)
- No strict type checking enforcement at lint level (TypeScript handles types)
- React hooks exhaustive deps checked with comments: `// eslint-disable-next-line react-hooks/exhaustive-deps`

**Imports:**
- Always include file extensions in relative imports: `import { Button } from '@/components/ui/button'`
- Group imports: external libraries first, then types, then local modules
- Named imports preferred: `import { useState, useCallback } from 'react'`
- Type imports explicitly marked: `import type { CardNewsItem } from '@/components/lib/types'`

## Import Organization

**Order:**
1. External library imports: `react`, `next`, `@radix-ui/*`, `lucide-react`
2. Type imports from external libraries: `import type { VariantProps }`
3. Component imports from `@/components/ui/` (UI library)
4. Type imports from `@/components/lib/types`
5. Feature-specific imports: `import { QualityLoop } from '@/components/card-news/quality/QualityLoop'`
6. Hook imports: `import { useEvaluationSystem } from './EvaluationSystem'`

**Path Aliases:**
- `@/*` resolves to project root (`cardNews/cardNews/`)
- All imports use absolute `@/` paths, never relative paths like `../../`
- Example: `import { cn } from '@/lib/utils'`, `import { Button } from '@/components/ui/button'`

## Error Handling

**Patterns:**
- Try-catch with type narrowing: `catch (err) { err instanceof Error ? err.message : 'fallback message' }`
- Server-side validation before processing: Check required fields with `.trim()` tests before API calls (`route.ts` lines 14-33)
- Return NextResponse with status codes: `NextResponse.json({ error: '...' }, { status: 400 })`
- Console.error for server-side logging: `console.error('Failed to parse JSON response:', responseText)`
- UI error state management: `const [error, setError] = useState<string | null>(null)` then display in error boundaries
- JSON parse with fallback: Use `parseJsonFromText()` with regex extraction and markdown code fence handling (QualityLoop.tsx lines 129-134)
- Graceful API error responses: Catch all errors in try block and return 500 with user-friendly message

## Logging

**Framework:** `console` object

**Patterns:**
- Server-side: `console.error()` only, no `console.log()` in production
- Client-side: `console.error()` for failures, no verbose logging
- Log context: Include what operation failed: `console.error('Failed to parse JSON response:', responseText)`
- No performance metrics or debug logs in current codebase

## Comments

**When to Comment:**
- Comments mark section dividers with decorative dashes: `// ─── Types ───`, `// ─── Constants ───`, `// ─── Utilities ───`
- Inline comments explain "why" not "what": `// Enable web_search via beta header, no tools array needed for built-in tools`
- Comments on complex algorithm steps: `// Step 1: Build a Set...`, `// Step 2: Apply 'edit' proposals...` (StructureSystem.tsx)
- No JSDoc/TSDoc comments on exported functions in systems files (comments are minimal)

**JSDoc/TSDoc:**
- Used on component prop interfaces: `/** Cards to evaluate */`, `/** Called when cards are approved */`
- Used on exported helper functions: `/** Research source from web search results */` (types.ts)
- Used on React component props with explanations of behavior
- Not consistently applied across all code

## Function Design

**Size:** Functions stay focused:
- Prompt builders: ~15-20 lines
- State management callbacks: ~5-15 lines
- Render components: ~40-100 lines
- API handlers: ~50-100 lines
- Utility functions: ~5-10 lines

**Parameters:**
- Destructured props in component definitions: `function QualityLoop({ cards, apiKey, onApproved, onMaxLoopsReached }: QualityLoopProps)`
- Destructured from request/response: `const { topic, audience, apiKey } = body`
- Named parameters preferred, avoid long positional args

**Return Values:**
- Components return JSX.Element implicitly
- Hooks return object with named properties: `return { state, startEvaluation, recordEvaluationResult, ... }`
- Pure utility functions return typed values explicitly
- Callbacks return void or Promise<void>

## Module Design

**Exports:**
- Named exports for all functions and types: `export function useEvaluationSystem()`, `export interface CardNewsItem`
- Default export for page components: `export default function CardNewsPage()`
- Barrel files not used in current structure
- System components export both types and the hook: `export type AgentRole`, `export function useEvaluationSystem()`

**Barrel Files:**
- Not used in codebase
- Individual file imports used instead: `import { Button } from '@/components/ui/button'`

## Separation of Concerns

**State Logic Separation:**
- Pure state management in `*System.tsx` files with no JSX
- UI consumption in corresponding component files
- Example: `EvaluationSystem.tsx` (logic) → `QualityLoop.tsx` (UI), `StructureSystem.tsx` (logic) → `StructureReview.tsx` (UI)
- Constants exported alongside logic: `export const PASS_THRESHOLD = 75`, `export const MAX_LOOPS = 3`

**Component Hierarchy:**
- Page components orchestrate sub-components: `app/card-news/page.tsx`
- Feature components self-contained with local state
- Shared UI components in `components/ui/` (from shadcn)
- Feature components in `components/card-news/` with subdirectories for stages

**Async Patterns:**
- Client components use `fetch()` directly with headers: `import type` + `'use client'` directive
- Server components use SDK: `new Anthropic({ apiKey })`
- Prompt-building functions are pure and synchronous
- API calls wrapped in async callback functions with error handling

---

*Convention analysis: 2026-03-04*
