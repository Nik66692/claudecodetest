import { z } from 'zod';
import { MANA_COLORS } from '@/domain/types';

/**
 * Zod schemas describing the persisted (IndexedDB) shape of a deck. Persisted
 * data is validated through these schemas before it is handed to the
 * application, so corrupted or outdated records are detected instead of
 * crashing the editor.
 *
 * The persisted shape mirrors the domain {@link Deck}. When the domain model
 * changes in a way that affects storage, bump {@link PERSISTENCE_SCHEMA_VERSION}
 * and add a migration in `db.ts`.
 */

export const PERSISTENCE_SCHEMA_VERSION = 2;

const manaColorSchema = z
  .enum(['W', 'U', 'B', 'R', 'G'] as [string, ...string[]])
  .refine((c): c is (typeof MANA_COLORS)[number] => (MANA_COLORS as readonly string[]).includes(c));

const producedManaSchema = z.enum(['W', 'U', 'B', 'R', 'G', 'C'] as [string, ...string[]]);

const cardImagesSchema = z
  .object({
    small: z.string().optional(),
    normal: z.string().optional(),
    large: z.string().optional(),
    artCrop: z.string().optional(),
  })
  .strip();

const cardPrintingSchema = z.object({
  scryfallId: z.string(),
  set: z.string(),
  setName: z.string(),
  collectorNumber: z.string(),
  rarity: z.string(),
  images: cardImagesSchema,
  scryfallUri: z.string(),
});

const cardSchema = z.object({
  oracleId: z.string(),
  name: z.string(),
  manaCost: z.string().nullable(),
  manaValue: z.number(),
  typeLine: z.string(),
  oracleText: z.string(),
  colors: z.array(manaColorSchema),
  colorIdentity: z.array(manaColorSchema),
  canBeCommander: z.boolean(),
  unlimitedQuantity: z.boolean(),
  commanderLegal: z.boolean(),
  // Phase 2 production metadata. Legacy (v1) snapshots lack these; the defaults
  // mark them as "production unknown / incomplete" rather than "produces nothing"
  // so they are flagged for refresh instead of being silently misclassified.
  produces: z.array(producedManaSchema).default([]),
  productionDataComplete: z.boolean().default(false),
  printing: cardPrintingSchema,
});

const deckSectionSchema = z.enum(['commander', 'main', 'maybeboard']);

const deckCardSchema = z.object({
  cardId: z.string(),
  card: cardSchema,
  quantity: z.number().int().positive(),
  section: deckSectionSchema,
  categoryId: z.string().nullable(),
  addedAt: z.number(),
});

const deckCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  order: z.number(),
});

const deckFiltersSchema = z.object({
  text: z.string(),
  colors: z.array(manaColorSchema),
  includeColorless: z.boolean(),
  type: z.string(),
  manaValueMin: z.number().nullable(),
  manaValueMax: z.number().nullable(),
  categoryId: z.string().nullable(),
});

const deckViewSchema = z.object({
  sort: z.enum(['name', 'manaValue', 'color', 'type', 'quantity', 'dateAdded']),
  sortDirection: z.enum(['asc', 'desc']),
  groupBy: z.enum(['none', 'category', 'type', 'manaValue', 'colorIdentity', 'section']),
  layout: z.enum(['compact', 'detailed', 'grid']),
  filters: deckFiltersSchema,
});

export const persistedDeckSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  format: z.literal('commander'),
  cards: z.array(deckCardSchema),
  categories: z.array(deckCategorySchema),
  view: deckViewSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
  schemaVersion: z.number(),
});

export type PersistedDeck = z.infer<typeof persistedDeckSchema>;
