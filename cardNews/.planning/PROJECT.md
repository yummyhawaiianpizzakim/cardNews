# AI 카드뉴스 자동 제작 웹앱

## What This Is

주제를 입력하면 AI가 리서치부터 카피 작성, 품질 검수, 구조 검토, 최종 이미지 출력까지 전 과정을 자동화하는 웹앱. 각 단계는 독립된 AI 에이전트가 담당하며 파이프라인 형태로 순차 실행된다. 모든 AI 호출은 클라이언트 사이드에서 Anthropic API를 직접 호출하며 별도 백엔드 서버 없이 동작한다.

## Core Value

사용자가 주제만 입력하면 검증된 품질의 카드뉴스를 자동으로 생성하고 1080×1350px PNG로 다운로드할 수 있다.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Stage 1: 리서치 & 카피 자동 생성 (web_search 툴로 정보 수집, 카피 초안 작성)
- [ ] Stage 2: 후킹팀 — 품질 자동 검수 루프 (2개 에이전트 병렬 평가, 75점 이상 통과)
- [ ] Stage 3: 구조 토론 — 카드 흐름 검토 (스토리 흐름, 독자 이탈 방지 검토)
- [ ] Stage 4: 디자인 적용 & PNG 출력 (레퍼런스 이미지 분석, 텍스트 인라인 편집, ZIP 다운로드)

### Out of Scope

- 사용자 인증/계정 시스템 — 별도 계정 없이 사용 가능
- 카드뉴스 저장/관리 기능 — 생성 즉시 다운로드
- 공유/게시 기능 — 다른 서비스 연동 없음
- AI 응답 캐싱 — 매번 실시간 생성
- 다른 출력 포맷 (PDF, GIF 등) — PNG만 지원

## Context

기술 스택이 이미 결정되어 있고 초기 프로젝트 설정이 완료된 상태.
- Framework: Next.js (App Router)
- UI 컴포넌트: shadcn/ui + Tailwind CSS
- AI: Anthropic Claude API (claude-sonnet-4-20250514) — 클라이언트 직접 호출
- 이미지 렌더링: html2canvas → PNG 출력
- 출력 사이즈: 1080×1350px

## Constraints

- **기술 스택**: Next.js, shadcn/ui, Anthropic SDK, html2canvas — 이미 결정됨
- **아키텍처**: 클라이언트 사이드 API 호출 — 별도 백엔드 서버 없음
- **출력**: 1080×1350px PNG만 지원
- **언어**: 한국어 UI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 클라이언트 사이드 API 호출 | 별도 서버 비용 없이 배포 가능, 간단한 구조 | — Pending |

---
*Last updated: 2026-03-03 after initial definition*
