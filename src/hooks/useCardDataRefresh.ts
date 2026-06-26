import { useCallback, useState } from 'react';
import type { Deck } from '@/domain/types';
import { normalizeCardName } from '@/domain/import';
import { scryfall, ScryfallError } from '@/scryfall';

export type RefreshStatus = 'idle' | 'loading' | 'success' | 'partial' | 'error' | 'offline';

export interface RefreshResult {
  /** Distinct card names that were refreshed with new metadata. */
  updated: number;
  /** Distinct card names Scryfall could not resolve (snapshots left as-is). */
  notFound: string[];
}

export interface CardDataRefresh {
  status: RefreshStatus;
  result: RefreshResult | null;
  error: string | null;
  refresh: () => void;
}

/**
 * Re-fetch card metadata for every card in a deck from Scryfall using the
 * collection endpoint (≤75 identifiers per request, never one request per card),
 * and replace only the card snapshots — sections, quantities, categories, dates,
 * and all user organization are preserved. Runs only when invoked (never on
 * render). Surfaces loading, partial-failure, success, offline, and error states.
 */
export function useCardDataRefresh(
  deck: Deck | null,
  commit: (next: Deck) => void,
): CardDataRefresh {
  const [status, setStatus] = useState<RefreshStatus>('idle');
  const [result, setResult] = useState<RefreshResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!deck) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus('offline');
      setError('You appear to be offline. Connect to refresh card data from Scryfall.');
      return;
    }

    const distinctNames = [...new Set(deck.cards.map((c) => c.card.name))];
    if (distinctNames.length === 0) {
      setStatus('success');
      setResult({ updated: 0, notFound: [] });
      return;
    }

    setStatus('loading');
    setError(null);

    scryfall
      .getCollectionByNames(distinctNames)
      .then(({ byName, notFound }) => {
        let updated = 0;
        const updatedNames = new Set<string>();
        const cards = deck.cards.map((entry) => {
          const fresh = byName.get(normalizeCardName(entry.card.name));
          if (!fresh) return entry;
          updatedNames.add(normalizeCardName(entry.card.name));
          // Preserve the deck-card identity and user organization; swap only the
          // card metadata snapshot. Keep cardId stable to honor the invariant
          // `cardId === card.oracleId`.
          return { ...entry, card: { ...fresh, oracleId: entry.cardId } };
        });
        updated = updatedNames.size;

        commit({ ...deck, cards, updatedAt: Date.now() });
        setResult({ updated, notFound });
        setStatus(notFound.length > 0 ? 'partial' : 'success');
      })
      .catch((err: unknown) => {
        if (err instanceof ScryfallError && err.kind === 'network') {
          setStatus('offline');
          setError('Could not reach Scryfall. Check your connection and try again.');
          return;
        }
        setStatus('error');
        setError(
          err instanceof ScryfallError ? err.message : 'Could not refresh card data. Try again.',
        );
      });
  }, [deck, commit]);

  return { status, result, error, refresh };
}
