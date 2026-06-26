import type { Card, ManaColor, ProducedMana } from '@/domain/types';

let counter = 0;

export interface CardOverrides {
  oracleId?: string;
  name?: string;
  manaCost?: string | null;
  manaValue?: number;
  typeLine?: string;
  oracleText?: string;
  colors?: ManaColor[];
  colorIdentity?: ManaColor[];
  canBeCommander?: boolean;
  unlimitedQuantity?: boolean;
  commanderLegal?: boolean;
  produces?: ProducedMana[];
  productionDataComplete?: boolean;
}

/** Build a fully-formed domain Card for tests with sensible defaults. */
export function makeCard(overrides: CardOverrides = {}): Card {
  counter += 1;
  const oracleId = overrides.oracleId ?? `oracle-${counter}`;
  const name = overrides.name ?? `Test Card ${counter}`;
  return {
    oracleId,
    name,
    manaCost: overrides.manaCost ?? '{1}{G}',
    manaValue: overrides.manaValue ?? 2,
    typeLine: overrides.typeLine ?? 'Creature — Elf',
    oracleText: overrides.oracleText ?? '',
    colors: overrides.colors ?? ['G'],
    colorIdentity: overrides.colorIdentity ?? ['G'],
    canBeCommander: overrides.canBeCommander ?? false,
    unlimitedQuantity: overrides.unlimitedQuantity ?? false,
    commanderLegal: overrides.commanderLegal ?? true,
    produces: overrides.produces ?? [],
    productionDataComplete: overrides.productionDataComplete ?? true,
    printing: {
      scryfallId: `scry-${counter}`,
      set: 'tst',
      setName: 'Test Set',
      collectorNumber: String(counter),
      rarity: 'common',
      images: {
        small: `https://img.test/${oracleId}/small.jpg`,
        normal: `https://img.test/${oracleId}/normal.jpg`,
        artCrop: `https://img.test/${oracleId}/art.jpg`,
      },
      scryfallUri: `https://scryfall.test/${oracleId}`,
    },
  };
}

export const basicForest = (): Card =>
  makeCard({
    oracleId: 'forest',
    name: 'Forest',
    manaCost: null,
    manaValue: 0,
    typeLine: 'Basic Land — Forest',
    colors: [],
    colorIdentity: ['G'],
    unlimitedQuantity: true,
    produces: ['G'],
  });

export const azusaCommander = (): Card =>
  makeCard({
    oracleId: 'azusa',
    name: 'Azusa, Lost but Seeking',
    manaCost: '{2}{G}',
    manaValue: 3,
    typeLine: 'Legendary Creature — Human Monk',
    colors: ['G'],
    colorIdentity: ['G'],
    canBeCommander: true,
  });
