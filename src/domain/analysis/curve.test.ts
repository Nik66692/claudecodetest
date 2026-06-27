import { describe, it, expect } from 'vitest';
import { createDeck, addCard, setCommander } from '../deck';
import { makeCard, basicForest, azusaCommander } from '@/test/fixtures';
import { computeManaCurve } from './curve';

function bucket(curve: ReturnType<typeof computeManaCurve>, label: string) {
  return curve.buckets.find((b) => b.label === label)!;
}

function sampleDeck() {
  let deck = createDeck();
  deck = setCommander(deck, azusaCommander()); // mv 3, commander
  deck = addCard(
    deck,
    makeCard({ oracleId: 'one', name: 'One Drop', manaValue: 1, unlimitedQuantity: true }),
    { quantity: 2 },
  );
  deck = addCard(
    deck,
    makeCard({ oracleId: 'big', name: 'Big Thing', manaValue: 8, typeLine: 'Creature — Giant' }),
  );
  deck = addCard(deck, basicForest(), { quantity: 5 }); // land, mv 0
  deck = addCard(deck, makeCard({ oracleId: 'mb', name: 'Maybe', manaValue: 2 }), {
    section: 'maybeboard',
  });
  return deck;
}

describe('computeManaCurve', () => {
  it('excludes lands, commanders and the maybeboard by default; respects quantities', () => {
    const curve = computeManaCurve(sampleDeck());
    expect(curve.totalCards).toBe(3); // 2× one-drop + 1× big
    expect(bucket(curve, '1').count).toBe(2);
    expect(bucket(curve, '0').count).toBe(0); // forest excluded
    expect(bucket(curve, '3').count).toBe(0); // commander excluded
    expect(curve.averageManaValue).toBe(Math.round((10 / 3) * 100) / 100);
  });

  it('buckets mana value 7 and above into the 7+ bucket', () => {
    const curve = computeManaCurve(sampleDeck());
    expect(bucket(curve, '7+').count).toBe(1);
    expect(bucket(curve, '7+').cards[0]?.name).toBe('Big Thing');
  });

  it('includes commanders when asked', () => {
    const curve = computeManaCurve(sampleDeck(), { includeCommanders: true });
    expect(bucket(curve, '3').count).toBe(1);
    expect(curve.totalCards).toBe(4);
  });

  it('includes lands when asked, placing zero-cost lands in bucket 0', () => {
    const curve = computeManaCurve(sampleDeck(), { includeLands: true });
    expect(bucket(curve, '0').count).toBe(5);
    expect(curve.totalCards).toBe(8);
  });

  it('inspects the maybeboard in isolation', () => {
    const curve = computeManaCurve(sampleDeck(), { scope: 'maybeboard' });
    expect(curve.totalCards).toBe(1);
    expect(bucket(curve, '2').count).toBe(1);
  });

  it('reports percentages that sum to ~100 and zero for an empty deck', () => {
    const curve = computeManaCurve(sampleDeck());
    const sum = curve.buckets.reduce((s, b) => s + b.percentage, 0);
    expect(Math.round(sum)).toBe(100);

    const empty = computeManaCurve(createDeck());
    expect(empty.totalCards).toBe(0);
    expect(empty.averageManaValue).toBe(0);
    expect(empty.buckets.every((b) => b.percentage === 0)).toBe(true);
  });
});
