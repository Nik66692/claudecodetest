import { describe, it, expect } from 'vitest';
import { parseDeckList, buildImportResult, namesToResolve, normalizeCardName } from './import';
import { makeCard } from '@/test/fixtures';

describe('parseDeckList', () => {
  it('parses "quantity name" and "quantityx name" lines', () => {
    const { lines } = parseDeckList('2 Sol Ring\n3x Forest');
    expect(lines).toEqual([
      { raw: '2 Sol Ring', quantity: 2, name: 'Sol Ring', section: 'main' },
      { raw: '3x Forest', quantity: 3, name: 'Forest', section: 'main' },
    ]);
  });

  it('strips set/collector annotations', () => {
    const { lines } = parseDeckList('1 Sol Ring (C21) 263');
    expect(lines[0]?.name).toBe('Sol Ring');
  });

  it('routes section headers and MTGO SB: prefix', () => {
    const text = [
      'Commander',
      '1 Azusa, Lost but Seeking',
      'Deck',
      '1 Sol Ring',
      'SB: 1 Pithing Needle',
    ].join('\n');
    const { lines } = parseDeckList(text);
    expect(lines.find((l) => l.name.startsWith('Azusa'))?.section).toBe('commander');
    expect(lines.find((l) => l.name === 'Sol Ring')?.section).toBe('main');
    expect(lines.find((l) => l.name === 'Pithing Needle')?.section).toBe('maybeboard');
  });

  it('treats a blank line as the maybeboard separator in MTGO lists', () => {
    const { lines } = parseDeckList('1 Sol Ring\n\n1 Pithing Needle');
    expect(lines[0]?.section).toBe('main');
    expect(lines[1]?.section).toBe('maybeboard');
  });

  it('collects unparseable lines instead of dropping them', () => {
    const { lines, unparseable } = parseDeckList(
      '1 Sol Ring\nthis is not a card line\n// a comment',
    );
    expect(lines).toHaveLength(1);
    expect(unparseable).toEqual(['this is not a card line']);
  });

  it('ignores comments', () => {
    const { lines } = parseDeckList('# heading\n// note\n1 Sol Ring');
    expect(lines).toHaveLength(1);
  });
});

describe('buildImportResult', () => {
  it('separates recognized, unrecognized, and counts requested copies', () => {
    const parsed = parseDeckList('10 Forest\n1 Sol Ring\n1 Made Up Card');
    const resolved = new Map([
      [normalizeCardName('Forest'), makeCard({ name: 'Forest' })],
      [normalizeCardName('Sol Ring'), makeCard({ name: 'Sol Ring' })],
    ]);
    const result = buildImportResult(parsed, resolved);
    expect(result.recognized).toHaveLength(2);
    expect(result.unrecognized).toHaveLength(1);
    expect(result.unrecognized[0]?.name).toBe('Made Up Card');
    expect(result.totalRequested).toBe(12);
  });
});

describe('namesToResolve', () => {
  it('returns unique names regardless of case and quantity', () => {
    const parsed = parseDeckList('1 Sol Ring\n1 sol ring\n10 Forest');
    expect(namesToResolve(parsed).sort()).toEqual(['Forest', 'Sol Ring']);
  });
});
