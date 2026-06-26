import type { Deck, ManaColor } from '../types';
import { MANA_COLORS } from '../types';
import type { ContributorRef } from './analysisTypes';
import { analyzeManaDemand, type ManaDemandOptions } from './manaDemand';
import { analyzeManaProduction, type ManaProductionOptions } from './manaProduction';

export interface ColorComparison {
  color: ManaColor;
  /** Strict colored pip demand for this color. */
  strictPipDemand: number;
  /** Recognized sources that can produce this color (non-additive across colors). */
  recognizedSources: number;
  landSources: number;
  nonlandSources: number;
  /**
   * Heuristic: recognized sources per strict pip of demand
   * (`recognizedSources / strictPipDemand`), or `null` when there is no strict
   * demand for the color. This is a rough comparison, NOT a correctness verdict;
   * it ignores hybrid flexibility, fixing, card draw, and curve.
   */
  sourcesPerStrictPip: number | null;
  demandContributors: ContributorRef[];
  productionContributors: ContributorRef[];
}

export interface DemandVsProduction {
  colors: ColorComparison[];
  /** Explicit colorless ({C}) demand. */
  colorlessDemand: number;
  /** Sources that can produce colorless mana. */
  colorlessSources: number;
  /** Copies with missing/incomplete production metadata (refresh recommended). */
  incompleteProductionCards: number;
}

export type CompareOptions = ManaDemandOptions & ManaProductionOptions;

/**
 * Build an honest, side-by-side comparison of strict colored demand against
 * recognized production for each color, in canonical WUBRG order. It intentionally
 * does NOT emit a pass/fail judgment or prescribe a land count — only the single,
 * explicitly-labeled `sourcesPerStrictPip` heuristic is offered, with its formula
 * stated. Per-color source counts are non-additive (see {@link analyzeManaProduction}).
 */
export function compareDemandVsProduction(
  deck: Deck,
  options: CompareOptions = {},
): DemandVsProduction {
  const demand = analyzeManaDemand(deck, options);
  const production = analyzeManaProduction(deck, options);

  const colors: ColorComparison[] = MANA_COLORS.map((color) => {
    const strictPipDemand = demand.strictPips[color];
    const recognizedSources = production.sourcesByColor[color];
    return {
      color,
      strictPipDemand,
      recognizedSources,
      landSources: production.landSourcesByColor[color],
      nonlandSources: production.nonlandSourcesByColor[color],
      sourcesPerStrictPip:
        strictPipDemand === 0
          ? null
          : Math.round((recognizedSources / strictPipDemand) * 100) / 100,
      demandContributors: demand.contributors[color],
      productionContributors: [
        ...production.landContributors[color],
        ...production.nonlandContributors[color],
      ],
    };
  });

  return {
    colors,
    colorlessDemand: demand.colorlessPips,
    colorlessSources: production.sourcesByColor.C,
    incompleteProductionCards: production.incompleteCards,
  };
}
