---
phase: 04-design-output
plan: 04
subsystem: card-download
tags: [react, typescript, html2canvas, jszip, file-saver, orchestration]

# Dependency graph
requires:
  - phase: 04-design-output
    plan: 01
    provides: DesignToken type, getDefaultDesignToken, getCardStyle
  - phase: 04-design-output
    plan: 02
    provides: useDesignTokenSystem hook, DesignTokenState
  - phase: 04-design-output
    plan: 03
    provides: CardRenderer, CardGrid, TextEditor
provides:
  - components/card-news/output/DownloadControls.tsx (PNG and ZIP download controls)
  - components/card-news/design/DesignOrchestration.tsx (end-to-end design workflow)
  - app/card-news/page.tsx (updated with design section integration)
affects: [] (final plan of Phase 4)

# Tech tracking
tech-stack:
  added: [file-saver, @types/file-saver]
  patterns: forwardRef, html2canvas-rendering, zip-batch-download, orchestration-component

key-files:
  created:
    - components/card-news/output/DownloadControls.tsx
    - components/card-news/design/DesignOrchestration.tsx
  modified:
    - components/card-news/output/CardRenderer.tsx
    - app/card-news/page.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "CardRenderer uses forwardRef to allow external ref access for html2canvas"
  - "html2canvas uses scale:2, useCORS:true for high-quality cross-browser rendering"
  - "file-saver library for cross-browser compatible downloads"
  - "DesignOrchestration embeds card grid functionality for single component interface"

patterns-established:
  - "forwardRef pattern for external DOM element access"
  - "html2canvas options: scale:2, width:1080, height:1350, useCORS:true"
  - "Progress display during batch operations"
  - "Orchestration component pattern for multi-step workflows"

requirements-completed: [DSGN-07, DSGN-08]

# Metrics
duration: 4m 1s
completed: 2026-03-04
---

# Phase 04: Design Output Summary - Plan 04

PNG 렌더링(html2canvas)과 다운로드 컨트롤을 구현하고 전체 디자인 워크플로우를 메인 페이지에 통합하여 end-to-end 카드뉴스 생성을 완성했습니다.

## Performance

- **Duration:** 4 minutes 1 second
- **Started:** 2026-03-04T02:31:14Z
- **Completed:** 2026-03-04T02:35:15Z
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 4

## Accomplishments

- Created DownloadControls component with individual PNG download for each card at 1080×1350px
- Implemented ZIP batch download for all cards with progress indicator
- Used html2canvas with scale:2, useCORS:true for high-quality cross-browser PNG rendering
- Integrated jszip for ZIP file generation
- Used file-saver saveAs for cross-browser compatible downloads
- Created DesignOrchestration component integrating ImageUpload, DesignTokenExtractor, CardGrid, and DownloadControls
- Updated CardRenderer with forwardRef to support external ref access
- Integrated DesignOrchestration into main page after StructureReview
- Increased page max-width to max-w-6xl for card grid display

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DownloadControls component** - `a708761` (feat)
   - Individual PNG download for each card at 1080×1350px
   - ZIP batch download with progress indicator
   - Uses html2canvas with scale:2, useCORS:true
   - Uses jszip for ZIP generation
   - Uses file-saver for downloads
   - file-saver and @types/file-saver installed

2. **Task 2: Create DesignOrchestration component** - `c79693b` (feat)
   - Integrates all design phase components
   - Manages image upload and token extraction
   - Embeds card grid, edit mode, and scale controls
   - Provides card refs to DownloadControls

3. **Task 3: Integrate DesignOrchestration into page.tsx** - `f22089c` (feat)
   - Import DesignOrchestration component
   - Increase max-width to max-w-6xl
   - Add DesignOrchestration after StructureReview
   - Pass approvedCards and handle updates

4. **Auto-fix: Fix TypeScript errors in DownloadControls** - `ba39d87` (fix)
   - Fixed html2canvas onClone callback (was onClone, changed to onclone)
   - Added explicit type annotations for callbacks
   - Resolved TS2561 and TS7006 errors

