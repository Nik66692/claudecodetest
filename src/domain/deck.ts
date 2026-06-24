import type { Card, Deck, DeckCard, DeckCategory, DeckImportResult, DeckSection } from './types';
import { generateId } from './id';
import { defaultView, SCHEMA_VERSION } from './view';
import { maxCopies, commanders } from './rules';

interface CreateDeckOptions {
  name?: string;
  now?: number;
  id?: string;
}

export function createDeck(options: CreateDeckOptions = {}): Deck {
  const now = options.now ?? Date.now();
  return {
    id: options.id ?? generateId(),
    name: options.name?.trim() || 'Untitled deck',
    description: '',
    format: 'commander',
    cards: [],
    categories: [],
    view: defaultView(),
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
  };
}

function touch(deck: Deck, now = Date.now()): Deck {
  return { ...deck, updatedAt: now };
}

export function renameDeck(deck: Deck, name: string, now?: number): Deck {
  return touch({ ...deck, name: name.trim() || 'Untitled deck' }, now);
}

export function setDeckDescription(deck: Deck, description: string, now?: number): Deck {
  return touch({ ...deck, description }, now);
}

/** Find a deck card by card id within a section (a card may appear in two sections). */
function findEntry(deck: Deck, cardId: string, section: DeckSection): DeckCard | undefined {
  return deck.cards.find((c) => c.cardId === cardId && c.section === section);
}

export interface AddCardOptions {
  section?: DeckSection;
  quantity?: number;
  categoryId?: string | null;
  now?: number;
}

/**
 * Add copies of a card to a section. Respects the singleton limit: quantity is
 * clamped to {@link maxCopies}. If the card already exists in the section, the
 * quantities are merged (and re-clamped).
 */
export function addCard(deck: Deck, card: Card, options: AddCardOptions = {}): Deck {
  const section = options.section ?? 'main';
  const requested = options.quantity ?? 1;
  const limit = maxCopies(card);
  const existing = findEntry(deck, card.oracleId, section);

  let cards: DeckCard[];
  if (existing) {
    const nextQty = Math.min(existing.quantity + requested, limit);
    cards = deck.cards.map((c) => (c === existing ? { ...c, quantity: nextQty } : c));
  } else {
    const entry: DeckCard = {
      cardId: card.oracleId,
      card,
      quantity: Math.min(requested, limit),
      section,
      categoryId: options.categoryId ?? null,
      addedAt: options.now ?? Date.now(),
    };
    cards = [...deck.cards, entry];
  }
  return touch({ ...deck, cards }, options.now);
}

export function removeCard(deck: Deck, cardId: string, section: DeckSection, now?: number): Deck {
  const cards = deck.cards.filter((c) => !(c.cardId === cardId && c.section === section));
  if (cards.length === deck.cards.length) return deck;
  return touch({ ...deck, cards }, now);
}

/** Set an exact quantity. Removes the entry at quantity <= 0. Clamps to the singleton limit. */
export function setCardQuantity(
  deck: Deck,
  cardId: string,
  section: DeckSection,
  quantity: number,
  now?: number,
): Deck {
  const entry = findEntry(deck, cardId, section);
  if (!entry) return deck;
  if (quantity <= 0) return removeCard(deck, cardId, section, now);
  const clamped = Math.min(quantity, maxCopies(entry.card));
  const cards = deck.cards.map((c) => (c === entry ? { ...c, quantity: clamped } : c));
  return touch({ ...deck, cards }, now);
}

export function moveCardToSection(
  deck: Deck,
  cardId: string,
  from: DeckSection,
  to: DeckSection,
  now?: number,
): Deck {
  const entry = findEntry(deck, cardId, from);
  if (!entry || from === to) return deck;
  const withoutSource = deck.cards.filter((c) => c !== entry);
  const target = withoutSource.find((c) => c.cardId === cardId && c.section === to);
  let cards: DeckCard[];
  if (target) {
    const merged = Math.min(target.quantity + entry.quantity, maxCopies(entry.card));
    cards = withoutSource.map((c) => (c === target ? { ...c, quantity: merged } : c));
  } else {
    cards = [...withoutSource, { ...entry, section: to }];
  }
  return touch({ ...deck, cards }, now);
}

