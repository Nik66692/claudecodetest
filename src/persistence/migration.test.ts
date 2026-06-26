import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { persistedDeckSchema } from './schema';
import { DeckRepository } from './deckRepository';
import { ManabaseDb } from './db';
import { createDeck, addCard } from '@/domain/deck';
import { makeCard, basicForest } from '@/test/fixtures';
import { analyzeManaProduction } from '@/domain/analysis';
import type { Deck } from '@/domain/types';

/** Build a deck whose card snapshots predate Phase 2 production metadata. */
function legacyDeckRecord(): unknown {
  const deck = addCard(
    createDeck({ name: 'Legacy', id: 'legacy-deck' }),
    makeCard({ name: 'Old' }),
  );
  // Strip the Phase 2 fields and pin the old schema version, as a v1 record would.
  const raw = JSON.parse(JSON.stringify(deck)) as Deck & { schemaVersion: number };
  raw.schemaVersion = 1;
  for (const entry of raw.cards) {
    delete (entry.card as Record<string, unknown>).produces;
    delete (entry.card as Record<string, unknown>).productionDataComplete;
  }
  return raw;
}

describe('persistence migration / backward compatibility', () => {
  it('reads a legacy record by defaulting the new production fields safely', () => {
    const parsed = persistedDeckSchema.parse(legacyDeckRecord());
    const card = parsed.cards[0]!.card;
    expect(card.produces).toEqual([]);
    // Crucially "incomplete", not silently treated as a known empty result.
    expect(card.productionDataComplete).toBe(false);
  });

  it('does not misclassify an incomplete legacy snapshot as "produces nothing"', () => {
    const parsed = persistedDeckSchema.parse(legacyDeckRecord()) as Deck;
    const production = analyzeManaProduction(parsed);
    expect(production.incompleteCards).toBe(1);
  });

  it('round-trips new production metadata through the repository', async () => {
    const repo = new DeckRepository(new ManabaseDb(`mig-${crypto.randomUUID()}`));
    let deck = createDeck({ name: 'Modern', id: 'modern-deck' });
    deck = addCard(deck, basicForest(), { quantity: 3 }); // produces ['G'], complete
    await repo.save(deck);

    const reloaded = await repo.get('modern-deck');
    const forest = reloaded?.cards.find((c) => c.card.name === 'Forest');
    expect(forest?.card.produces).toEqual(['G']);
    expect(forest?.card.productionDataComplete).toBe(true);
  });
});
