# Manabase — Domain Model

This document defines the application-domain concepts. The authoritative types
live in [`src/domain/types.ts`](../src/domain/types.ts); this file explains them.

**Key principle:** application-domain objects are kept **separate from raw
Scryfall responses**. Scryfall's shape is defined and validated in
`src/scryfall/schema.ts` (`ScryfallCard`) and mapped into the domain `Card` by
`src/scryfall/mapper.ts`. Nothing outside `src/scryfall` depends on Scryfall's
structure.

## Card

Oracle-level, normalized card used everywhere in the app.

```ts
interface Card {
  oracleId: string; // stable across printings
  name: string;
  manaCost: string | null; // e.g. "{2}{G}", null if no cost
  manaValue: number; // converted mana cost
  typeLine: string;
  oracleText: string;
  colors: ManaColor[];
  colorIdentity: ManaColor[];
  canBeCommander: boolean; // legendary creature / "can be your commander"
  unlimitedQuantity: boolean; // basics + "any number of cards named …"
  commanderLegal: boolean;
  produces: ProducedMana[]; // colors/colorless from Scryfall `produced_mana`
  productionDataComplete: boolean; // false for pre-Phase-2 snapshots (unknown ≠ none)
  printing: CardPrinting; // one default printing
}

type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G';
type ProducedMana = ManaColor | 'C';
```

`produces` is a **"can produce" signal only**, taken from Scryfall's structured
`produced_mana`. An empty array means the snapshot was captured and the card adds
no mana; that is distinct from `productionDataComplete: false`, which means the
snapshot predates Phase 2 and production is **unknown** (offer "Refresh card
data"). `produces` carries no information about quantity, reliability, timing, or
activation conditions.

## CardPrinting

Printing-specific data, separated from oracle identity so alternate-printing
selection can be added later without reshaping `Card`.

```ts
interface CardPrinting {
  scryfallId: string;
  set: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  images: CardImages; // small / normal / large / artCrop
  scryfallUri: string;
}
```

## Commander

A commander is **not** a distinct stored type; it is represented as a
`DeckCard` in the `commander` section. A card is eligible when
`Card.canBeCommander` is true. Partner pairs are supported as two cards in the
commander section, and the deck's color identity is the union of all commanders'
color identities (`commanderColorIdentity` in `rules.ts`).

## Deck

```ts
interface Deck {
  id: string;
  name: string;
  description: string;
  format: 'commander';
  cards: DeckCard[];
  categories: DeckCategory[];
  view: DeckView;
  createdAt: number;
  updatedAt: number;
  schemaVersion: number; // persisted schema version
}
```

A lightweight `DeckSummary` (id, name, commander names, commander art, card
count, color identity, updatedAt) is derived for the library list.

## DeckCard

A card entry inside a deck. Holds a **snapshot** of the card so opened decks
render offline without re-fetching.

```ts
interface DeckCard {
  cardId: string; // === Card.oracleId; unique per section
  card: Card;
  quantity: number;
  section: DeckSection;
  categoryId: string | null; // custom category, or uncategorized
  addedAt: number;
}
```

## DeckCategory

User-defined grouping bucket, editable and saved with the deck.

```ts
interface DeckCategory {
  id: string;
  name: string;
  color?: string;
  order: number;
}
```

## DeckSection

```ts
type DeckSection = 'commander' | 'main' | 'maybeboard';
```

`commander` and `main` count toward the 100-card deck total; `maybeboard` does
not.

## DeckView

The combination of independent display concerns — **sorting, grouping,
filtering, and visualization are separate concepts**.

```ts
interface DeckView {
  sort: SortKey; // name | manaValue | color | type | quantity | dateAdded
  sortDirection: 'asc' | 'desc';
  groupBy: GroupKey; // none | category | type | manaValue | colorIdentity | section
  layout: LayoutMode; // compact | detailed | grid
  filters: DeckFilters; // text, colors, includeColorless, type, MV range, category
}
```

## DeckImportResult

Produced by parsing a list (`parseDeckList`) and resolving names
(`buildImportResult`). Entries are **never silently discarded**.

```ts
interface ParsedDeckLine {
  raw: string;
  quantity: number;
  name: string;
  section: DeckSection;
}

interface DeckImportResult {
  recognized: { line: ParsedDeckLine; card: Card }[];
  unrecognized: ParsedDeckLine[]; // parsed but no card matched
  unparseable: string[]; // could not be parsed at all
  totalRequested: number;
}
```

## DeckExportFormat

```ts
type DeckExportFormat = 'text' | 'mtgo';
```

- `text` — section headers (`Commander` / `Deck` / `Maybeboard`) + `qty name`
  lines; re-imports losslessly through `parseDeckList`.
- `mtgo` — a flat list of valid `qty name` rows. MTGO has no native commander
  section, so sections are written as standalone `// Commander` / `// Deck` /
  `// Sideboard` comment lines (ignored by strict MTGO consumers, read as headers
  by `parseDeckList`). Card names are never annotated inline, so the export
  re-imports without mangling commander names or split-card names (`Fire // Ice`).

## ScryfallCard (raw external type)

Defined and validated in `src/scryfall/schema.ts` with Zod. This is the **raw**
API shape (snake_case, optional fields, `card_faces`, `legalities`,
`produced_mana`, …). It is intentionally lenient (unknown fields ignored) and is
mapped to `Card` by `mapScryfallCard`. No other layer references it.

## Analysis types (Phase 2)

Pure, deterministic types in `src/domain/analysis/` consumed by the Analysis UI;
nothing here is persisted (all derived on demand):

- `ManaSymbol` — a classified mana-cost symbol (`generic`, `colored`,
  `colorless`, `hybrid`, `hybrid-generic`, `phyrexian`, `variable`, `snow`,
  `unknown`). Special symbols are never collapsed into strict colored pips.
- `ManaCurve` — 0–6 and 7+ buckets with counts, percentages, average, and
  per-bucket card drill-down.
- `ManaDemand` — strict pips vs hybrid/Phyrexian/colorless/variable, with
  per-color contributors.
- `ManaProduction` — land/non-land source counts per color (non-additive),
  incomplete-metadata count, and contributors.
- `DemandVsProduction` — per-color strict demand vs recognized sources, plus a
  single labeled `sourcesPerStrictPip` heuristic.

## Persisted schema versions

- `PERSISTENCE_SCHEMA_VERSION` (currently **2**) — the version of the persisted
  deck shape, stored on each deck as `schemaVersion` and validated on read via
  `persistedDeckSchema`. v2 added `produces` / `productionDataComplete` to each
  card snapshot.
- Dexie store versions are declared in `src/persistence/db.ts`. The `version(2)`
  migration backfills the new fields on existing snapshots (legacy cards →
  `productionDataComplete: false`, i.e. _unknown_, never "produces nothing") and
  bumps each deck's `schemaVersion`. Future migrations add new
  `version(n).upgrade(...)` blocks; existing blocks are never modified.

## Modeled rules (limited, by design)

Implemented in `src/domain/rules.ts` — **not** a full rules engine:

- **Singleton:** at most one copy of any card except basics and cards flagged
  `unlimitedQuantity`. Enforced by `maxCopies` and clamped in deck mutations.
- **Color identity:** non-commander cards should be within the combined commander
  color identity; violations are reported as **warnings**, not hard-enforced.
- **Deck size:** a legal deck is exactly 100 cards (commander + main); reported as
  an **informational estimate**.
