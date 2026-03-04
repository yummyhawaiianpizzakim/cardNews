---
phase: 04-design-output
plan: 01
subsystem: design-extraction
tags: [types, vision-api, image-upload]
dependency_graph:
  requires:
    - components/lib/types.ts
  provides:
    - components/lib/types.ts (DesignToken)
    - components/card-news/design/ImageUpload.tsx
    - components/card-news/design/DesignTokenExtractor.tsx
  affects: []
tech_stack:
  added: []
  patterns:
    - "Type-safe design token system"
    - "Claude Vision API integration"
    - "Client-side image processing (base64)"
key_files:
  created:
    - components/card-news/design/ImageUpload.tsx
    - components/card-news/design/DesignTokenExtractor.tsx
  modified:
    - components/lib/types.ts
decisions: []
metrics:
  duration: 90s
  completed: 2026-03-04
---

# Phase 4 Plan 1: Design Token Type and Image Upload Summary

디자인 토큰 타입 정의와 레퍼런스 이미지 업로드 UI를 생성하고 Claude Vision API로 이미지 분석 기능을 구현하여 디자인 시스템의 기초를 마련했습니다.

## Implementation Summary

### Task 1: DesignToken Type Definition

Added type-safe design token system to `components/lib/types.ts`:

- **DesignToken interface**: Defines extracted design properties (colors, font, layout, mood, background)
- **getDefaultDesignToken()**: Provides fallback tokens when analysis fails
- **getCardStyle()**: Converts tokens to CSS variables for application to cards

**Commit:** `4b07b8f`

### Task 2: ImageUpload Component

Created `components/card-news/design/ImageUpload.tsx` with:

- File upload with JPG/PNG type validation (DSGN-01)
- Mandatory image preview after upload
- Image replace functionality
- Status messages ("분석 중...", error messages)
- Korean UI text following project conventions

**Commit:** `e020b89`

### Task 3: DesignTokenExtractor Component

Created `components/card-news/design/DesignTokenExtractor.tsx` with:

- **analyzeReferenceImage()**: Calls Claude Vision API using `claude-3-5-sonnet-20241022`
- Extracts: primaryColor, secondaryColor, accentColor, fontCategory, layoutPattern, mood, backgroundColor
- JSON parsing with fallback to default tokens (following QualityLoop.tsx pattern)
- **DesignTokenExtractor** hook component for React integration

**Commit:** `9e40730`

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

## Tech Stack

- **TypeScript**: Type-safe design token definitions
- **@anthropic-ai/sdk**: Claude Vision API integration
- **shadcn/ui**: Card, Button, Badge components
- **React Hooks**: useState, useRef, useCallback

## Files Created/Modified

### Created
- `components/card-news/design/ImageUpload.tsx` (132 lines)
- `components/card-news/design/DesignTokenExtractor.tsx` (116 lines)

### Modified
- `components/lib/types.ts` (+48 lines)

## Requirements Satisfied

- **DSGN-01**: JPG/PNG only upload, mandatory preview, image replace
- **DSGN-02**: Claude Vision API integration for image analysis
- **DSGN-03**: Extract primary/secondary colors, font style, layout pattern, mood

## Integration Points

The components created in this plan will be integrated in:
- 04-02: DesignTokenSystem hook for managing tokens state
- 04-03: CardRenderer for applying tokens to card rendering
- 04-04: DesignOrchestration for end-to-end flow

## Key Decisions

- **Vision Model**: Used `claude-3-5-sonnet-20241022` per STATE.md decision
- **Fallback Strategy**: Return default tokens on any error to prevent blocking
- **JSON Parsing**: Use regex pattern from QualityLoop.tsx for robust LLM response parsing
- **CSS Variables**: Design tokens map to CSS variables via getCardStyle()

## Testing Notes

- TypeScript compilation passes for new files (pre-existing project errors unrelated)
- All components use 'use client' directive as required
- Korean UI text follows project convention
- File type validation restricts to JPG/PNG only

## Self-Check: PASSED

- All files created: components/lib/types.ts, ImageUpload.tsx, DesignTokenExtractor.tsx
- All commits verified: 4b07b8f, e020b89, 9e40730
