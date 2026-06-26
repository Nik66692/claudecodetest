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
 * MTGO-style export. MTGO has no native commander section, so the deck is a flat
 * list of `quantity name` rows with a blank line before the sideboard/maybeboard.
 *
 * Section boundaries are written as standalone `// …` comment lines, which strict
 * MTGO consumers ignore (they read only the card rows) but which Manabase's
 * importer understands as section headers. Critically, every card row is a valid
 * `quantity name` line — the commander name is NOT annotated inline (the previous
 * `name // Commander` form made the commander unrecognizable on re-import and
 * collided with split-card names such as `Fire // Ice`).
 */
export function exportMtgo(deck: Deck): string {
  const out: string[] = [];
  const commander = section(deck, 'commander');
  const main = section(deck, 'main');
  const maybe = section(deck, 'maybeboard');

  if (commander.length) {
    out.push('// Commander');
    out.push(...commander.map(line));
    out.push('');
    // After a commander block, mark where the main deck resumes so the importer
    // switches back out of the commander section.
    out.push('// Deck');
  }
  out.push(...main.map(line));

  if (maybe.length) {
    out.push('');
    out.push('// Sideboard');
    out.push(...maybe.map(line));
  }
  return out.join('\n').trim() + '\n';
}

export function exportDeck(deck: Deck, format: DeckExportFormat): string {
  return format === 'mtgo' ? exportMtgo(deck) : exportText(deck);
}
