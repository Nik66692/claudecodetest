import type { Card, ManaColor, ProducedMana } from '../types';

/**
 * Pure analysis domain.
 *
 * Every function here is deterministic and side-effect-free. It consumes domain
 * {@link Card}/Deck objects and never imports React, Dexie, browser APIs, or the
 * Scryfall client. Results are derived on demand (not persisted) and always
 * expose their assumptions and any incomplete-data state, because this is a set
 * of honest heuristics — not an exact Magic rules evaluation.
 */

/** A reference to a card contributing to some analysis result. */
export interface ContributorRef {
  cardId: string;
  name: string;
  /** Copies of this card included in the calculation. */
  quantity: number;
  /**
   * The per-copy magnitude of this contribution in the relevant metric (e.g. the
   * number of strict white pips on the card, or 1 for "is a source of white").
   * Total contribution is `quantity * weight`.
   */
  weight: number;
  /** Snapshot card, so the UI can render previews without re-fetching. */
  card: Card;
}

/** Build an empty per-color tally in canonical WUBRG order. */
export function emptyColorTally(): Record<ManaColor, number> {
  return { W: 0, U: 0, B: 0, R: 0, G: 0 };
}

/** Build an empty per-produced-symbol tally (WUBRG + colorless). */
export function emptyProducedTally(): Record<ProducedMana, number> {
  return { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
}

/** True when a card is a land (any land type, including Artifact Lands). */
export function isLand(card: Card): boolean {
  // Type lines list supertypes/types before the em dash; "Land" only appears
  // there for actual lands. No creature/artifact subtype is named "Land".
  return card.typeLine.includes('Land');
}
