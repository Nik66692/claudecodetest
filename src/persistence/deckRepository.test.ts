import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { ManabaseDb } from './db';
import { DeckRepository } from './deckRepository';
import { createDeck, addCard, setCommander } from '@/domain/deck';
import { makeCard, azusaCommander } from '@/test/fixtures';

let db: ManabaseDb;
let repo: DeckRepository;

beforeEach(async () => {
  // Fresh database per test for isolation.
  db = new ManabaseDb(`test-${crypto.randomUUID()}`);
  repo = new DeckRepository(db);
});

describe('DeckRepository', () => {
  it('saves and reopens a deck with all its data intact', async () => {
    let deck = createDeck({ name: 'My Deck' });
    deck = setCommander(deck, azusaCommander());
    deck = addCard(deck, makeCard({ name: 'Sol Ring', oracleId: 'sol' }));

    await repo.save(deck);
    const reopened = await repo.get(deck.id);

    expect(reopened).not.toBeNull();
    expect(reopened?.name).toBe('My Deck');
    expect(reopened?.cards).toHaveLength(2);
    expect(reopened?.cards.some((c) => c.section === 'commander')).toBe(true);
  });

  it('lists summaries sorted by most recently updated', async () => {
    const older = createDeck({ name: 'Older', now: 1000 });
    const newer = createDeck({ name: 'Newer', now: 2000 });
    await repo.save(older);
    await repo.save(newer);

    const summaries = await repo.listSummaries();
    expect(summaries.map((s) => s.name)).toEqual(['Newer', 'Older']);
  });

  it('deletes a deck', async () => {
    const deck = createDeck({ name: 'Temp' });
    await repo.save(deck);
    await repo.delete(deck.id);
    expect(await repo.get(deck.id)).toBeNull();
  });

  it('refuses to save structurally invalid decks', async () => {
    const bad = { ...createDeck(), cards: 'not-an-array' } as unknown as ReturnType<
      typeof createDeck
    >;
    await expect(repo.save(bad)).rejects.toThrow();
  });

  it('skips corrupted records on read and can purge them', async () => {
    const good = createDeck({ name: 'Good' });
    await repo.save(good);
    // Inject a corrupted record straight into the table, bypassing validation.
    await db.decks.put({ id: 'broken', name: 42 } as never);

    const { decks, corrupted } = await repo.getAll();
    expect(decks.map((d) => d.name)).toEqual(['Good']);
    expect(corrupted).toContain('broken');

    const removed = await repo.purgeCorrupted();
    expect(removed).toBe(1);
    expect(await db.decks.get('broken')).toBeUndefined();
  });
});
