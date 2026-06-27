import type { Card, Deck, DeckCard, ManaColor } from '../types';
import { MANA_COLORS } from '../types';
import { type ContributorRef, emptyColorTally, isLand } from './analysisTypes';
import { parseManaSymbols } from './manaSymbols';

export interface ManaDemandOptions {
  /** Include commander-section cards in demand. Default true. */
  includeCommanders?: boolean;
}

export interface ManaDemand {
  /** Strict colored pips required ({W}, {U}, …), quantities respected. */
  strictPips: Record<ManaColor, number>;
  /** Flexible/hybrid colored symbols ({W/U}, {2/W}) — counted per referenced color. */
  hybridColored: Record<ManaColor, number>;
  /** Phyrexian colored symbols ({W/P}) — payable with life, so not strict. */
  phyrexianColored: Record<ManaColor, number>;
  /** Explicit colorless requirements ({C}). */
  colorlessPips: number;
  /** Variable symbols ({X}/{Y}/{Z}); value not predicted. */
  variableSymbols: number;
  /** Sum of generic symbol amounts ({1}, {2}, …). */
  genericPips: number;
  /** Copies of cards with usable mana-cost data that were analyzed. */
  analyzedSpells: number;
  /** Copies excluded because they have no usable mana-cost data. */
  excludedNoCost: number;
  /** Cards contributing strict pips to each color (for drill-down). */
  contributors: Record<ManaColor, ContributorRef[]>;
}

function selectDemandCards(deck: Deck, includeCommanders: boolean): DeckCard[] {
  return deck.cards.filter((entry) => {
    if (entry.section === 'maybeboard') return false;
    if (entry.section === 'commander' && !includeCommanders) return false;
    // Lands are mana sources, not demand.
    return !isLand(entry.card);
  });
}

/**
 * Analyze the colored mana *demand* of a deck's spells.
 *
 * Assumptions and rules:
 *  - Only strict colored pips ({W}) count as colored demand. Hybrid ({W/U}),
 *    two-brid ({2/W}), and Phyrexian ({W/P}) symbols are reported separately and
 *    NOT treated as strict colored requirements, because they can be paid other
 *    ways. {C} is an explicit colorless requirement, also separate.
 *  - Lands are excluded (they are production, not demand). Maybeboard is excluded.
 *  - Quantities are respected. Cards with no usable mana cost are excluded and
 *    counted, never silently dropped.
 */
export function analyzeManaDemand(deck: Deck, options: ManaDemandOptions = {}): ManaDemand {
  const includeCommanders = options.includeCommanders ?? true;

  const strictPips = emptyColorTally();
  const hybridColored = emptyColorTally();
  const phyrexianColored = emptyColorTally();
  const contributorsByColor: Record<ManaColor, Map<string, ContributorRef>> = {
    W: new Map(),
    U: new Map(),
    B: new Map(),
    R: new Map(),
    G: new Map(),
  };

  let colorlessPips = 0;
  let variableSymbols = 0;
  let genericPips = 0;
  let analyzedSpells = 0;
  let excludedNoCost = 0;

  for (const entry of selectDemandCards(deck, includeCommanders)) {
    const qty = entry.quantity;
    const symbols = parseManaSymbols(entry.card.manaCost);
    if (symbols.length === 0) {
      excludedNoCost += qty;
      continue;
    }
    analyzedSpells += qty;

    const perColorStrict = emptyColorTally();
    for (const symbol of symbols) {
      switch (symbol.kind) {
        case 'colored':
          for (const c of symbol.colors) {
            strictPips[c] += qty;
            perColorStrict[c] += 1;
          }
          break;
        case 'hybrid':
        case 'hybrid-generic':
          for (const c of symbol.colors) hybridColored[c] += qty;
          break;
        case 'phyrexian':
          for (const c of symbol.colors) phyrexianColored[c] += qty;
          break;
        case 'colorless':
          colorlessPips += qty;
          break;
        case 'variable':
          variableSymbols += qty;
          break;
        case 'generic':
          genericPips += symbol.generic * qty;
          break;
        default:
          break;
      }
    }

    for (const color of MANA_COLORS) {
      if (perColorStrict[color] > 0) {
        recordContributor(contributorsByColor[color], entry.card, qty, perColorStrict[color]);
      }
    }
  }

  return {
    strictPips,
    hybridColored,
    phyrexianColored,
    colorlessPips,
    variableSymbols,
    genericPips,
    analyzedSpells,
    excludedNoCost,
    contributors: {
      W: sortContributors(contributorsByColor.W),
      U: sortContributors(contributorsByColor.U),
      B: sortContributors(contributorsByColor.B),
      R: sortContributors(contributorsByColor.R),
      G: sortContributors(contributorsByColor.G),
    },
  };
}

function recordContributor(
  map: Map<string, ContributorRef>,
  card: Card,
  quantity: number,
  weight: number,
): void {
  map.set(card.oracleId, { cardId: card.oracleId, name: card.name, quantity, weight, card });
}

function sortContributors(map: Map<string, ContributorRef>): ContributorRef[] {
  return [...map.values()].sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
}
