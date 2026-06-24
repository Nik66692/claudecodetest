import type { ManaColor } from './types';
import { MANA_COLORS } from './types';

const COLOR_ORDER: Record<ManaColor, number> = { W: 0, U: 1, B: 2, R: 3, G: 4 };

export const COLOR_LABELS: Record<ManaColor, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
};

/** Sort colors into the canonical WUBRG order. */
export function sortColors(colors: ManaColor[]): ManaColor[] {
  return [...colors].sort((a, b) => COLOR_ORDER[a] - COLOR_ORDER[b]);
}

/**
 * Canonical guild / shard / wedge naming for common color-identity combinations.
 * Returns `Colorless` for empty identity and a generic label for uncommon sets.
 */
export function colorIdentityLabel(colors: ManaColor[]): string {
  const sorted = sortColors(colors);
  const key = sorted.join('');
  const named: Record<string, string> = {
    '': 'Colorless',
    W: 'Mono-White',
    U: 'Mono-Blue',
    B: 'Mono-Black',
    R: 'Mono-Red',
    G: 'Mono-Green',
    WU: 'Azorius',
    UB: 'Dimir',
    BR: 'Rakdos',
    RG: 'Gruul',
    WG: 'Selesnya',
    WB: 'Orzhov',
    UR: 'Izzet',
    BG: 'Golgari',
    WR: 'Boros',
    UG: 'Simic',
    WUB: 'Esper',
    UBR: 'Grixis',
    BRG: 'Jund',
    WRG: 'Naya',
    WUG: 'Bant',
    WUR: 'Jeskai',
    UBG: 'Sultai',
    WBR: 'Mardu',
    URG: 'Temur',
    WBG: 'Abzan',
    WUBR: 'Yore-Tiller',
    UBRG: 'Glint-Eye',
    WBRG: 'Dune-Brood',
    WURG: 'Ink-Treader',
    WUBG: 'Witch-Maw',
    WUBRG: 'Five-Color',
  };
  return named[key] ?? `${sorted.length}-Color`;
}

/** True when `identity` is a subset of `commanderIdentity` (Commander color-identity rule). */
export function isWithinColorIdentity(
  identity: ManaColor[],
  commanderIdentity: ManaColor[],
): boolean {
  return identity.every((c) => commanderIdentity.includes(c));
}

/** Union of color identities, returned in WUBRG order. */
export function combineColorIdentity(...identities: ManaColor[][]): ManaColor[] {
  const set = new Set<ManaColor>();
  for (const id of identities) for (const c of id) set.add(c);
  return MANA_COLORS.filter((c) => set.has(c));
}
