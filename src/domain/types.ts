/**
 * Application-domain types.
 *
 * These types are deliberately decoupled from raw Scryfall responses (see
 * `src/scryfall/schema.ts`). The Scryfall layer maps its responses into these
 * normalized shapes so that the rest of the application never depends on the
 * external API's structure.
 */

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G';

export const MANA_COLORS: readonly ManaColor[] = ['W', 'U', 'B', 'R', 'G'];

/** Image URLs for a specific printing, normalized from Scryfall `image_uris`. */
export interface CardImages {
  small?: string;
  normal?: string;
  large?: string;
  artCrop?: string;
}

/**
 * A specific physical printing of a card. Oracle-level identity lives on
 * {@link Card}; printing-specific data (set, collector number, art) lives here.
 */
export interface CardPrinting {
  scryfallId: string;
  set: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  images: CardImages;
  scryfallUri: string;
}

/**
 * Oracle-level card, normalized from Scryfall. A `Card` carries one default
 * {@link CardPrinting}; alternate-printing selection is deferred to a later
 * milestone.
 */
export interface Card {
  /** Scryfall oracle id — stable across printings of the same card. */
  oracleId: string;
  name: string;
  /** Mana cost string such as `{2}{W}{U}`. `null` for cards with no cost. */
  manaCost: string | null;
  /** Converted mana cost / mana value. */
  manaValue: number;
  typeLine: string;
  oracleText: string;
  colors: ManaColor[];
  colorIdentity: ManaColor[];
  /** True for legendary creatures / cards that can be a Commander. */
  canBeCommander: boolean;
  /**
   * True for cards the Commander rules allow in any quantity (basic lands and
   * cards whose oracle text overrides the singleton rule, e.g. Relentless Rats).
   */
  unlimitedQuantity: boolean;
  commanderLegal: boolean;
  printing: CardPrinting;
}

export type DeckSection = 'commander' | 'main' | 'maybeboard';

export const DECK_SECTIONS: readonly DeckSection[] = ['commander', 'main', 'maybeboard'];

export const DECK_SECTION_LABELS: Record<DeckSection, string> = {
  commander: 'Commander',
  main: 'Main deck',
  maybeboard: 'Maybeboard',
};

/** A user-defined grouping bucket saved with the deck. */
export interface DeckCategory {
  id: string;
  name: string;
  /** Accent color token name or hex; optional cosmetic hint. */
  color?: string;
  order: number;
}

/** A card entry inside a deck. Holds a snapshot of card data for offline use. */
export interface DeckCard {
  /** Oracle id of the referenced card; unique per (section). */
  cardId: string;
  card: Card;
  quantity: number;
  section: DeckSection;
  /** Custom category id, or `null` when uncategorized. */
  categoryId: string | null;
  addedAt: number;
}

export type SortKey = 'name' | 'manaValue' | 'color' | 'type' | 'quantity' | 'dateAdded';
export type SortDirection = 'asc' | 'desc';
export type GroupKey = 'none' | 'category' | 'type' | 'manaValue' | 'colorIdentity' | 'section';
export type LayoutMode = 'compact' | 'detailed' | 'grid';

export interface DeckFilters {
  /** Case-insensitive substring match against card name. */
  text: string;
  /** Cards whose color identity includes at least one of these colors. Empty = all. */
  colors: ManaColor[];
  /** Whether colorless cards should be matched when `colors` is non-empty. */
  includeColorless: boolean;
  /** Case-insensitive substring match against the type line. Empty = all. */
  type: string;
  manaValueMin: number | null;
  manaValueMax: number | null;
  categoryId: string | null;
}

export interface DeckView {
  sort: SortKey;
  sortDirection: SortDirection;
  groupBy: GroupKey;
  layout: LayoutMode;
  filters: DeckFilters;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  format: 'commander';
  cards: DeckCard[];
  categories: DeckCategory[];
  view: DeckView;
  createdAt: number;
  updatedAt: number;
  schemaVersion: number;
}

/** A lightweight deck summary used by the library list. */
export interface DeckSummary {
  id: string;
  name: string;
  commanderNames: string[];
  /** Art-crop URL of the first commander, when available, for the library card. */
  commanderArt?: string;
  cardCount: number;
  colorIdentity: ManaColor[];
  updatedAt: number;
}

// --- Import / export -------------------------------------------------------

export type DeckExportFormat = 'text' | 'mtgo';

export interface ParsedDeckLine {
  raw: string;
  quantity: number;
  name: string;
  section: DeckSection;
}

export interface ResolvedImportEntry {
  line: ParsedDeckLine;
  card: Card;
}

export interface DeckImportResult {
  /** Lines whose names resolved to a real card. */
  recognized: ResolvedImportEntry[];
  /** Lines parsed correctly but whose name did not resolve to a card. */
  unrecognized: ParsedDeckLine[];
  /** Raw lines that could not be parsed into a `quantity name` entry. */
  unparseable: string[];
  /** Total number of card copies requested across all parsed lines. */
  totalRequested: number;
}
