import { useLiveQuery } from 'dexie-react-hooks';
import type { Deck, DeckSummary } from '@/domain/types';
import { toDeckSummary } from '@/domain/summary';
import { getDb, deckRepository } from '@/persistence';
import { persistedDeckSchema } from '@/persistence';

export interface LibraryState {
  summaries: DeckSummary[] | undefined;
  corruptedCount: number;
}

/**
 * Live deck-library summaries. Uses Dexie's `useLiveQuery` so the list updates
 * automatically when decks are created, edited or deleted in any tab. Records
 * that fail validation are counted (not shown) so the library never crashes on
 * corrupted local data.
 */
export function useDeckLibrary(): LibraryState {
  const result = useLiveQuery(async () => {
    const rows = await getDb().decks.orderBy('updatedAt').reverse().toArray();
    const summaries: DeckSummary[] = [];
    let corrupted = 0;
    for (const row of rows) {
      const parsed = persistedDeckSchema.safeParse(row);
      if (parsed.success) summaries.push(toDeckSummary(parsed.data as Deck));
      else corrupted += 1;
    }
    return { summaries, corrupted };
  }, []);

  return {
    summaries: result?.summaries,
    corruptedCount: result?.corrupted ?? 0,
  };
}

export { deckRepository };
