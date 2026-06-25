import { describe, it, expect } from 'vitest';
import { exportText, exportMtgo } from './export';
import { createDeck, addCard, setCommander, applyImportResult } from './deck';
import { parseDeckList, buildImportResult, normalizeCardName } from './import';
import { totalCardCount, commanders } from './rules';
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
  it('annotates the commander and separates the maybeboard with a blank line', () => {
    const text = exportMtgo(sampleDeck());
    expect(text).toContain('1 Azusa, Lost but Seeking // Commander');
    expect(text.split('\n\n').length).toBeGreaterThan(1);
  });
});

describe('export → import round trip', () => {
  it('re-imports a plain-text export to an equivalent deck', () => {
    const deck = sampleDeck();
    const text = exportText(deck);

    const parsed = parseDeckList(text);
    const resolved = new Map([
      [normalizeCardName('Azusa, Lost but Seeking'), azusaCommander()],
      [normalizeCardName('Forest'), basicForest()],
      [normalizeCardName('Sol Ring'), makeCard({ name: 'Sol Ring', typeLine: 'Artifact' })],
      [normalizeCardName('Sideboard Card'), makeCard({ name: 'Sideboard Card' })],
    ]);
    const result = buildImportResult(parsed, resolved);
    const rebuilt = applyImportResult(createDeck(), result, 'replace');

    expect(commanders(rebuilt).map((c) => c.card.name)).toEqual(['Azusa, Lost but Seeking']);
    expect(totalCardCount(rebuilt)).toBe(totalCardCount(deck));
  });
});
