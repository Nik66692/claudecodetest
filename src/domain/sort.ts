import type { DeckCard, SortDirection, SortKey, ManaColor } from './types';
import { MANA_COLORS } from './types';

/** Primary card type, in the conventional deckbuilding display order. */
const TYPE_ORDER = [
  'Creature',
  'Planeswalker',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Battle',
  'Land',
] as const;

export function primaryType(typeLine: string): string {
  for (const t of TYPE_ORDER) {
    if (typeLine.includes(t)) return t;
  }
  // Fall back to the last word before the em dash, or the whole line.
  const beforeDash = typeLine.split('—')[0]?.trim() ?? typeLine;
  const words = beforeDash.split(/\s+/);
  return words[words.length - 1] ?? typeLine;
}

function typeRank(typeLine: string): number {
  const t = primaryType(typeLine);
  const idx = TYPE_ORDER.indexOf(t as (typeof TYPE_ORDER)[number]);
  return idx === -1 ? TYPE_ORDER.length : idx;
}

/** Numeric rank of a color identity for sorting (colorless last, then WUBRG, then multicolor by size). */
function colorRank(colors: ManaColor[]): number {
  if (colors.length === 0) return 100; // colorless sorts after mono and multi by convention here
  if (colors.length === 1) {
    const c = colors[0]!;
    return MANA_COLORS.indexOf(c);
  }
  // Multicolor ranks after monocolor, ordered by count then first color.
  return 10 + colors.length * 5 + MANA_COLORS.indexOf(colors[0]!);
}

type Comparator = (a: DeckCard, b: DeckCard) => number;

const comparators: Record<SortKey, Comparator> = {
  name: (a, b) => a.card.name.localeCompare(b.card.name),
  manaValue: (a, b) => a.card.manaValue - b.card.manaValue,
  color: (a, b) => colorRank(a.card.colorIdentity) - colorRank(b.card.colorIdentity),
  type: (a, b) => typeRank(a.card.typeLine) - typeRank(b.card.typeLine),
  quantity: (a, b) => a.quantity - b.quantity,
  dateAdded: (a, b) => a.addedAt - b.addedAt,
};

/**
 * Stable sort of deck cards. Ties always fall back to name (A→Z) so output is
 * deterministic regardless of input order.
 */
export function sortDeckCards(
  cards: DeckCard[],
  key: SortKey,
  direction: SortDirection = 'asc',
): DeckCard[] {
  const cmp = comparators[key];
  const sign = direction === 'asc' ? 1 : -1;
  return [...cards].sort((a, b) => {
    const primary = cmp(a, b) * sign;
    if (primary !== 0) return primary;
    return a.card.name.localeCompare(b.card.name);
  });
}
