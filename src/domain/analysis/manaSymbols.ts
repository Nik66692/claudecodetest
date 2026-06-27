import type { ManaColor } from '../types';
import { MANA_COLORS } from '../types';

/**
 * Classification of a single mana symbol parsed from a normalized mana-cost
 * string. The kinds are kept deliberately distinct so that special symbols are
 * never silently collapsed into exact colored requirements.
 */
export type ManaSymbolKind =
  | 'generic' // {1}, {2}, …
  | 'variable' // {X}, {Y}, {Z}
  | 'colored' // strict colored pip: {W}
  | 'colorless' // explicit colorless requirement: {C}
  | 'hybrid' // mono-hybrid between two colors: {W/U}
  | 'hybrid-generic' // two-brid (generic or color): {2/W}
  | 'phyrexian' // can be paid with life: {W/P}
  | 'snow' // {S}
  | 'unknown';

export interface ManaSymbol {
  /** The text between the braces, e.g. `W`, `2/W`, `W/P`. */
  raw: string;
  kind: ManaSymbolKind;
  /** Colors referenced by this symbol (for colored / hybrid / phyrexian). */
  colors: ManaColor[];
  /** Generic amount for `generic`, or the generic alternative of a two-brid. */
  generic: number;
}

const COLOR_SET = new Set<string>(MANA_COLORS);

function isColor(token: string): token is ManaColor {
  return COLOR_SET.has(token);
}

function classify(raw: string): ManaSymbol {
  const token = raw.trim().toUpperCase();

  if (/^\d+$/.test(token)) {
    return { raw, kind: 'generic', colors: [], generic: Number.parseInt(token, 10) };
  }
  if (token === 'X' || token === 'Y' || token === 'Z') {
    return { raw, kind: 'variable', colors: [], generic: 0 };
  }
  if (token === 'C') {
    return { raw, kind: 'colorless', colors: [], generic: 0 };
  }
  if (token === 'S') {
    return { raw, kind: 'snow', colors: [], generic: 0 };
  }
  if (isColor(token)) {
    return { raw, kind: 'colored', colors: [token], generic: 0 };
  }

  if (token.includes('/')) {
    const parts = token.split('/');
    const colors = parts.filter(isColor);
    const hasPhyrexian = parts.includes('P');
    const numericPart = parts.find((p) => /^\d+$/.test(p));

    if (hasPhyrexian && colors.length > 0) {
      // {W/P}, and rarely {G/U/P}. Payable with life, so not a strict color need.
      return { raw, kind: 'phyrexian', colors, generic: 0 };
    }
    if (numericPart && colors.length > 0) {
      // {2/W} — pay the generic amount OR one of the colors.
      return { raw, kind: 'hybrid-generic', colors, generic: Number.parseInt(numericPart, 10) };
    }
    if (colors.length >= 2) {
      // {W/U} — pay either color.
      return { raw, kind: 'hybrid', colors, generic: 0 };
    }
  }

  return { raw, kind: 'unknown', colors: [], generic: 0 };
}

/**
 * Tokenize and classify a normalized mana-cost string such as `{2}{G}{G}` into
 * an ordered list of symbols, preserving repeats. Returns an empty array for
 * `null`/empty costs or strings with no `{…}` tokens. Malformed tokens are
 * classified as `unknown` rather than being dropped or misread as colored pips.
 */
export function parseManaSymbols(cost: string | null | undefined): ManaSymbol[] {
  if (!cost) return [];
  const matches = cost.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map((m) => classify(m.slice(1, -1)));
}
