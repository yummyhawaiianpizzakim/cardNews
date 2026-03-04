'use client';

import { useState, useCallback } from 'react';
import type { CardNewsItem } from '@/components/lib/types';

// ─── Core Types ───────────────────────────────────────────────────────────────

export type ProposalType = 'reorder' | 'add' | 'delete' | 'edit';

export interface StructureProposal {
  id: string;
  type: ProposalType;
  source: 'story-flow' | 'retention';
  reason: string;
  // reorder
  fromOrder?: number;
  toOrder?: number;
  // add
  insertAfterOrder?: number;
  newCard?: Omit<CardNewsItem, 'order'>;
  // delete / edit
  targetOrder?: number;
  // edit
  newHeadline?: string;
  newSubtext?: string;
}

export interface StructureState {
  phase: 'idle' | 'reviewing' | 'proposed' | 'applying' | 'done' | 'error';
  proposals: StructureProposal[];
  acceptedIds: string[];
  error: string | null;
  isReviewing: boolean;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function applyProposals(
  cards: CardNewsItem[],
  acceptedProposals: StructureProposal[]
): CardNewsItem[] {
  let result = [...cards];

  // Step 1: Build a Set of accepted delete targetOrders for conflict detection
  const acceptedDeleteOrders = new Set<number>(
    acceptedProposals
      .filter((p) => p.type === 'delete' && p.targetOrder !== undefined)
      .map((p) => p.targetOrder as number)
  );

  // Step 2: Apply 'edit' proposals — skip if same targetOrder is also being deleted
  for (const proposal of acceptedProposals) {
    if (proposal.type === 'edit' && proposal.targetOrder !== undefined) {
      if (!acceptedDeleteOrders.has(proposal.targetOrder)) {
        result = result.map((card) => {
          if (card.order === proposal.targetOrder) {
            return {
              ...card,
              headline: proposal.newHeadline ?? card.headline,
              subtext: proposal.newSubtext ?? card.subtext,
            };
          }
          return card;
        });
      }
    }
  }

  // Step 3: Apply 'delete' proposals — filter out cards whose order matches
  result = result.filter(
    (card) => !acceptedDeleteOrders.has(card.order)
  );

  // Step 4: Re-normalize order after delete
  result = result.map((card, i) => ({ ...card, order: i }));

  // Step 5: Apply 'add' proposals — insert newCard after card at insertAfterOrder
  for (const proposal of acceptedProposals) {
    if (
      proposal.type === 'add' &&
      proposal.newCard !== undefined &&
      proposal.insertAfterOrder !== undefined
    ) {
      const insertIdx = result.findIndex(
        (card) => card.order === proposal.insertAfterOrder
      );
      const newCard: CardNewsItem = {
        ...proposal.newCard,
        order: insertIdx >= 0 ? insertIdx + 1 : result.length,
      };
      if (insertIdx >= 0) {
        result.splice(insertIdx + 1, 0, newCard);
      } else {
        result.push(newCard);
      }
    }
  }

  // Step 6: Re-normalize order after add
  result = result.map((card, i) => ({ ...card, order: i }));

  // Step 7: Apply 'reorder' proposals — swap fromOrder and toOrder cards
  for (const proposal of acceptedProposals) {
    if (
      proposal.type === 'reorder' &&
      proposal.fromOrder !== undefined &&
      proposal.toOrder !== undefined
    ) {
      const fromIdx = result.findIndex((card) => card.order === proposal.fromOrder);
      const toIdx = result.findIndex((card) => card.order === proposal.toOrder);
      if (fromIdx >= 0 && toIdx >= 0) {
        const fromOrder = result[fromIdx].order;
        const toOrder = result[toIdx].order;
        result[fromIdx] = { ...result[fromIdx], order: toOrder };
        result[toIdx] = { ...result[toIdx], order: fromOrder };
      }
    }
  }

  // Step 8: Final re-sort and re-normalize
  result = result
    .sort((a, b) => a.order - b.order)
    .map((card, i) => ({ ...card, order: i }));

  return result;
}

// ─── Initial State Factory ────────────────────────────────────────────────────

export function createInitialStructureState(): StructureState {
  return {
    phase: 'idle',
    proposals: [],
    acceptedIds: [],
    error: null,
    isReviewing: false,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStructureSystem() {
  const [state, setState] = useState<StructureState>(createInitialStructureState());

  const startReview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'reviewing',
      isReviewing: true,
      error: null,
    }));
  }, []);

  const setProposals = useCallback((proposals: StructureProposal[]) => {
    setState((prev) => ({
      ...prev,
      phase: 'proposed',
      isReviewing: false,
      proposals,
      acceptedIds: proposals.map((p) => p.id),
    }));
  }, []);

  const toggleAccept = useCallback((id: string) => {
    setState((prev) => {
      const accepted = new Set(prev.acceptedIds);
      if (accepted.has(id)) {
        accepted.delete(id);
      } else {
        accepted.add(id);
      }
      return { ...prev, acceptedIds: Array.from(accepted) };
    });
  }, []);

  const acceptAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      acceptedIds: prev.proposals.map((p) => p.id),
    }));
  }, []);

  const rejectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      acceptedIds: [],
    }));
  }, []);

  const applyAccepted = useCallback(
    (cards: CardNewsItem[]): CardNewsItem[] => {
      setState((prev) => ({ ...prev, phase: 'applying' }));
      let result: CardNewsItem[] = [];
      setState((prev) => {
        const accepted = prev.proposals.filter((p) =>
          prev.acceptedIds.includes(p.id)
        );
        result = applyProposals(cards, accepted);
        return { ...prev, phase: 'done' };
      });
      return result;
    },
    []
  );

  const setError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      phase: 'error',
      isReviewing: false,
      error,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(createInitialStructureState());
  }, []);

  return {
    state,
    startReview,
    setProposals,
    toggleAccept,
    acceptAll,
    rejectAll,
    applyAccepted,
    setError,
    reset,
  };
}
