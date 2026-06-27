import { describe, it, expect } from 'vitest';
import { exportText, exportMtgo } from './export';
import { createDeck, addCard, setCommander, applyImportResult } from './deck';
import { parseDeckList, buildImportResult, normalizeCardName } from './import';
import { totalCardCount, commanders, sectionCount } from './rules';
import { makeCard, basicForest, azusaCommander } from '@/test/fixtures';

function sampleDeck() {
  let deck = createDeck({ name: 'Sample' });
  deck = setCommander(deck, azusaCommander());
  deck = addCard(deck, basicForest(), { quantity: 5 });
  deck = addCard(deck, makeCard({ name: 'Sol Ring', oracleId: 'sol', typeLine: 'Artifact' }));
  deck = addCard(deck, makeCard({ name: 'Sideboard Card', oracleId: 'sb' }), {
    section: 'maybeboard',
  });
  return deck;
}

describe('exportText', () => {
  it('writes section headers and quantities', () => {
    const text = exportText(sampleDeck());
    expect(text).toContain('Commander');
    expect(text).toContain('1 Azusa, Lost but Seeking');
    expect(text).toContain('Deck');
    expect(text).toContain('5 Forest');
    expect(text).toContain('Maybeboard');
    expect(text).toContain('1 Sideboard Card');
  });
});

describe('exportMtgo', () => {
  it('emits valid card-name rows (no inline annotation) and section comments', () => {
    const text = exportMtgo(sampleDeck());
    // The commander row is a plain `quantity name` line — never `name // Commander`.
    expect(text).toContain('1 Azusa, Lost but Seeking');
    expect(text).not.toContain('Azusa, Lost but Seeking // Commander');
    expect(text).toContain('// Commander');
    expect(text).toContain('// Sideboard');
    expect(text.split('\n\n').length).toBeGreaterThan(1);
  });
});

const resolver = () =>
  new Map([
    [normalizeCardName('Azusa, Lost but Seeking'), azusaCommander()],
    [normalizeCardName('Forest'), basicForest()],
    [normalizeCardName('Sol Ring'), makeCard({ name: 'Sol Ring', typeLine: 'Artifact' })],
    [normalizeCardName('Sideboard Card'), makeCard({ name: 'Sideboard Card' })],
  ]);

describe('export → import round trip', () => {
  it('re-imports a plain-text export to an equivalent deck', () => {
    const deck = sampleDeck();
    const text = exportText(deck);

    const parsed = parseDeckList(text);
    const result = buildImportResult(parsed, resolver());
    const rebuilt = applyImportResult(createDeck(), result, 'replace');

    expect(commanders(rebuilt).map((c) => c.card.name)).toEqual(['Azusa, Lost but Seeking']);
    expect(totalCardCount(rebuilt)).toBe(totalCardCount(deck));
  });

  it('re-imports an MTGO export without the commander becoming unrecognized', () => {
    const deck = sampleDeck();
    const text = exportMtgo(deck);

    const parsed = parseDeckList(text);
    // Every parsed line resolves — no commander name is mangled by an annotation.
    const result = buildImportResult(parsed, resolver());
    expect(result.unrecognized).toEqual([]);
    expect(result.unparseable).toEqual([]);

    const rebuilt = applyImportResult(createDeck(), result, 'replace');
    // The commander section survives the MTGO round trip via the `// Commander`
    // section comment.
    expect(commanders(rebuilt).map((c) => c.card.name)).toEqual(['Azusa, Lost but Seeking']);
    expect(totalCardCount(rebuilt)).toBe(totalCardCount(deck));
    expect(sectionCount(rebuilt, 'maybeboard')).toBe(sectionCount(deck, 'maybeboard'));
  });

  it('preserves split-card names like "Fire // Ice" on import', () => {
    const parsed = parseDeckList('1 Fire // Ice');
    expect(parsed.lines[0]?.name).toBe('Fire // Ice');
  });
});
