import type { Card, Deck, DeckCard } from '../types';
import { isLand } from './analysisTypes';

export interface CurveOptions {
  /** Include commander-section cards. Default false. */
  includeCommanders?: boolean;
  /** Include lands. Default false (lands have no informative mana value). */
  includeLands?: boolean;
  /**
   * Which part of the deck to analyze. `'main'` covers the main deck (plus
   * commanders when {@link CurveOptions.includeCommanders} is set); `'maybeboard'`
   * inspects the maybeboard in isolation so it is never silently mixed in.
   */
  scope?: 'main' | 'maybeboard';
}

export interface CurveCardRef {
  cardId: string;
  name: string;
  manaValue: number;
  quantity: number;
  card: Card;
}

export interface CurveBucket {
  /** Display label: `'0'`–`'6'` or `'7+'`. */
  label: string;
  /** Inclusive lower bound of the bucket's mana value. */
  min: number;
  /** Inclusive upper bound, or `null` for the open-ended `7+` bucket. */
  max: number | null;
  /** Total card copies in this bucket (quantities respected). */
  count: number;
  /** Share of the included total, 0–100 (0 when the total is 0). */
  percentage: number;
  cards: CurveCardRef[];
}

export interface ManaCurve {
  buckets: CurveBucket[];
  /** Total copies included in the calculation. */
  totalCards: number;
  /** Mean mana value across included copies (0 when empty). Rounded to 2 dp. */
  averageManaValue: number;
  options: Required<CurveOptions>;
}

/** Bucket boundaries: 0,1,2,3,4,5,6 then an open-ended 7+. */
const BUCKET_DEFS: { label: string; min: number; max: number | null }[] = [
  { label: '0', min: 0, max: 0 },
  { label: '1', min: 1, max: 1 },
  { label: '2', min: 2, max: 2 },
  { label: '3', min: 3, max: 3 },
  { label: '4', min: 4, max: 4 },
  { label: '5', min: 5, max: 5 },
  { label: '6', min: 6, max: 6 },
  { label: '7+', min: 7, max: null },
];

function bucketIndexFor(manaValue: number): number {
  const mv = Math.max(0, Math.floor(manaValue));
  return mv >= 7 ? BUCKET_DEFS.length - 1 : mv;
}

function selectCurveCards(deck: Deck, opts: Required<CurveOptions>): DeckCard[] {
  return deck.cards.filter((entry) => {
    if (opts.scope === 'maybeboard') {
      if (entry.section !== 'maybeboard') return false;
    } else {
      if (entry.section === 'maybeboard') return false;
      if (entry.section === 'commander' && !opts.includeCommanders) return false;
    }
    if (!opts.includeLands && isLand(entry.card)) return false;
    return true;
  });
}

/**
 * Compute the mana curve for a deck.
 *
 * Assumptions:
 *  - Uses the normalized Scryfall mana value stored on each card.
 *  - Variable costs ({X}) use that stored mana value and do not predict the
 *    chosen value of X.
 *  - By default excludes lands, commanders, and the maybeboard; all are
 *    toggleable. Quantities are always respected.
 *  - Cards are bucketed by `floor(manaValue)` into 0–6 and an open-ended 7+.
 *  - Double-faced/split/adventure cards use the stored front-face mana value
 *    (a documented data-model limitation), so they are not double-counted.
 */
export function computeManaCurve(deck: Deck, options: CurveOptions = {}): ManaCurve {
  const opts: Required<CurveOptions> = {
    includeCommanders: options.includeCommanders ?? false,
    includeLands: options.includeLands ?? false,
    scope: options.scope ?? 'main',
  };

  const buckets: CurveBucket[] = BUCKET_DEFS.map((d) => ({
    label: d.label,
    min: d.min,
    max: d.max,
    count: 0,
    percentage: 0,
    cards: [],
  }));

  let totalCards = 0;
  let manaValueSum = 0;

  for (const entry of selectCurveCards(deck, opts)) {
    const qty = entry.quantity;
    const bucket = buckets[bucketIndexFor(entry.card.manaValue)]!;
    bucket.count += qty;
    bucket.cards.push({
      cardId: entry.cardId,
      name: entry.card.name,
      manaValue: entry.card.manaValue,
      quantity: qty,
      card: entry.card,
    });
    totalCards += qty;
    manaValueSum += entry.card.manaValue * qty;
  }

  for (const bucket of buckets) {
    bucket.percentage = totalCards === 0 ? 0 : (bucket.count / totalCards) * 100;
    bucket.cards.sort((a, b) => a.name.localeCompare(b.name));
  }

  const averageManaValue =
    totalCards === 0 ? 0 : Math.round((manaValueSum / totalCards) * 100) / 100;

  return { buckets, totalCards, averageManaValue, options: opts };
}
