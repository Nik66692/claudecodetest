import { describe, it, expect } from 'vitest';
import { cardMatchesFilters, filterDeckCards, EMPTY_FILTERS } from './filter';
import type { DeckCard, DeckFilters } from './types';
import { makeCard } from '@/test/fixtures';

function entry(over: Parameters<typeof makeCard>[0]): DeckCard {
  const card = makeCard(over);
  return {
    cardId: card.oracleId,
    card,
    quantity: 1,
    section: 'main',
    categoryId: null,
    addedAt: 0,
  };
}

const filters = (patch: Partial<DeckFilters>): DeckFilters => ({ ...EMPTY_FILTERS, ...patch });

describe('cardMatchesFilters', () => {
  it('matches by name substring (case-insensitive)', () => {
    const card = entry({ name: 'Llanowar Elves' });
    expect(cardMatchesFilters(card, filters({ text: 'elv' }))).toBe(true);
    expect(cardMatchesFilters(card, filters({ text: 'goblin' }))).toBe(false);
  });

  it('matches by type line', () => {
    const card = entry({ typeLine: 'Creature — Elf Druid' });
    expect(cardMatchesFilters(card, filters({ type: 'creature' }))).toBe(true);
    expect(cardMatchesFilters(card, filters({ type: 'land' }))).toBe(false);
  });

  it('matches by color identity', () => {
    const green = entry({ colorIdentity: ['G'] });
    expect(cardMatchesFilters(green, filters({ colors: ['G'] }))).toBe(true);
    expect(cardMatchesFilters(green, filters({ colors: ['U'] }))).toBe(false);
  });

  it('respects the includeColorless flag', () => {
    const colorless = entry({ colorIdentity: [] });
    expect(cardMatchesFilters(colorless, filters({ colors: ['G'], includeColorless: true }))).toBe(
      true,
    );
    expect(cardMatchesFilters(colorless, filters({ colors: ['G'], includeColorless: false }))).toBe(
      false,
    );
  });

  it('matches a mana value range', () => {
    const card = entry({ manaValue: 4 });
    expect(cardMatchesFilters(card, filters({ manaValueMin: 3, manaValueMax: 5 }))).toBe(true);
    expect(cardMatchesFilters(card, filters({ manaValueMin: 5 }))).toBe(false);
  });
});

describe('filterDeckCards', () => {
  it('returns the same array reference when no filters are active', () => {
    const cards = [entry({ name: 'A' })];
    expect(filterDeckCards(cards, EMPTY_FILTERS)).toBe(cards);
  });

  it('filters out non-matching cards', () => {
    const cards = [entry({ name: 'Forest' }), entry({ name: 'Island' })];
    expect(filterDeckCards(cards, filters({ text: 'forest' }))).toHaveLength(1);
  });
});
