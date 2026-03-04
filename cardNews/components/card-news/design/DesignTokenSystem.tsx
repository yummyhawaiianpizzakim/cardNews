'use client';

import { useState, useCallback } from 'react';
import type { DesignToken } from '@/components/lib/types';
import { getDefaultDesignToken } from '@/components/lib/types';

/**
 * Design token state phases
 */
export type DesignTokenPhase =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'extracted'
  | 'error';

/**
 * Design token state
 */
export interface DesignTokenState {
  phase: DesignTokenPhase;
  token: DesignToken;
  referenceImage: string | null;
  error: string | null;
}

/**
 * Initial state factory
 */
export function createInitialDesignTokenState(): DesignTokenState {
  return {
    phase: 'idle',
    token: getDefaultDesignToken(),
    referenceImage: null,
    error: null,
  };
}

/**
 * Hook for managing design token state
 * DSGN-04: 분석 결과를 디자인 토큰(JSON)으로 변환해 각 카드에 자동 적용한다
 * DSGN-04: CSS 변수로 디자인 토큰 적용 (재사용 가능, 유지보수 용이)
 */
export function useDesignTokenSystem() {
  const [state, setState] = useState<DesignTokenState>(createInitialDesignTokenState());

  /**
   * Set reference image and transition to uploading phase
   */
  const setReferenceImage = useCallback((base64: string | null) => {
    setState((prev) => ({
      ...prev,
      referenceImage: base64,
      phase: base64 ? 'analyzing' : 'idle',
      error: null,
    }));
  }, []);

  /**
   * Set extracted design token
   */
  const setDesignToken = useCallback((token: DesignToken) => {
    setState((prev) => ({
      ...prev,
      token,
      phase: 'extracted',
    }));
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setState(createInitialDesignTokenState());
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      phase: 'error',
      error,
    }));
  }, []);

  return {
    state,
    setReferenceImage,
    setDesignToken,
    reset,
    setError,
  };
}
