import { describe, it, expect } from 'vitest';
import { parseManaSymbols } from './manaSymbols';

describe('parseManaSymbols', () => {
  it('parses repeated and generic symbols: {2}{G}{G}', () => {
    const symbols = parseManaSymbols('{2}{G}{G}');
    expect(symbols.map((s) => s.kind)).toEqual(['generic', 'colored', 'colored']);
    expect(symbols[0]).toMatchObject({ kind: 'generic', generic: 2 });
    expect(symbols[1]).toMatchObject({ kind: 'colored', colors: ['G'] });
    expect(symbols[2]).toMatchObject({ kind: 'colored', colors: ['G'] });
  });

  it('parses a mono-hybrid symbol as flexible across two colors: {W/U}', () => {
    const [sym] = parseManaSymbols('{W/U}');
    expect(sym).toMatchObject({ kind: 'hybrid', colors: ['W', 'U'] });
  });

  it('parses a two-brid symbol with its generic alternative: {2/W}', () => {
    const [sym] = parseManaSymbols('{2/W}');
    expect(sym).toMatchObject({ kind: 'hybrid-generic', colors: ['W'], generic: 2 });
  });

  it('parses a Phyrexian symbol without treating it as a strict colored pip: {W/P}', () => {
    const [sym] = parseManaSymbols('{W/P}');
    expect(sym).toMatchObject({ kind: 'phyrexian', colors: ['W'] });
  });

  it('parses an explicit colorless requirement: {C}', () => {
    const [sym] = parseManaSymbols('{C}');
    expect(sym).toMatchObject({ kind: 'colorless', colors: [] });
  });

  it('parses a variable symbol alongside a colored pip: {X}{R}', () => {
    const symbols = parseManaSymbols('{X}{R}');
    expect(symbols.map((s) => s.kind)).toEqual(['variable', 'colored']);
    expect(symbols[1]).toMatchObject({ colors: ['R'] });
  });

  it('returns no symbols for null/empty costs', () => {
    expect(parseManaSymbols(null)).toEqual([]);
    expect(parseManaSymbols('')).toEqual([]);
    expect(parseManaSymbols('no braces here')).toEqual([]);
  });

  it('classifies malformed tokens as unknown rather than misreading them', () => {
    const [sym] = parseManaSymbols('{??}');
    expect(sym?.kind).toBe('unknown');
    expect(sym?.colors).toEqual([]);
  });
});
