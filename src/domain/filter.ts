import type { DeckCard, DeckFilters } from './types';

export const EMPTY_FILTERS: DeckFilters = {
  text: '',
  colors: [],
  includeColorless: true,
  type: '',
  manaValueMin: null,
  manaValueMax: null,
  categoryId: null,
};

export function hasActiveFilters(filters: DeckFilters): boolean {
  return (
    filters.text.trim() !== '' ||
    filters.colors.length > 0 ||
    filters.type.trim() !== '' ||
    filters.manaValueMin !== null ||
    filters.manaValueMax !== null ||
    filters.categoryId !== null
  );
}

function matchesColors(card: DeckCard, filters: DeckFilters): boolean {
  if (filters.colors.length === 0) return true;
  const identity = card.card.colorIdentity;
  if (identity.length === 0) return filters.includeColorless;
  return filters.colors.some((c) => identity.includes(c));
}

/** Pure, allocation-light predicate testing one card against the filter set. */
export function cardMatchesFilters(card: DeckCard, filters: DeckFilters): boolean {
  const text = filters.text.trim().toLowerCase();
  if (text && !card.card.name.toLowerCase().includes(text)) return false;

  const type = filters.type.trim().toLowerCase();
  if (type && !card.card.typeLine.toLowerCase().includes(type)) return false;

  if (!matchesColors(card, filters)) return false;

  if (filters.manaValueMin !== null && card.card.manaValue < filters.manaValueMin) return false;
  if (filters.manaValueMax !== null && card.card.manaValue > filters.manaValueMax) return false;

  if (filters.categoryId !== null && card.categoryId !== filters.categoryId) return false;

  return true;
}

export function filterDeckCards(cards: DeckCard[], filters: DeckFilters): DeckCard[] {
  if (!hasActiveFilters(filters)) return cards;
  return cards.filter((c) => cardMatchesFilters(c, filters));
}
