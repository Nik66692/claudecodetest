import type { Card, CardImages, ManaColor } from '@/domain/types';
import { MANA_COLORS } from '@/domain/types';
import type { ScryfallCard } from './schema';

function toColors(input: string[] | undefined): ManaColor[] {
  if (!input) return [];
  const set = new Set(input);
  return MANA_COLORS.filter((c) => set.has(c));
}

function toImages(card: ScryfallCard): CardImages {
  const src = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  if (!src) return {};
  const images: CardImages = {};
  if (src.small) images.small = src.small;
  if (src.normal) images.normal = src.normal;
  if (src.large) images.large = src.large;
  if (src.art_crop) images.artCrop = src.art_crop;
  return images;
}

const BASIC_LAND_NAMES = new Set([
  'plains',
  'island',
  'swamp',
  'mountain',
  'forest',
  'wastes',
  'snow-covered plains',
  'snow-covered island',
  'snow-covered swamp',
  'snow-covered mountain',
  'snow-covered forest',
]);

/** Cards whose oracle text overrides the singleton rule. */
function isUnlimitedQuantity(card: ScryfallCard): boolean {
  if (BASIC_LAND_NAMES.has(card.name.toLowerCase())) return true;
  const text = (
    card.oracle_text ??
    card.card_faces?.map((f) => f.oracle_text).join('\n') ??
    ''
  ).toLowerCase();
  return text.includes('a deck can have any number of cards named');
}

function canBeCommander(card: ScryfallCard): boolean {
  const typeLine = card.type_line ?? '';
  const isLegendaryCreature =
    typeLine.includes('Legendary') &&
    (typeLine.includes('Creature') || typeLine.includes('Background'));
  const text = (
    card.oracle_text ??
    card.card_faces?.map((f) => f.oracle_text).join('\n') ??
    ''
  ).toLowerCase();
  return isLegendaryCreature || text.includes('can be your commander');
}

/**
 * Map a validated Scryfall card into the normalized application {@link Card}.
 * Front-face data is preferred for double-faced cards. The mapper never reaches
 * the network; it is a pure transform and is unit-tested in isolation.
 */
export function mapScryfallCard(card: ScryfallCard): Card {
  const front = card.card_faces?.[0];
  const manaCost = card.mana_cost ?? front?.mana_cost ?? null;
  const typeLine = card.type_line ?? front?.type_line ?? '';
  const oracleText = card.oracle_text ?? front?.oracle_text ?? '';

  return {
    oracleId: card.oracle_id ?? card.id,
    name: card.name,
    manaCost: manaCost === '' ? null : manaCost,
    manaValue: card.cmc ?? 0,
    typeLine,
    oracleText,
    colors: toColors(card.colors ?? front?.colors),
    colorIdentity: toColors(card.color_identity),
    canBeCommander: canBeCommander(card),
    unlimitedQuantity: isUnlimitedQuantity(card),
    commanderLegal: (card.legalities?.commander ?? 'legal') === 'legal',
    printing: {
      scryfallId: card.id,
      set: card.set,
      setName: card.set_name ?? card.set.toUpperCase(),
      collectorNumber: card.collector_number,
      rarity: card.rarity ?? 'common',
      images: toImages(card),
      scryfallUri:
        card.scryfall_uri ?? `https://scryfall.com/card/${card.set}/${card.collector_number}`,
    },
  };
}
