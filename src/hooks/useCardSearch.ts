import { useEffect, useRef, useState } from 'react';
import type { Card } from '@/domain/types';
import { scryfall, ScryfallError } from '@/scryfall';
import { useDebouncedValue } from './useDebouncedValue';

export type SearchMode = 'cards' | 'commanders';

export interface CardSearchState {
  cards: Card[];
  status: 'idle' | 'loading' | 'success' | 'error' | 'empty';
  error: string | null;
  totalCards: number;
}

const INITIAL: CardSearchState = { cards: [], status: 'idle', error: null, totalCards: 0 };

function describeError(error: unknown): string {
  if (error instanceof ScryfallError) {
    switch (error.kind) {
      case 'network':
        return 'Could not reach Scryfall. Check your connection and try again.';
      case 'rate-limited':
        return 'Too many requests to Scryfall. Wait a moment and try again.';
      case 'invalid-response':
        return 'Scryfall returned unexpected data. Try a different search.';
      default:
        return error.message;
    }
  }
  return 'Something went wrong while searching. Try again.';
}

/**
 * Debounced Scryfall card search with request cancellation. Interactive typing
 * is debounced (default 350ms) and in-flight requests are aborted when the
 * query changes, keeping request volume well under Scryfall's limits.
 */
export function useCardSearch(query: string, mode: SearchMode, delay = 350): CardSearchState {
  const debounced = useDebouncedValue(query.trim(), delay);
  const [state, setState] = useState<CardSearchState>(INITIAL);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    controllerRef.current?.abort();

    if (debounced.length < 2) {
      setState(INITIAL);
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setState((prev) => ({ ...prev, status: 'loading', error: null }));

    const run = mode === 'commanders' ? scryfall.searchCommanders : scryfall.searchCards;
    run
      .call(scryfall, debounced, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setState({
          cards: result.cards,
          totalCards: result.totalCards,
          status: result.cards.length === 0 ? 'empty' : 'success',
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }
        setState({ cards: [], totalCards: 0, status: 'error', error: describeError(error) });
      });

    return () => controller.abort();
  }, [debounced, mode]);

  return state;
}
