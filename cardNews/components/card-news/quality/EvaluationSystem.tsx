'use client';

import { useState, useCallback } from 'react';

// ─── Core Types ───────────────────────────────────────────────────────────────

export type AgentRole = 'hooking' | 'copy';

export interface AgentEvaluation {
  agentId: string;
  agentType: AgentRole;
  score: number;
  comment: string;
}

export interface AgentScoreHistory {
  evaluationId: string;
  loopIndex: number;
  scores: AgentEvaluation[];
  averageScore: number;
  isApproved: boolean;
  timestamp: string;
}

export interface ReviewResult {
  evaluationId: string;
  isApproved: boolean;
  averageScore: number;
  comments: string[];
}

export interface EvaluationState {
  phase: 'idle' | 'evaluating' | 'approved' | 'rewriting' | 'failed';
  history: AgentScoreHistory[];
  latestResult: ReviewResult | null;
  loopCount: number;
  maxLoops: number;
  isEvaluating: boolean;
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PASS_THRESHOLD = 75;
export const MAX_LOOPS = 3;

// ─── Utilities ────────────────────────────────────────────────────────────────

export function calcAverageScore(evaluations: AgentEvaluation[]): number {
  if (evaluations.length === 0) return 0;
  const total = evaluations.reduce((sum, e) => sum + e.score, 0);
  return Math.round(total / evaluations.length);
}

export function isApproved(averageScore: number): boolean {
  return averageScore >= PASS_THRESHOLD;
}

export function buildEvaluationId(loopIndex: number): string {
  return `eval-${loopIndex}-${Date.now()}`;
}

// ─── Initial State Factory ────────────────────────────────────────────────────

export function createInitialEvaluationState(): EvaluationState {
  return {
    phase: 'idle',
    history: [],
    latestResult: null,
    loopCount: 0,
    maxLoops: MAX_LOOPS,
    isEvaluating: false,
    error: null,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEvaluationSystem() {
  const [state, setState] = useState<EvaluationState>(createInitialEvaluationState());

  const startEvaluation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'evaluating',
      isEvaluating: true,
      error: null,
    }));
  }, []);

  const recordEvaluationResult = useCallback(
    (evaluations: AgentEvaluation[]) => {
      setState((prev) => {
        const evalId = buildEvaluationId(prev.loopCount);
        const avg = calcAverageScore(evaluations);
        const approved = isApproved(avg);

        const historyEntry: AgentScoreHistory = {
          evaluationId: evalId,
          loopIndex: prev.loopCount,
          scores: evaluations,
          averageScore: avg,
          isApproved: approved,
          timestamp: new Date().toISOString(),
        };

        const reviewResult: ReviewResult = {
          evaluationId: evalId,
          isApproved: approved,
          averageScore: avg,
          comments: evaluations.map((e) => e.comment),
        };

        return {
          ...prev,
          history: [...prev.history, historyEntry],
          latestResult: reviewResult,
          phase: approved ? 'approved' : prev.loopCount + 1 >= prev.maxLoops ? 'failed' : 'rewriting',
          isEvaluating: false,
          loopCount: prev.loopCount + 1,
        };
      });
    },
    []
  );

  const startRewrite = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'rewriting',
      isEvaluating: false,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      phase: 'idle',
      isEvaluating: false,
      error,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(createInitialEvaluationState());
  }, []);

  return {
    state,
    startEvaluation,
    recordEvaluationResult,
    startRewrite,
    setError,
    reset,
  };
}
