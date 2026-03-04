/**
 * Type definitions for Card News Generator
 * Shared types used across API routes, components, and UI
 */

/**
 * Research source from web search results
 */
export interface ResearchSource {
  title: string;
  url: string;
  summary: string;
}

/**
 * Individual card news item
 */
export interface CardNewsItem {
  type: 'cover' | 'body' | 'cta';
  headline: string;
  subtext: string;
  order: number;
}

/**
 * Complete card news response from the API
 */
export interface CardNewsResponse {
  cards: CardNewsItem[];
  researchSources: ResearchSource[];
}

/**
 * Request payload for card news generation
 */
export interface GenerateRequest {
  topic: string;
  audience: string;
  apiKey: string;
}

/**
 * Design tokens extracted from reference image
 */
export interface DesignToken {
  primaryColor: string; // e.g., "#3b82f6"
  secondaryColor: string;
  accentColor: string;
  fontCategory: 'sans-serif' | 'serif' | 'mono';
  layoutPattern: 'minimal' | 'bold' | 'layered' | 'centered';
  mood: 'professional' | 'playful' | 'serious' | 'elegant';
  backgroundColor: string | 'transparent';
}

/**
 * Default design tokens when analysis fails or no reference image
 */
export function getDefaultDesignToken(): DesignToken {
  return {
    primaryColor: '#3b82f6', // blue-500
    secondaryColor: '#1e40af', // blue-800
    accentColor: '#f59e0b', // amber-500
    fontCategory: 'sans-serif',
    layoutPattern: 'minimal',
    mood: 'professional',
    backgroundColor: '#ffffff',
  };
}

/**
 * Get CSS styles from design token
 */
export function getCardStyle(token: DesignToken): React.CSSProperties {
  const fontFamily = token.fontCategory === 'serif'
    ? 'Georgia, serif'
    : token.fontCategory === 'mono'
      ? 'ui-monospace, monospace'
      : 'system-ui, sans-serif';

  return {
    '--color-primary': token.primaryColor,
    '--color-secondary': token.secondaryColor,
    '--color-accent': token.accentColor,
    '--font-family': fontFamily,
    '--bg-color': token.backgroundColor,
    '--layout-pattern': token.layoutPattern,
  } as React.CSSProperties;
}
