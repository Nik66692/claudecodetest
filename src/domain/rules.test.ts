import { describe, it, expect } from 'vitest';
import { createDeck, addCard, setCommander } from './deck';
import { maxCopies, validateDeck, commanderColorIdentity, totalCardCount } from './rules';
import { makeCard, basicForest, azusaCommander } from '@/test/fixtures';

describe('maxCopies', () => {
  it('limits normal cards to one copy', () => {
    expect(maxCopies(makeCard())).toBe(1);
  });
  it('allows unlimited basic lands', () => {
    expect(maxCopies(basicForest())).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('commanderColorIdentity', () => {
  it('combines the identities of partner commanders in WUBRG order', () => {
    const a = makeCard({ name: 'A', canBeCommander: true, colorIdentity: ['U'] });
    const b = makeCard({ name: 'B', canBeCommander: true, colorIdentity: ['W'] });
    let deck = setCommander(createDeck(), a);
    deck = setCommander(deck, b, { additive: true });
    expect(commanderColorIdentity(deck)).toEqual(['W', 'U']);
  });
});

describe('validateDeck', () => {
  it('warns when there is no commander', () => {
    const violations = validateDeck(createDeck());
    expect(violations.some((v) => v.kind === 'missing-commander')).toBe(true);
  });

  it('warns about out-of-color-identity cards', () => {
    const azusa = azusaCommander(); // green identity
    const blueCard = makeCard({ name: 'Counterspell', colorIdentity: ['U'] });
    let deck = setCommander(createDeck(), azusa);
    deck = addCard(deck, blueCard);
    const violations = validateDeck(deck);
    expect(violations.some((v) => v.kind === 'out-of-color-identity')).toBe(true);
  });

  it('reports the deck-size estimate', () => {
    const deck = setCommander(createDeck(), azusaCommander());
    expect(totalCardCount(deck)).toBe(1);
    const violations = validateDeck(deck);
    expect(violations.some((v) => v.kind === 'deck-size')).toBe(true);
  });
});