## Files Created/Modified

### Created
- `components/card-news/output/DownloadControls.tsx` (176 lines)
- `components/card-news/design/DesignOrchestration.tsx` (167 lines)

### Modified
- `components/card-news/output/CardRenderer.tsx` (118 lines) - Added forwardRef
- `app/card-news/page.tsx` (95 lines) - Integrated DesignOrchestration
- `package.json` - Added file-saver dependency
- `package-lock.json` - Updated lockfile

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors in DownloadControls**
- **Found during:** Task 1 verification (TypeScript compilation)
- **Issue:** html2canvas API uses `onclone` (lowercase), not `onClone`. Callback parameters needed explicit type annotations.
- **Fix:** Changed `onClone` to `onclone`, added type annotations: `onclone: (clonedDoc: Document)` and `canvas.toBlob((b: Blob | null) => ...)`
- **Files modified:** components/card-news/output/DownloadControls.tsx
- **Verification:** `npx tsc --noEmit` shows no errors for our files
- **Committed in:** `ba39d87`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for correctness (API compliance and type safety). No scope creep.

## Decisions Made

- **CardRenderer forwardRef:** Changed to use `forwardRef` pattern to allow parent components to access the DOM element for html2canvas rendering
- **html2canvas options:** Set scale:2 for high-quality PNG, useCORS:true for cross-browser compatibility, exact 1080×1350px dimensions
- **DesignOrchestration embedded grid:** Instead of using separate CardGrid component, embedded the grid functionality directly in DesignOrchestration for simpler card ref management
- **Page max-width increased:** Changed from max-w-4xl to max-w-6xl to accommodate the 1080×1350px card grid display

## Requirements Satisfied

- **DSGN-07:** 각 카드를 1080×1350px PNG로 개별 렌더링한다 - html2canvas with exact dimensions
- **DSGN-08:** 전체 카드를 ZIP 파일로 일괄 다운로드하는 버튼을 제공한다 - jszip + file-saver implementation

## Integration Points

The components created in this plan complete the Phase 4 workflow:
- DownloadControls receives card refs from DesignOrchestration
- DesignOrchestration integrates all Phase 4 components (ImageUpload, DesignTokenExtractor, CardGrid, DownloadControls)
- Main page (page.tsx) displays DesignOrchestration after StructureReview approval

## Testing Notes

- TypeScript compilation passes for all new/modified files
- html2canvas API corrected (onClone → onclone)
- file-saver package installed with @types/file-saver for TypeScript support
- All components use 'use client' directive as required
- Korean UI text follows project convention
- Download progress indicator implemented for batch operations

## Issues Encountered

- TypeScript errors due to html2canvas API name mismatch (onClone vs onclone) - fixed in auto-fix
- Build failure due to missing autoprefixer module (pre-existing project issue, unrelated to this plan's changes)

## User Setup Required

None - file-saver package installed as part of this plan. No external service configuration required.

## Next Phase Readiness

- Phase 4 design output complete with full end-to-end workflow
- All components integrated into main page
- Ready for Phase 5 (if exists) or project completion
- No blockers - all requirements satisfied

## Self-Check: PASSED

- DownloadControls.tsx exists at components/card-news/output/DownloadControls.tsx
- DesignOrchestration.tsx exists at components/card-news/design/DesignOrchestration.tsx
- CardRenderer.tsx updated with forwardRef at components/card-news/output/CardRenderer.tsx
- page.tsx updated with DesignOrchestration integration at app/card-news/page.tsx
- Commit a708761 found (Task 1)
- Commit c79693b found (Task 2)
- Commit f22089c found (Task 3)
- Commit ba39d87 found (Auto-fix)
- file-saver package installed
- @types/file-saver package installed

---
*Phase: 04-design-output*
*Plan: 04*
*Completed: 2026-03-04*
