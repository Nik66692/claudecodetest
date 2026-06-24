import type { Deck, DeckSummary } from './types';
import { commanders, commanderColorIdentity, totalCardCount } from './rules';

/** Build a lightweight summary for the deck library list. */
export function toDeckSummary(deck: Deck): DeckSummary {
  const cmdrs = commanders(deck);
  const art = cmdrs[0]?.card.printing.images.artCrop;
  return {
    id: deck.id,
    name: deck.name,
    commanderNames: cmdrs.map((c) => c.card.name),
    ...(art ? { commanderArt: art } : {}),
    cardCount: totalCardCount(deck),
    colorIdentity: commanderColorIdentity(deck),
    updatedAt: deck.updatedAt,
  };
}
