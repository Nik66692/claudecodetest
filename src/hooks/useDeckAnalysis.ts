import { useMemo } from 'react';
import type { Deck } from '@/domain/types';
import { validateDeck, type RuleViolation } from '@/domain/rules';
import {
  computeManaCurve,
  analyzeManaDemand,
  analyzeManaProduction,
  compareDemandVsProduction,
  type CurveOptions,
  type ManaCurve,
  type ManaDemand,
  type ManaProduction,
  type DemandVsProduction,
} from '@/domain/analysis';

export interface DeckAnalysis {
  curve: ManaCurve;
  demand: ManaDemand;
  production: ManaProduction;
  comparison: DemandVsProduction;
  violations: RuleViolation[];
}

/**
 * Memoized derived analysis for a deck. Everything is recomputed from the deck
 * (nothing is persisted) and only when the relevant inputs change, so a 100-card
 * deck updates without re-running expensive parsing on every render. The curve
 * recomputes when its options change; the rest depend only on the deck.
 */
export function useDeckAnalysis(deck: Deck, curveOptions: CurveOptions): DeckAnalysis {
  const { includeCommanders, includeLands, scope } = {
    includeCommanders: curveOptions.includeCommanders ?? false,
    includeLands: curveOptions.includeLands ?? false,
    scope: curveOptions.scope ?? 'main',
  };

  const curve = useMemo(
    () => computeManaCurve(deck, { includeCommanders, includeLands, scope }),
    [deck, includeCommanders, includeLands, scope],
  );
  const demand = useMemo(() => analyzeManaDemand(deck), [deck]);
  const production = useMemo(() => analyzeManaProduction(deck), [deck]);
  const comparison = useMemo(() => compareDemandVsProduction(deck), [deck]);
  const violations = useMemo(() => validateDeck(deck), [deck]);

  return { curve, demand, production, comparison, violations };
}
