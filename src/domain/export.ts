import type { Deck, DeckCard, DeckExportFormat } from './types';
import { sortDeckCards } from './sort';

function line(entry: DeckCard): string {
  return `${entry.quantity} ${entry.card.name}`;
}

function section(deck: Deck, s: DeckCard['section']): DeckCard[] {
  return sortDeckCards(
    deck.cards.filter((c) => c.section === s),
    'name',
    'asc',
  );
}

/**
 * Plain-text export. Uses explicit section headers so the result re-imports
 * losslessly through {@link parseDeckList}.
 */
export function exportText(deck: Deck): string {
  const out: string[] = [];
  const commander = section(deck, 'commander');
  const main = section(deck, 'main');
  const maybe = section(deck, 'maybeboard');

  if (commander.length) {
    out.push('Commander');
    out.push(...commander.map(line));
    out.push('');
  }
  out.push('Deck');
  out.push(...main.map(line));
  if (maybe.length) {
    out.push('');
    out.push('Maybeboard');
    out.push(...maybe.map(line));
  }
  return out.join('\n').trim() + '\n';
}

/**
 * MTGO-style export: a flat main list, a blank line, then the maybeboard/
 * sideboard. The commander is included in the main list because MTGO has no
 * commander concept; it is also annotated with a leading comment for clarity.
 */
export function exportMtgo(deck: Deck): string {
  const out: string[] = [];
  const commander = section(deck, 'commander');
  const main = section(deck, 'main');
  const maybe = section(deck, 'maybeboard');

  if (commander.length) {
    out.push(...commander.map((c) => `${line(c)} // Commander`));
  }
  out.push(...main.map(line));

  if (maybe.length) {
    out.push('');
    out.push(...maybe.map(line));
  }
  return out.join('\n').trim() + '\n';
}

export function exportDeck(deck: Deck, format: DeckExportFormat): string {
  return format === 'mtgo' ? exportMtgo(deck) : exportText(deck);
}