export function setCardCategory(
  deck: Deck,
  cardId: string,
  section: DeckSection,
  categoryId: string | null,
  now?: number,
): Deck {
  const cards = deck.cards.map((c) =>
    c.cardId === cardId && c.section === section ? { ...c, categoryId } : c,
  );
  return touch({ ...deck, cards }, now);
}

/**
 * Set (or clear) the deck's commander. Moves any existing commander back to the
 * main deck and places `card` in the commander section. Passing `null` clears
 * all commanders. Supports adding a second commander via `additive` (partners).
 */
export function setCommander(
  deck: Deck,
  card: Card | null,
  options: { additive?: boolean; now?: number } = {},
): Deck {
  const now = options.now;
  if (card === null) {
    // Demote all commanders to the main deck.
    const cards = deck.cards.map((c) =>
      c.section === 'commander' ? { ...c, section: 'main' as DeckSection } : c,
    );
    return touch({ ...deck, cards }, now);
  }

  let working = deck;
  if (!options.additive) {
    working = {
      ...deck,
      cards: deck.cards.map((c) =>
        c.section === 'commander' ? { ...c, section: 'main' as DeckSection } : c,
      ),
    };
  }
  // Remove any existing copy of the chosen card from other sections first.
  working = {
    ...working,
    cards: working.cards.filter((c) => c.cardId !== card.oracleId),
  };
  const addOptions: AddCardOptions = { section: 'commander', quantity: 1 };
  if (now !== undefined) addOptions.now = now;
  return addCard(working, card, addOptions);
}

// --- Categories ------------------------------------------------------------

export function addCategory(deck: Deck, name: string, now?: number): { deck: Deck; id: string } {
  const id = generateId();
  const order = deck.categories.length;
  const category: DeckCategory = { id, name: name.trim() || 'New category', order };
  return { deck: touch({ ...deck, categories: [...deck.categories, category] }, now), id };
}

export function renameCategory(deck: Deck, id: string, name: string, now?: number): Deck {
  const categories = deck.categories.map((c) =>
    c.id === id ? { ...c, name: name.trim() || c.name } : c,
  );
  return touch({ ...deck, categories }, now);
}

export function removeCategory(deck: Deck, id: string, now?: number): Deck {
  const categories = deck.categories.filter((c) => c.id !== id);
  // Uncategorize cards that referenced the removed category.
  const cards = deck.cards.map((c) => (c.categoryId === id ? { ...c, categoryId: null } : c));
  return touch({ ...deck, categories, cards }, now);
}

export type ImportApplyMode = 'append' | 'replace';

/**
 * Apply a {@link DeckImportResult} to a deck. In `replace` mode the existing
 * cards are cleared first (categories, name and view are preserved). In
 * `append` mode recognized cards are merged into the current deck. Only
 * recognized cards are applied; singleton limits are enforced by {@link addCard}.
 */
export function applyImportResult(
  deck: Deck,
  result: DeckImportResult,
  mode: ImportApplyMode,
  now = Date.now(),
): Deck {
  let base: Deck = mode === 'replace' ? { ...deck, cards: [] } : deck;
  for (const entry of result.recognized) {
    const { card, line } = entry;
    if (line.section === 'commander' && card.canBeCommander) {
      base = setCommander(base, card, { additive: commanders(base).length > 0, now });
    } else {
      const section: DeckSection = line.section === 'commander' ? 'main' : line.section;
      base = addCard(base, card, { section, quantity: line.quantity, now });
    }
  }
  return touch(base, now);
}

/** Duplicate a deck, generating a fresh id and "(copy)" name. */
export function duplicateDeck(deck: Deck, now = Date.now()): Deck {
  return {
    ...structuredCloneSafe(deck),
    id: generateId(),
    name: `${deck.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
}

function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}
