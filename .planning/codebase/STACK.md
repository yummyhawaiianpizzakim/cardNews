# Technology Stack

**Analysis Date:** 2025-03-04

## Languages

**Primary:**
- TypeScript 5.7.3 - Main application language, used in API routes and all components
- JSX/TSX - React component syntax throughout the application

**Secondary:**
- JavaScript - Configuration files (`next.config.js`, `postcss.config.js`)

## Runtime

**Environment:**
- Node.js (version not specified in lockfile but compatible with npm package versions)

**Package Manager:**
- npm - Lock file: present (`package-lock.json` implied by `npm run` commands)

## Frameworks

**Core:**
- Next.js 15.1.0 - Full-stack React framework for SSR/SSG and API routes (`app/` directory structure)
- React 19.0.0 - UI library and component rendering
- React DOM 19.0.0 - React DOM rendering

**UI Components:**
- shadcn/ui (Radix UI) - Headless component library:
  - @radix-ui/react-accordion 1.2.1
  - @radix-ui/react-alert-dialog 1.1.4
  - @radix-ui/react-dialog 1.1.4
  - @radix-ui/react-dropdown-menu 2.1.4
  - @radix-ui/react-label 2.1.2
  - @radix-ui/react-progress 1.1.2
  - @radix-ui/react-slot 1.1.1
  - @radix-ui/react-tabs 1.1.3
  - @radix-ui/react-toast 1.2.4

**Styling:**
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- postcss 8.4.49 - CSS transformation tool
- tailwind-merge 3.0.1 - Utility class merging for dynamic styles
- tailwindcss-animate 1.0.7 - Animation plugin for Tailwind

**Utilities:**
- lucide-react 0.469.0 - Icon library
- clsx 2.1.1 - Utility for conditional className strings
- class-variance-authority 0.7.1 - Type-safe component variant management
- html2canvas 1.4.1 - HTML to canvas rendering (for image export)
- jszip 3.10.1 - ZIP file creation library (prepared for batch output)

## Key Dependencies

**Critical:**
- @anthropic-ai/sdk 0.33.0 - Anthropic API client, used in server-side route (`app/api/anthropic/route.ts`) and client-side direct browser calls (Quality Loop and Structure Review components)

**Build & Dev Tools:**
- eslint 9.18.0 - Linting tool
- eslint-config-next 15.1.0 - Next.js ESLint configuration
- @types/node 22.10.5 - TypeScript definitions for Node.js
- @types/react 19.0.6 - TypeScript definitions for React
- @types/react-dom 19.0.2 - TypeScript definitions for React DOM
- typescript 5.7.3 - TypeScript compiler and type checking

## Configuration

**Environment:**
- API keys passed at runtime via user input (no .env file required for basic operation)
- Anthropic API key provided by user in UI (`components/card-news/ApiKeyInput.tsx`)
- Remote image fetching enabled for any HTTPS hostname via `next.config.js`

**Build:**
- TypeScript: `tsconfig.json` with strict mode enabled, path alias `@/*` pointing to project root
- Tailwind: `tailwind.config.ts` with dark mode class support and custom animation keyframes
- PostCSS: `postcss.config.js` with Tailwind and autoprefixer plugins
- Next.js: `next.config.js` with remote image patterns for HTTPS URLs

## Platform Requirements

**Development:**
- Node.js with npm
- TypeScript 5.7.3+
- Modern browser with ES2020+ support for client-side Anthropic API calls

**Production:**
- Node.js runtime environment
- Deployment to platform supporting Next.js (Vercel, AWS, Docker, etc.)
- HTTPS required for client-side browser API calls to Anthropic API
- No database required (stateless application)

---

*Stack analysis: 2025-03-04*
