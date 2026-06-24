import { z } from 'zod';

/**
 * Zod schemas for the subset of the Scryfall API this milestone consumes.
 * Schemas are intentionally lenient: unknown fields are ignored so that
 * additive Scryfall changes do not break parsing. Only the fields we map into
 * the domain are validated.
 *
 * Scryfall data ©Wizards of the Coast. This app uses the Scryfall API under
 * its terms of service and is not endorsed by Scryfall or Wizards of the Coast.
 */

export const scryfallImageUrisSchema = z
  .object({
    small: z.string().url().optional(),
    normal: z.string().url().optional(),
    large: z.string().url().optional(),
    art_crop: z.string().url().optional(),
    png: z.string().url().optional(),
  })
  .partial();

export const scryfallCardFaceSchema = z.object({
  name: z.string(),
  mana_cost: z.string().optional(),
  type_line: z.string().optional(),
  oracle_text: z.string().optional(),
  colors: z.array(z.string()).optional(),
  image_uris: scryfallImageUrisSchema.optional(),
});

export const scryfallCardSchema = z.object({
  id: z.string(),
  oracle_id: z.string().optional(),
  name: z.string(),
  mana_cost: z.string().optional(),
  cmc: z.number().optional(),
  type_line: z.string().optional(),
  oracle_text: z.string().optional(),
  colors: z.array(z.string()).optional(),
  color_identity: z.array(z.string()).optional(),
  image_uris: scryfallImageUrisSchema.optional(),
  card_faces: z.array(scryfallCardFaceSchema).optional(),
  set: z.string(),
  set_name: z.string().optional(),
  collector_number: z.string(),
  rarity: z.string().optional(),
  layout: z.string().optional(),
  legalities: z.record(z.string(), z.string()).optional(),
  scryfall_uri: z.string().url().optional(),
});

export type ScryfallCard = z.infer<typeof scryfallCardSchema>;

export const scryfallListSchema = z.object({
  object: z.literal('list'),
  total_cards: z.number().optional(),
  has_more: z.boolean().optional(),
  next_page: z.string().optional(),
  data: z.array(scryfallCardSchema),
  // Collection endpoint returns names it could not find here.
  not_found: z.array(z.unknown()).optional(),
});

export type ScryfallList = z.infer<typeof scryfallListSchema>;

export const scryfallAutocompleteSchema = z.object({
  object: z.literal('catalog'),
  data: z.array(z.string()),
});

export const scryfallErrorSchema = z.object({
  object: z.literal('error'),
  status: z.number(),
  code: z.string(),
  details: z.string(),
});

export type ScryfallApiError = z.infer<typeof scryfallErrorSchema>;
