# Codebase Structure

**Analysis Date:** 2026-03-04

## Directory Layout

```
cardNews/
├── app/                                    # Next.js app directory (routes & server logic)
│   ├── api/
│   │   └── anthropic/
│   │       └── route.ts                    # Server: Stage 1 (research + copy generation)
│   ├── card-news/
│   │   └── page.tsx                        # Main pipeline page (client: stages 2–4)
│   ├── page.tsx                            # Home landing page
│   ├── layout.tsx                          # Root layout with metadata
│   └── globals.css                         # Tailwind global styles
│
├── components/                             # React components
│   ├── card-news/                          # Feature components (card news pipeline)
│   │   ├── ApiKeyInput.tsx                 # Input: Claude API key with visibility toggle
│   │   ├── ResearchForm.tsx                # Input: Topic + audience, trigger Stage 1
│   │   ├── ResearchResults.tsx             # Display: Research sources from Stage 1
│   │   ├── CardNewsList.tsx                # Display: Generated cards (editable inline)
│   │   ├── quality/
│   │   │   ├── EvaluationSystem.tsx        # Hook: Quality loop state management
│   │   │   ├── QualityLoop.tsx             # Component: Stage 2 (quality evaluation)
│   │   │   └── ScoreDisplay.tsx            # Display: Evaluation history & scores
│   │   └── structure/
│   │       ├── StructureSystem.tsx         # Hook: Structure review state management
│   │       ├── StructureReview.tsx         # Component: Stage 3 (structure analysis)
│   │       └── ProposalList.tsx            # Display: Proposals with accept/reject UI
│   │
│   ├── lib/
│   │   └── types.ts                        # Centralized type definitions (CardNewsItem, etc.)
│   │
│   └── ui/                                 # shadcn/ui components (presentational)
│       ├── button.tsx, input.tsx, card.tsx, etc. (20+ UI primitives)
│       └── toaster.tsx                     # Toast notification container
│
├── hooks/
│   └── use-toast.ts                        # Toast hook for notifications
│
├── lib/
│   └── utils.ts                            # Utility functions (cn() for className merging)
│
├── .planning/                              # GSD planning directory
│   └── codebase/                           # Codebase analysis documents
│
├── public/                                 # Static assets (if any)
│
├── package.json                            # Dependencies: Next.js, React, Anthropic SDK, shadcn/ui
├── tsconfig.json                           # TypeScript config with @/* path alias
├── tailwind.config.ts                      # Tailwind CSS configuration
├── next.config.js                          # Next.js configuration
├── postcss.config.js                       # PostCSS configuration
└── .gitignore                              # Version control exclusions
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router routes and server-side logic
- Contains: Page components (`.tsx` files) and API route handlers (`route.ts`)
- Key files: `card-news/page.tsx` (main page), `api/anthropic/route.ts` (Stage 1 server)

**`components/card-news/`:**
- Purpose: Feature-specific React components for the card news pipeline
- Contains: Input components (forms), display components (results, cards, proposals), state hooks
- Naming: Business-focused names (`ResearchForm`, `QualityLoop`) grouped by pipeline stage

**`components/card-news/quality/`:**
- Purpose: Stage 2 quality evaluation
- Contains: `EvaluationSystem.tsx` (pure state hook), `QualityLoop.tsx` (UI component), `ScoreDisplay.tsx` (display only)

**`components/card-news/structure/`:**
- Purpose: Stage 3 structure review and proposals
- Contains: `StructureSystem.tsx` (pure state hook), `StructureReview.tsx` (UI component), `ProposalList.tsx` (display + interaction)

**`components/lib/`:**
- Purpose: Shared type definitions for the entire application
- Contains: Centralized interfaces (CardNewsItem, CardNewsResponse, etc.)
- Key file: `types.ts` (single source of truth for domain types)

**`components/ui/`:**
- Purpose: Reusable shadcn/ui presentational components
- Contains: Unstyled, accessible UI primitives (Button, Input, Card, Textarea, Badge, etc.)
- Dependency: All feature components import from here

**`hooks/`:**
- Purpose: Custom React hooks for cross-cutting concerns
- Contains: `use-toast.ts` (notification system)

**`lib/`:**
- Purpose: Utility functions and helpers
- Contains: `utils.ts` with `cn()` for className merging

## Key File Locations

**Entry Points:**

| File | Route | Purpose |
|------|-------|---------|
| `app/page.tsx` | `/` | Landing page with link to card news pipeline |
| `app/card-news/page.tsx` | `/card-news` | Main pipeline page; orchestrates all stages |
| `app/api/anthropic/route.ts` | `POST /api/anthropic` | Server: Stage 1 research + copy generation |

**Configuration:**

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript config; defines `@/*` → `./` path alias |
| `package.json` | Dependencies (Next.js, React, Anthropic SDK, shadcn/ui, etc.) |
| `tailwind.config.ts` | Tailwind CSS theming and plugin config |
| `next.config.js` | Next.js runtime config |
| `postcss.config.js` | PostCSS pipeline (Tailwind) |

**Core Logic:**

| File | Layer | Purpose |
|------|-------|---------|
| `components/lib/types.ts` | Types | Centralized interfaces (CardNewsItem, CardNewsResponse, GenerateRequest, etc.) |
| `components/card-news/quality/EvaluationSystem.tsx` | State | Quality loop state hook; tracks loop history, scores, phase |
| `components/card-news/structure/StructureSystem.tsx` | State | Structure review state hook; manages proposals and user selections |
| `app/api/anthropic/route.ts` | API | Server-side Anthropic calls (web search + copy generation) |

**UI Components (Stages):**

| File | Stage | Purpose |
|------|-------|---------|
| `components/card-news/ResearchForm.tsx` | Input (pre-Stage 1) | Collects topic/audience, triggers Stage 1 |
| `components/card-news/ResearchResults.tsx` | Display (post-Stage 1) | Shows research sources |
| `components/card-news/CardNewsList.tsx` | Display (post-Stage 1) | Displays generated cards (editable inline) |
| `components/card-news/quality/QualityLoop.tsx` | Stage 2 | Quality evaluation loop; parallel agent scoring + recursive refinement |
| `components/card-news/structure/StructureReview.tsx` | Stage 3 | Structure analysis; parallel agent proposals + user selection |
| `components/card-news/structure/ProposalList.tsx` | Display (Stage 3) | Renders proposals with accept/reject checkboxes |

## Naming Conventions

**Files:**

- **Feature components:** CamelCase, descriptive name (e.g., `ResearchForm.tsx`, `QualityLoop.tsx`, `CardNewsList.tsx`)
- **System/hook files:** Suffixed with `System.tsx` for state hooks (e.g., `EvaluationSystem.tsx`, `StructureSystem.tsx`)
- **UI component files:** Component name matches PascalCase (e.g., `Button.tsx`, `Card.tsx`)
- **API routes:** `route.ts` by convention in Next.js (no special name)
- **Type files:** `types.ts` for centralized definitions

**Directories:**

- **Feature directories:** Lowercase, functional grouping (e.g., `card-news/`, `quality/`, `structure/`)
- **UI directory:** `ui/` for all presentational components
- **Hook directory:** `hooks/` for reusable hooks
- **Lib directory:** `lib/` for utilities and shared logic

**TypeScript:**

- **Interfaces:** PascalCase (e.g., `CardNewsItem`, `EvaluationState`, `StructureProposal`)
- **Type aliases:** PascalCase (e.g., `AgentRole`, `ProposalType`)
- **Functions:** camelCase (e.g., `calcAverageScore`, `applyProposals`, `buildEvaluationId`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `PASS_THRESHOLD`, `MAX_LOOPS`)
- **React hooks:** camelCase, prefixed with `use` (e.g., `useEvaluationSystem`, `useStructureSystem`)

**Exports:**

- **Feature components:** Named exports (e.g., `export function ResearchForm()`)
- **Hooks:** Named exports returning object with state + callbacks (e.g., `export function useEvaluationSystem() { return { state, startEvaluation, ... } }`)
- **Types:** Named exports (e.g., `export interface CardNewsItem`)

## Where to Add New Code

**New Feature (e.g., Stage 4: Image Output):**

1. Primary code: `components/card-news/image/` (new subdirectory)
   - `ImageSystem.tsx` (state hook for image rendering state)
   - `ImageOutput.tsx` (UI component for image generation)
   - `CanvasPreview.tsx` (display component for preview)

2. API route (if server-side needed): `app/api/image/route.ts`

3. Types (if new domain types): Add to `components/lib/types.ts`

4. Integration: Import and add to `app/card-news/page.tsx` after approval cards

**New Evaluation Agent (e.g., SEO scoring in quality loop):**

1. Update `components/card-news/quality/QualityLoop.tsx`:
   - Add prompt builder function (e.g., `buildSeoAgentPrompt()`)
   - Include in `Promise.all()` parallel calls
   - Add agent to `evaluations` array with new `agentType`

2. Update `components/card-news/quality/EvaluationSystem.tsx`:
   - Update `AgentRole` type to include new role (e.g., `'seo'`)

3. Update `ScoreDisplay.tsx` if needed to handle new agent type

**New Structure Proposal Type (e.g., "highlight" text):**

1. Update `components/card-news/structure/StructureSystem.tsx`:
   - Update `ProposalType` to include `'highlight'`
   - Add fields to `StructureProposal` interface for highlight metadata

2. Update `StructureReview.tsx`:
   - Add validation logic to `validateRawProposal()` for new type
   - Update prompt builders if new agent logic needed

3. Update `applyProposals()` in StructureSystem.tsx with step for applying highlights (after edit/delete/add/reorder)

**Shared Utility:**

- Location: `lib/utils.ts` (generic utilities) or create `lib/cardNews.ts` for domain-specific helpers
- Pattern: Export pure functions (no component logic)
- Example: Parsing JSON, formatting strings, calculation helpers

**Error Handling / Logging:**

- Location: Create `lib/logger.ts` if centralized logging needed
- Current: `console.error()` and `setError()` callbacks in component state
- Proposed: Wrap API calls in error boundary, add retry logic if needed

## Special Directories

**`.planning/`:**
- Purpose: GSD (Guided System Development) planning and analysis
- Generated: Codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Committed: Yes (part of repository)

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes (created by `npm install`)
- Committed: No (listed in .gitignore)

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (created by `npm run build` or dev server)
- Committed: No (listed in .gitignore)

**`.git/`:**
- Purpose: Git version control
- Generated: Yes (created by `git init`)
- Committed: Yes (repository metadata)

---

*Structure analysis: 2026-03-04*
