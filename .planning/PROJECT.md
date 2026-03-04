# Card News Generator

## What This Is

AI-powered card news generation platform. Users input topic and audience, and AI generates research-backed structured content through a four-stage pipeline: research generation, quality evaluation, structure review, and image output.

## Core Value

Users can create professional card news with minimal effort while maintaining content quality and engagement.

## Requirements

### Validated

- ✓ Research & Copy Generation — existing
- ✓ Quality Loop (hooking/copy agent evaluation) — existing
- ✓ Structure Review (story-flow/retention analysis) — existing

### Active

- [ ] Image Output (Stage 4) — Generate downloadable 1080×1350px card images
- [ ] Batch Export — Export all cards as single PDF or ZIP

### Out of Scope

- User authentication — Personal tool, no multi-user needed
- Cloud image storage — Client-side generation sufficient
- Real-time collaboration — Single-user workflow

## Context

Built on Next.js 15 with React 19, using shadcn/ui components and Tailwind CSS. Anthropic Claude API powers all AI stages (server-side for research, client-side for quality/structure evaluation). Existing code follows clean architecture with separated state management.

Stage 4 is partially prepared (html2canvas and jszip dependencies installed) but not implemented.

## Constraints

- **Tech**: Next.js, React, TypeScript — existing stack must be maintained
- **API**: Anthropic Claude — required for AI stages
- **Output**: 1080×1350px PNG per card — standard Instagram card format

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Client-side API calls for quality/structure | Reduces server load, enables real-time feedback | ✓ Good |
| Four-stage pipeline | Separates concerns, enables iterative refinement | ✓ Good |

---
*Last updated: 2026-03-04 after codebase analysis*
