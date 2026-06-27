import { describe, it, expect } from 'vitest';
import { createDeck, addCard } from '../deck';
import { makeCard, basicForest } from '@/test/fixtures';
import { analyzeManaProduction } from './manaProduction';

function productionDeck() {
  let deck = createDeck();
  deck = addCard(deck, basicForest(), { quantity: 5 }); // land, produces G
  deck = addCard(
    deck,
    makeCard({
      oracleId: 'ct',
      name: 'Command Tower',
      typeLine: 'Land',
      produces: ['W', 'U', 'B', 'R', 'G'],
    }),
  );
  deck = addCard(
    deck,
    makeCard({ oracleId: 'sol', name: 'Sol Ring', typeLine: 'Artifact', produces: ['C'] }),
  );
  deck = addCard(
    deck,
    makeCard({
      oracleId: 'elf',
      name: 'Llanowar Elves',
      typeLine: 'Creature — Elf',
      produces: ['G'],
    }),
  );
  // A fetchland: a land that is captured but produces no mana itself.
  deck = addCard(
    deck,
    makeCard({ oracleId: 'fetch', name: 'Fetch Land', typeLine: 'Land', produces: [] }),
  );
  // Legacy snapshot: production metadata not captured.
  deck = addCard(
    deck,
    makeCard({
      oracleId: 'legacy',
      name: 'Legacy Rock',
      typeLine: 'Artifact',
      produces: [],
      productionDataComplete: false,
    }),
  );
  return deck;
}

describe('analyzeManaProduction', () => {
  it('splits land and non-land sources and respects quantities', () => {
    const p = analyzeManaProduction(productionDeck());
    expect(p.totalLands).toBe(7); // 5 forest + tower + fetch
    expect(p.landsWithProduction).toBe(6); // forest + tower (fetch produces nothing)
    expect(p.nonlandProducers).toBe(2); // sol ring + elves
    expect(p.landSourcesByColor.G).toBe(6); // 5 forest + tower
    expect(p.nonlandSourcesByColor.G).toBe(1); // elves
  });

  it('counts mono, multicolor and colorless sources; per-color counts are non-additive', () => {
    const p = analyzeManaProduction(productionDeck());
    expect(p.sourcesByColor.G).toBe(7); // 5 forest + tower + elves
    expect(p.sourcesByColor.W).toBe(1); // tower only
    expect(p.sourcesByColor.C).toBe(1); // sol ring
    // The multicolor tower is counted once per color, so the column sum exceeds
    // the number of source cards — the totals are not additive.
    const columnSum =
      p.sourcesByColor.W +
      p.sourcesByColor.U +
      p.sourcesByColor.B +
      p.sourcesByColor.R +
      p.sourcesByColor.G +
      p.sourcesByColor.C;
    expect(columnSum).toBeGreaterThan(p.landsWithProduction + p.nonlandProducers);
  });

  it('reports incomplete metadata without misclassifying it as "produces nothing"', () => {
    const p = analyzeManaProduction(productionDeck());
    expect(p.incompleteCards).toBe(1); // legacy rock only; the fetch is complete-but-empty
  });

  it('lists land and non-land contributors separately', () => {
    const p = analyzeManaProduction(productionDeck());
    expect(p.landContributors.G.map((c) => c.name)).toEqual(['Command Tower', 'Forest']);
    expect(p.nonlandContributors.G.map((c) => c.name)).toEqual(['Llanowar Elves']);
  });
});
