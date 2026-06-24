import { describe, it, expect } from 'vitest';
import { groupDeckCards } from './group';
import { createDeck, addCard, addCategory, setCardCategory } from './deck';
import { makeCard } from '@/test/fixtures';

describe('groupDeckCards', () => {
  it('groups by card type', () => {
    let deck = createDeck();
    deck = addCard(deck, makeCard({ name: 'Elf', typeLine: 'Creature — Elf' }));
    deck = addCard(deck, makeCard({ name: 'Bolt', typeLine: 'Instant' }));
    deck = addCard(deck, makeCard({ name: 'Wastes', typeLine: 'Basic Land' }));
    const groups = groupDeckCards(deck.cards, 'type', deck);
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('Creature');
    expect(labels).toContain('Instant');
    expect(labels).toContain('Land');
  });

  it('groups by mana value with a 7+ bucket', () => {
    let deck = createDeck();
    deck = addCard(deck, makeCard({ name: 'Cheap', manaValue: 1 }));
    deck = addCard(deck, makeCard({ name: 'Huge', manaValue: 9 }));
    const groups = groupDeckCards(deck.cards, 'manaValue', deck);
    expect(groups.find((g) => g.cards.some((c) => c.card.name === 'Huge'))?.label).toBe(
      'Mana value 7+',
    );
  });

  it('places uncategorized cards in their own bucket', () => {
    let deck = createDeck();
    deck = addCard(deck, makeCard({ name: 'Ramp Card', oracleId: 'ramp' }));
    deck = addCard(deck, makeCard({ name: 'Loose Card', oracleId: 'loose' }));
    const added = addCategory(deck, 'Ramp');
    deck = setCardCategory(added.deck, 'ramp', 'main', added.id);
    const groups = groupDeckCards(deck.cards, 'category', deck);
    expect(groups.map((g) => g.label)).toContain('Ramp');
    expect(groups.map((g) => g.label)).toContain('Uncategorized');
  });

  it('returns a single bucket when grouping is off', () => {
    let deck = createDeck();
    deck = addCard(deck, makeCard());
    const groups = groupDeckCards(deck.cards, 'none', deck);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe('All cards');
  });
});
