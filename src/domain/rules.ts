import type { Card, Deck, DeckCard, ManaColor } from './types';
import { combineColorIdentity, isWithinColorIdentity } from './colors';

/**
 * Commander deck rules implemented in this milestone.
 *
 * Scope and assumptions (intentionally limited — this is NOT a full rules
 * engine):
 *  - Singleton: at most one copy of any card except basic lands and cards whose
 *    text overrides the rule (flagged on the card as `unlimitedQuantity`).
 *  - Color identity: every card's color identity should be a subset of the
 *    combined commander color identity. Violations are reported as warnings,
 *    not hard-enforced, because edge cases (e.g. companions, background) are not
 *    modeled here.
 *  - Deck size: a legal Commander deck has exactly 100 cards including the
 *    commander(s). This is surfaced as informational, not enforced.
 */

export const COMMANDER_DECK_SIZE = 100;

/** Maximum copies allowed for a card in a Commander deck. */
export function maxCopies(card: Card): number {
  return card.unlimitedQuantity ? Number.POSITIVE_INFINITY : 1;
}

/** Cards in the commander section. Supports 0, 1 (typical) or 2 (partners). */
export function commanders(deck: Deck): DeckCard[] {
  return deck.cards.filter((c) => c.section === 'commander');
}

/** Cards counted toward the 100-card deck total (commander + main, not maybeboard). */
export function deckCountedCards(deck: Deck): DeckCard[] {
  return deck.cards.filter((c) => c.section === 'commander' || c.section === 'main');
}

/** Total copies in a section. */
export function sectionCount(deck: Deck, section: DeckCard['section']): number {
  return deck.cards.filter((c) => c.section === section).reduce((sum, c) => sum + c.quantity, 0);
}

/** Total copies counted toward deck size (commander + main). */
export function totalCardCount(deck: Deck): number {
  return deckCountedCards(deck).reduce((sum, c) => sum + c.quantity, 0);
}

/** Combined color identity of all commanders in the deck (WUBRG order). */
export function commanderColorIdentity(deck: Deck): ManaColor[] {
  return combineColorIdentity(...commanders(deck).map((c) => c.card.colorIdentity));
}

export type RuleViolationKind =
  | 'too-many-copies'
  | 'out-of-color-identity'
  | 'missing-commander'
  | 'deck-size';

export interface RuleViolation {
  kind: RuleViolationKind;
  /** Card id when the violation refers to a specific card. */
  cardId?: string;
  message: string;
}

/**
 * Validate a deck against the limited rule set above. Every message is phrased
 * as a labelled warning; this function never throws and never mutates the deck.
 */
export function validateDeck(deck: Deck): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const cmdrs = commanders(deck);

  if (cmdrs.length === 0) {
    violations.push({
      kind: 'missing-commander',
      message: 'No commander selected. A Commander deck needs a legendary commander.',
    });
  }

  for (const entry of deck.cards) {
    const limit = maxCopies(entry.card);
    if (entry.quantity > limit) {
      violations.push({
        kind: 'too-many-copies',
        cardId: entry.cardId,
        message: `${entry.card.name}: ${entry.quantity} copies exceed the singleton limit of ${limit}.`,
      });
    }
  }

  if (cmdrs.length > 0) {
    const identity = commanderColorIdentity(deck);
    for (const entry of deck.cards) {
      if (entry.section === 'commander') continue;
      if (!isWithinColorIdentity(entry.card.colorIdentity, identity)) {
        violations.push({
          kind: 'out-of-color-identity',
          cardId: entry.cardId,
          message: `${entry.card.name} is outside the commander color identity.`,
        });
      }
    }
  }

  const total = totalCardCount(deck);
  if (total !== COMMANDER_DECK_SIZE) {
    violations.push({
      kind: 'deck-size',
      message: `Deck has ${total} of ${COMMANDER_DECK_SIZE} cards (estimate; counts commander + main deck).`,
    });
  }

  return violations;
}

/** Whether a card is eligible to be selected as this deck's commander. */
export function canCardBeCommander(card: Card): boolean {
  return card.canBeCommander;
}
