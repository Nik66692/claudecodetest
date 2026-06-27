import { describe, it, expect } from 'vitest';
import { createDeck, addCard, setCommander } from '../deck';
import { makeCard, basicForest, azusaCommander } from '@/test/fixtures';
import { compareDemandVsProduction } from './compare';

function deck() {
  let d = createDeck();
  d = setCommander(d, azusaCommander()); // {2}{G}, produces nothing
  d = addCard(
    d,
    makeCard({ oracleId: 's1', name: 'Green One', manaCost: '{G}', unlimitedQuantity: true }),
    { quantity: 2 },
  );
  d = addCard(d, makeCard({ oracleId: 'c', name: 'Colorless Need', manaCost: '{C}' }));
  d = addCard(d, basicForest(), { quantity: 6 }); // 6 green sources
  d = addCard(
    d,
    makeCard({
      oracleId: 'rock',
      name: 'Rock',
      manaCost: '{1}',
      typeLine: 'Artifact',
      produces: ['C'],
    }),
  );
  return d;
}

describe('compareDemandVsProduction', () => {
  it('reports strict demand and recognized sources per color in WUBRG order', () => {
    const cmp = compareDemandVsProduction(deck());
    expect(cmp.colors.map((c) => c.color)).toEqual(['W', 'U', 'B', 'R', 'G']);

    const green = cmp.colors.find((c) => c.color === 'G')!;
    // Demand: Azusa {2}{G} = 1 + Green One {G} ×2 = 2 → 3 strict green pips.
    expect(green.strictPipDemand).toBe(3);
    // Sources: 6 forests (lands) only.
    expect(green.recognizedSources).toBe(6);
    expect(green.landSources).toBe(6);
    expect(green.nonlandSources).toBe(0);
  });

  it('computes the labeled sources-per-strict-pip heuristic (null when no demand)', () => {
    const cmp = compareDemandVsProduction(deck());
    const green = cmp.colors.find((c) => c.color === 'G')!;
    expect(green.sourcesPerStrictPip).toBe(2); // 6 sources / 3 pips
    const white = cmp.colors.find((c) => c.color === 'W')!;
    expect(white.strictPipDemand).toBe(0);
    expect(white.sourcesPerStrictPip).toBeNull();
  });

  it('tracks explicit colorless demand and colorless sources separately', () => {
    const cmp = compareDemandVsProduction(deck());
    expect(cmp.colorlessDemand).toBe(1); // {C}
    expect(cmp.colorlessSources).toBe(1); // the rock
  });
});
