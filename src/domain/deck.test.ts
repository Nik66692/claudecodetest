import { describe, it, expect } from 'vitest';
import {
  createDeck,
  addCard,
  removeCard,
  setCardQuantity,
  moveCardToSection,
  setCommander,
  setCardCategory,
  addCategory,
  removeCategory,
  duplicateDeck,
  applyImportResult,
} from './deck';
import { commanders, totalCardCount, sectionCount } from './rules';
import { makeCard, basicForest, azusaCommander } from '@/test/fixtures';
import type { DeckImportResult } from './types';

describe('createDeck', () => {
  it('creates an empty commander deck with defaults', () => {
    const deck = createDeck({ name: '  My Deck  ', now: 100 });
    expect(deck.name).toBe('My Deck');
    expect(deck.format).toBe('commander');
    expect(deck.cards).toEqual([]);
    expect(deck.createdAt).toBe(100);
    expect(deck.updatedAt).toBe(100);
  });

  it('falls back to a default name when blank', () => {
    expect(createDeck({ name: '   ' }).name).toBe('Untitled deck');
  });
});

describe('addCard singleton rules', () => {
  it('clamps non-basic cards to a single copy', () => {
    const card = makeCard();
    let deck = createDeck();
    deck = addCard(deck, card, { quantity: 3 });
    expect(deck.cards[0]?.quantity).toBe(1);
    deck = addCard(deck, card, { quantity: 5 });
    expect(deck.cards).toHaveLength(1);
    expect(deck.cards[0]?.quantity).toBe(1);
  });

  it('allows any number of basic lands', () => {
    let deck = createDeck();
    deck = addCard(deck, basicForest(), { quantity: 10 });
    expect(deck.cards[0]?.quantity).toBe(10);
    deck = addCard(deck, basicForest(), { quantity: 5 });
    expect(deck.cards[0]?.quantity).toBe(15);
  });

  it('updates the timestamp on change', () => {
    const deck = addCard(createDeck({ now: 1 }), makeCard(), { now: 50 });
    expect(deck.updatedAt).toBe(50);
  });
});

describe('quantity and removal', () => {
  it('sets an exact quantity and removes at zero', () => {
    let deck = addCard(createDeck(), basicForest(), { quantity: 4 });
    const id = 'forest';
    deck = setCardQuantity(deck, id, 'main', 7);
    expect(deck.cards[0]?.quantity).toBe(7);
    deck = setCardQuantity(deck, id, 'main', 0);
    expect(deck.cards).toHaveLength(0);
  });

  it('removes a specific card from a section', () => {
    const card = makeCard();
    let deck = addCard(createDeck(), card);
    deck = removeCard(deck, card.oracleId, 'main');
    expect(deck.cards).toHaveLength(0);
  });
});

describe('sections', () => {
  it('moves a card between sections', () => {
    const card = makeCard();
    let deck = addCard(createDeck(), card, { section: 'main' });
    deck = moveCardToSection(deck, card.oracleId, 'main', 'maybeboard');
    expect(sectionCount(deck, 'main')).toBe(0);
    expect(sectionCount(deck, 'maybeboard')).toBe(1);
  });
});

describe('setCommander', () => {
  it('places a legendary creature in the commander section', () => {
    const azusa = azusaCommander();
    let deck = createDeck();
    deck = setCommander(deck, azusa);
    expect(commanders(deck)).toHaveLength(1);
    expect(commanders(deck)[0]?.card.name).toBe('Azusa, Lost but Seeking');
  });

  it('demotes the previous commander when replaced', () => {
    const first = azusaCommander();
    const second = makeCard({ name: 'Other Commander', canBeCommander: true });
    let deck = setCommander(createDeck(), first);
    deck = setCommander(deck, second);
    expect(commanders(deck)).toHaveLength(1);
    expect(commanders(deck)[0]?.card.name).toBe('Other Commander');
    // The previous commander returns to the main deck.
    expect(deck.cards.some((c) => c.section === 'main' && c.card.name === first.name)).toBe(true);
  });

  it('clears all commanders when passed null', () => {
    let deck = setCommander(createDeck(), azusaCommander());
    deck = setCommander(deck, null);
    expect(commanders(deck)).toHaveLength(0);
  });
});

describe('categories', () => {
  it('adds, assigns, and removes categories', () => {
    const card = makeCard();
    let deck = addCard(createDeck(), card);
    const { deck: withCat, id } = addCategory(deck, 'Ramp');
    deck = setCardCategory(withCat, card.oracleId, 'main', id);
    expect(deck.cards[0]?.categoryId).toBe(id);
    deck = removeCategory(deck, id);
    expect(deck.categories).toHaveLength(0);
    // Cards are un-categorized when their category is removed.
    expect(deck.cards[0]?.categoryId).toBeNull();
  });
});

describe('duplicateDeck', () => {
  it('clones a deck with a new id and "(copy)" name', () => {
    const original = addCard(createDeck({ name: 'Original' }), makeCard());
    const copy = duplicateDeck(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Original (copy)');
    expect(copy.cards).toHaveLength(1);
  });
});

describe('applyImportResult', () => {
  const azusa = azusaCommander();
  const forest = basicForest();
  const sol = makeCard({ name: 'Sol Ring', typeLine: 'Artifact', colorIdentity: [] });

  const result: DeckImportResult = {
    recognized: [
      { line: { raw: '1 Azusa', quantity: 1, name: 'Azusa', section: 'commander' }, card: azusa },
      { line: { raw: '10 Forest', quantity: 10, name: 'Forest', section: 'main' }, card: forest },
      { line: { raw: '1 Sol Ring', quantity: 1, name: 'Sol Ring', section: 'main' }, card: sol },
    ],
    unrecognized: [{ raw: '1 Fake Card', quantity: 1, name: 'Fake Card', section: 'main' }],
    unparseable: [],
    totalRequested: 13,
  };

  it('replaces a deck, routing commander lines into the commander section', () => {
    const deck = applyImportResult(createDeck(), result, 'replace');
    expect(commanders(deck)).toHaveLength(1);
    expect(sectionCount(deck, 'main')).toBe(11); // 10 forest + 1 sol ring
    expect(totalCardCount(deck)).toBe(12); // + commander
  });

  it('appends to an existing deck without dropping current cards', () => {
    const existing = addCard(createDeck(), makeCard({ name: 'Existing' }));
    const deck = applyImportResult(existing, result, 'append');
    expect(deck.cards.some((c) => c.card.name === 'Existing')).toBe(true);
    expect(deck.cards.some((c) => c.card.name === 'Sol Ring')).toBe(true);
  });
});
