import { describe, it, expect } from 'vitest';
import { createDeck, addCard } from '../deck';
import { makeCard, basicForest } from '@/test/fixtures';
import { analyzeManaDemand } from './manaDemand';

function demandDeck() {
  let deck = createDeck();
  // {2}{G}{G} ×2 → 4 strict green pips, 4 generic, contributor weight 2.
  deck = addCard(
    deck,
    makeCard({
      oracleId: 'a',
      name: 'Double Green',
      manaCost: '{2}{G}{G}',
      unlimitedQuantity: true,
    }),
    { quantity: 2 },
  );
  // Hybrid {W/U} — flexible, never strict.
  deck = addCard(deck, makeCard({ oracleId: 'b', name: 'Hybrid', manaCost: '{W/U}' }));
  // Phyrexian {W/P} — payable with life, never strict.
  deck = addCard(deck, makeCard({ oracleId: 'c', name: 'Phyrexian', manaCost: '{W/P}' }));
  // Explicit colorless requirement.
  deck = addCard(deck, makeCard({ oracleId: 'd', name: 'Eldrazi', manaCost: '{C}' }));
  // Variable plus a strict red pip.
  deck = addCard(deck, makeCard({ oracleId: 'e', name: 'X Spell', manaCost: '{X}{R}' }));
  // No usable mana cost → excluded and counted. (The fixture coalesces `null` to
  // a default cost, so use an empty cost string to represent "no mana cost".)
  deck = addCard(
    deck,
    makeCard({ oracleId: 'f', name: 'No Cost', manaCost: '', typeLine: 'Sorcery' }),
  );
  // Land → not demand at all (neither analyzed nor excluded).
  deck = addCard(deck, basicForest(), { quantity: 10 });
  return deck;
}

describe('analyzeManaDemand', () => {
  it('counts strict pips with quantities and keeps generic separate', () => {
    const d = analyzeManaDemand(demandDeck());
    expect(d.strictPips.G).toBe(4);
    expect(d.strictPips.R).toBe(1);
    expect(d.genericPips).toBe(4); // {2} × 2 copies
  });

  it('separates hybrid, phyrexian, and colorless from strict demand', () => {
    const d = analyzeManaDemand(demandDeck());
    expect(d.hybridColored.W).toBe(1);
    expect(d.hybridColored.U).toBe(1);
    expect(d.strictPips.W).toBe(0); // hybrid + phyrexian never become strict white
    expect(d.phyrexianColored.W).toBe(1);
    expect(d.colorlessPips).toBe(1);
    expect(d.variableSymbols).toBe(1);
  });

  it('counts analyzed vs excluded-for-no-cost copies and ignores lands', () => {
    const d = analyzeManaDemand(demandDeck());
    // a(2) + b + c + d + e = 6 analyzed; the land is not counted on either side.
    expect(d.analyzedSpells).toBe(6);
    expect(d.excludedNoCost).toBe(1);
  });

  it('exposes per-color contributors with quantity and per-copy weight', () => {
    const d = analyzeManaDemand(demandDeck());
    const green = d.contributors.G[0]!;
    expect(green.name).toBe('Double Green');
    expect(green.quantity).toBe(2);
    expect(green.weight).toBe(2); // two green pips per copy
  });
});
