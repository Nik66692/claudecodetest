import type { Card, Deck, DeckCard, ProducedMana } from '../types';
import { PRODUCED_MANA } from '../types';
import { type ContributorRef, emptyProducedTally, isLand } from './analysisTypes';

export interface ManaProductionOptions {
  /** Include commander-section cards as potential sources. Default true. */
  includeCommanders?: boolean;
}

export interface ManaProduction {
  /** Total land copies. */
  totalLands: number;
  /** Land copies with recognized mana production (`produces` non-empty). */
  landsWithProduction: number;
  /** Non-land copies with recognized mana production. */
  nonlandProducers: number;
  /**
   * Source copies that can produce each symbol. NON-ADDITIVE across colors: a
   * multicolor source is counted once for every color it makes, so summing these
   * over-counts cards. Compare each color independently.
   */
  sourcesByColor: Record<ProducedMana, number>;
  landSourcesByColor: Record<ProducedMana, number>;
  nonlandSourcesByColor: Record<ProducedMana, number>;
  /**
   * Copies whose production metadata is missing/incomplete (legacy snapshots
   * captured before Phase 2). These are "unknown", not "produces nothing", and
   * should be refreshed before trusting the totals.
   */
  incompleteCards: number;
  /** Land sources contributing to each symbol (drill-down). */
  landContributors: Record<ProducedMana, ContributorRef[]>;
  /** Non-land sources contributing to each symbol (drill-down). */
  nonlandContributors: Record<ProducedMana, ContributorRef[]>;
}

function selectProductionCards(deck: Deck, includeCommanders: boolean): DeckCard[] {
  return deck.cards.filter((entry) => {
    if (entry.section === 'maybeboard') return false;
    if (entry.section === 'commander' && !includeCommanders) return false;
    return true;
  });
}

function emptyContributors(): Record<ProducedMana, ContributorRef[]> {
  return { W: [], U: [], B: [], R: [], G: [], C: [] };
}

/**
 * Analyze a deck's recognized mana production from structured Scryfall data.
 *
 * Honesty constraints:
 *  - Uses only the structured "can produce" list ({@link Card.produces}); it does
 *    NOT parse oracle text as a rules engine.
 *  - A "can produce" signal carries no information about quantity, reliability,
 *    timing, or restrictions — a conditional source is counted the same as an
 *    unconditional one.
 *  - Missing metadata is reported as incomplete, never silently read as "produces
 *    no mana".
 *  - Per-color source counts are NON-ADDITIVE (multicolor sources count once per
 *    color).
 */
export function analyzeManaProduction(
  deck: Deck,
  options: ManaProductionOptions = {},
): ManaProduction {
  const includeCommanders = options.includeCommanders ?? true;

  const sourcesByColor = emptyProducedTally();
  const landSourcesByColor = emptyProducedTally();
  const nonlandSourcesByColor = emptyProducedTally();
  const landContributors = emptyContributors();
  const nonlandContributors = emptyContributors();

  let totalLands = 0;
  let landsWithProduction = 0;
  let nonlandProducers = 0;
  let incompleteCards = 0;

  for (const entry of selectProductionCards(deck, includeCommanders)) {
    const qty = entry.quantity;
    const card = entry.card;
    const land = isLand(card);
    if (land) totalLands += qty;
    if (!card.productionDataComplete) incompleteCards += qty;

    if (card.produces.length === 0) continue;
    if (land) landsWithProduction += qty;
    else nonlandProducers += qty;

    for (const symbol of card.produces) {
      sourcesByColor[symbol] += qty;
      if (land) {
        landSourcesByColor[symbol] += qty;
        pushContributor(landContributors[symbol], card, qty);
      } else {
        nonlandSourcesByColor[symbol] += qty;
        pushContributor(nonlandContributors[symbol], card, qty);
      }
    }
  }

  for (const symbol of PRODUCED_MANA) {
    landContributors[symbol].sort(sortByName);
    nonlandContributors[symbol].sort(sortByName);
  }

  return {
    totalLands,
    landsWithProduction,
    nonlandProducers,
    sourcesByColor,
    landSourcesByColor,
    nonlandSourcesByColor,
    incompleteCards,
    landContributors,
    nonlandContributors,
  };
}

function pushContributor(list: ContributorRef[], card: Card, quantity: number): void {
  list.push({ cardId: card.oracleId, name: card.name, quantity, weight: 1, card });
}

function sortByName(a: ContributorRef, b: ContributorRef): number {
  return a.name.localeCompare(b.name);
}
