import { describe, it, expect } from 'vitest';
import { sortDeckCards, primaryType } from './sort';
import type { DeckCard } from './types';
import { makeCard } from '@/test/fixtures';

function entry(name: string, manaValue: number, addedAt = 0, quantity = 1): DeckCard {
  return {
    cardId: name,
    card: makeCard({ name, manaValue, oracleId: name }),
    quantity,
    section: 'main',
    categoryId: null,
    addedAt,
  };
}

describe('primaryType', () => {
  it('extracts the dominant type from a type line', () => {
    expect(primaryType('Legendary Creature — Elf Druid')).toBe('Creature');
    expect(primaryType('Basic Land — Forest')).toBe('Land');
    expect(primaryType('Artifact — Equipment')).toBe('Artifact');
  });
});

describe('sortDeckCards', () => {
  it('sorts by mana value ascending and descending', () => {
    const cards = [entry('C', 3), entry('A', 1), entry('B', 2)];
    expect(sortDeckCards(cards, 'manaValue', 'asc').map((c) => c.card.name)).toEqual([
      'A',
      'B',
      'C',
    ]);
    expect(sortDeckCards(cards, 'manaValue', 'desc').map((c) => c.card.name)).toEqual([
      'C',
      'B',
      'A',
    ]);
  });

  it('breaks ties by name for deterministic output', () => {
    const cards = [entry('Zed', 2), entry('Abe', 2)];
    expect(sortDeckCards(cards, 'manaValue', 'asc').map((c) => c.card.name)).toEqual([
      'Abe',
      'Zed',
    ]);
  });

  it('sorts by name', () => {
    const cards = [entry('Banana', 1), entry('Apple', 5)];
    expect(sortDeckCards(cards, 'name').map((c) => c.card.name)).toEqual(['Apple', 'Banana']);
  });

  it('does not mutate the input array', () => {
    const cards = [entry('B', 2), entry('A', 1)];
    const copy = [...cards];
    sortDeckCards(cards, 'name');
    expect(cards).toEqual(copy);
  });
});
