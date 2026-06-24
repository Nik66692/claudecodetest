import type { Deck, DeckCard, GroupKey } from './types';
import { DECK_SECTION_LABELS } from './types';
import { colorIdentityLabel } from './colors';
import { primaryType } from './sort';

export interface CardGroup {
  /** Stable key used for ordering and React keys. */
  key: string;
  label: string;
  cards: DeckCard[];
  /** Sum of quantities in this group. */
  count: number;
}

function manaValueBucket(mv: number): { key: string; label: string } {
  if (mv >= 7) return { key: '7', label: '7+' };
  const v = Math.floor(mv);
  return { key: String(v), label: String(v) };
}

/**
 * Partition cards into ordered groups for display. Grouping is independent of
 * sorting: callers typically sort within each group separately.
 *
 * `deck` is needed to resolve custom-category names; pass it for `category`
 * grouping. The `none` group returns a single bucket containing all cards.
 */
export function groupDeckCards(cards: DeckCard[], groupBy: GroupKey, deck: Deck): CardGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All cards', cards, count: sum(cards) }];
  }

  const buckets = new Map<string, { label: string; order: number; cards: DeckCard[] }>();

  const ensure = (key: string, label: string, order: number) => {
    let b = buckets.get(key);
    if (!b) {
      b = { label, order, cards: [] };
      buckets.set(key, b);
    }
    return b;
  };

  for (const card of cards) {
    const { key, label, order } = bucketFor(card, groupBy, deck);
    ensure(key, label, order).cards.push(card);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[1].order - b[1].order || a[1].label.localeCompare(b[1].label))
    .map(([key, b]) => ({ key, label: b.label, cards: b.cards, count: sum(b.cards) }));
}

function bucketFor(
  card: DeckCard,
  groupBy: GroupKey,
  deck: Deck,
): { key: string; label: string; order: number } {
  switch (groupBy) {
    case 'category': {
      if (!card.categoryId) return { key: '__none', label: 'Uncategorized', order: 9999 };
      const cat = deck.categories.find((c) => c.id === card.categoryId);
      return cat
        ? { key: cat.id, label: cat.name, order: cat.order }
        : { key: '__none', label: 'Uncategorized', order: 9999 };
    }
    case 'type': {
      const t = primaryType(card.card.typeLine);
      return { key: t, label: t, order: 0 };
    }
    case 'manaValue': {
      const { key, label } = manaValueBucket(card.card.manaValue);
      return { key, label: `Mana value ${label}`, order: Number(key) };
    }
    case 'colorIdentity': {
      const label = colorIdentityLabel(card.card.colorIdentity);
      return { key: label, label, order: card.card.colorIdentity.length };
    }
    case 'section': {
      const order = card.section === 'commander' ? 0 : card.section === 'main' ? 1 : 2;
      return { key: card.section, label: DECK_SECTION_LABELS[card.section], order };
    }
    default:
      return { key: 'all', label: 'All cards', order: 0 };
  }
}

function sum(cards: DeckCard[]): number {
  return cards.reduce((acc, c) => acc + c.quantity, 0);
}
