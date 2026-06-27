import { useState, type ReactNode } from 'react';
import type { Card, Deck, ProducedMana } from '@/domain/types';
import { MANA_COLORS } from '@/domain/types';
import type {
  ContributorRef,
  DemandVsProduction,
  ManaDemand,
  ManaProduction,
} from '@/domain/analysis';
import type { RuleViolation } from '@/domain/rules';
import { totalCardCount } from '@/domain/rules';
import { Button, EmptyState, Icon } from '@/ui';
import { useDeckAnalysis } from '@/hooks/useDeckAnalysis';
import type { CardDataRefresh } from '@/hooks/useCardDataRefresh';
import { ManaCurveChart } from './ManaCurveChart';
import styles from './Analysis.module.css';

const MANA_TOKEN: Record<ProducedMana, string> = {
  W: 'var(--mana-w)',
  U: 'var(--mana-u)',
  B: 'var(--mana-b)',
  R: 'var(--mana-r)',
  G: 'var(--mana-g)',
  C: 'var(--mana-c)',
};

const PRODUCED_LABEL: Record<ProducedMana, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
  C: 'Colorless',
};

export interface AnalysisViewProps {
  deck: Deck;
  refresh: CardDataRefresh;
  onPreview: (card: Card) => void;
}

export function AnalysisView({ deck, refresh, onPreview }: AnalysisViewProps) {
  const [includeCommanders, setIncludeCommanders] = useState(false);
  const [includeLands, setIncludeLands] = useState(false);
  const [scope, setScope] = useState<'main' | 'maybeboard'>('main');

  const { curve, demand, production, comparison, violations } = useDeckAnalysis(deck, {
    includeCommanders,
    includeLands,
    scope,
  });

  if (deck.cards.length === 0) {
    return (
      <div className={styles.analysis}>
        <div className={styles.section}>
          <EmptyState icon="chart" title="Nothing to analyze yet">
            Add a commander and some cards on the Build tab. The mana curve, colored demand, and
            production analysis update here automatically.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analysis}>
      <DeckHealthPanel violations={violations} />

      <SummaryMetrics deck={deck} curve={curve} production={production} />

      <Section icon="chart" title="Mana curve" subtitle={curveSubtitle(curve.totalCards, scope)}>
        <div className={styles.controls}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={includeCommanders}
              onChange={(e) => setIncludeCommanders(e.target.checked)}
            />
            Include commanders
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={includeLands}
              onChange={(e) => setIncludeLands(e.target.checked)}
            />
            Include lands
          </label>
          <label className={styles.scopeLabel}>
            Scope
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as 'main' | 'maybeboard')}
            >
              <option value="main">Main deck</option>
              <option value="maybeboard">Maybeboard</option>
            </select>
          </label>
        </div>
        {curve.totalCards === 0 ? (
          <EmptyState icon="cards" title="No cards match these options">
            Try including lands or commanders, or switch scope.
          </EmptyState>
        ) : (
          <ManaCurveChart curve={curve} onPreview={onPreview} />
        )}
      </Section>

      <ColorDemandPanel demand={demand} onPreview={onPreview} />

      <ManaProductionPanel production={production} refresh={refresh} onPreview={onPreview} />

      <DemandVsProductionPanel comparison={comparison} onPreview={onPreview} />

      <AssumptionsPanel />
    </div>
  );
}

function curveSubtitle(total: number, scope: string): string {
  const where = scope === 'maybeboard' ? 'maybeboard' : 'main deck';
  return `${total} ${total === 1 ? 'card' : 'cards'} from the ${where}. Uses each card's stored Scryfall mana value; {X} is not predicted.`;
}

/* -------------------------------------------------------------------------- */
/* Shared shell + primitives                                                   */
/* -------------------------------------------------------------------------- */

function Section({
  icon,
  title,
  subtitle,
  actions,
  children,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitleGroup}>
          <Icon name={icon} size={18} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
        {actions}
      </div>
      {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
      {children}
    </section>
  );
}

function ColorSwatch({ symbol }: { symbol: ProducedMana }) {
  return (
    <span className={styles.swatch} style={{ background: MANA_TOKEN[symbol] }} aria-hidden="true" />
  );
}

function ContributorDisclosure({
  label,
  contributors,
  onPreview,
}: {
  label: string;
  contributors: ContributorRef[];
  onPreview: (card: Card) => void;
}) {
  if (contributors.length === 0) return null;
  return (
    <details className={styles.disclosure}>
      <summary className={styles.disclosureSummary}>
        {label} ({contributors.length})
      </summary>
      <div className={styles.contribList}>
        {contributors.map((c) => (
          <button
            key={c.cardId}
            type="button"
            className={styles.contribItem}
            onClick={() => onPreview(c.card)}
          >
            {c.card.printing.images.small && (
              <img className={styles.contribThumb} src={c.card.printing.images.small} alt="" />
            )}
            <span className={styles.contribName}>{c.name}</span>
            {c.quantity > 1 && <span className={styles.contribQty}>×{c.quantity}</span>}
          </button>
        ))}
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Deck health                                                                 */
/* -------------------------------------------------------------------------- */

function DeckHealthPanel({ violations }: { violations: RuleViolation[] }) {
  return (
    <Section
      icon="info"
      title="Deck health"
      subtitle="Limited rule checks — warnings, not a full Commander rules engine."
    >
      {violations.length === 0 ? (
        <div className={`${styles.healthItem} ${styles.healthOk}`}>
          <Icon name="check" size={16} className={styles.healthIcon} />
          No rule warnings for the modeled checks (commander, singleton, color identity, deck size).
        </div>
      ) : (
        <ul className={styles.health}>
          {violations.map((v, i) => (
            <li
              key={`${v.kind}-${v.cardId ?? i}`}
              className={`${styles.healthItem} ${v.kind === 'deck-size' ? styles.healthInfo : styles.healthWarn}`}
            >
              <Icon
                name={v.kind === 'deck-size' ? 'info' : 'warning'}
                size={16}
                className={styles.healthIcon}
              />
              {v.message}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary metrics                                                             */
/* -------------------------------------------------------------------------- */

function SummaryMetrics({
  deck,
  curve,
  production,
}: {
  deck: Deck;
  curve: { averageManaValue: number };
  production: ManaProduction;
}) {
  return (
    <Section icon="cards" title="Summary">
      <div className={styles.statGrid}>
        <StatTile value={String(totalCardCount(deck))} label="Cards (commander + main)" />
        <StatTile value={String(production.totalLands)} label="Lands" />
        <StatTile
          value={String(production.totalLands === 0 ? 0 : production.landsWithProduction)}
          label="Lands making mana"
        />
        <StatTile value={curve.averageManaValue.toFixed(2)} label="Avg. mana value (non-land)" />
        <StatTile value={String(production.nonlandProducers)} label="Non-land mana sources" />
      </div>
    </Section>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.statTile}>
      <div className={styles.statValue}>{value}</div>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Colored demand                                                              */
/* -------------------------------------------------------------------------- */

function ColorDemandPanel({
  demand,
  onPreview,
}: {
  demand: ManaDemand;
  onPreview: (card: Card) => void;
}) {
  return (
    <Section
      icon="chart"
      title="Colored mana demand"
      subtitle={`Strict colored pips required by ${demand.analyzedSpells} spell ${demand.analyzedSpells === 1 ? 'copy' : 'copies'} (commanders included). Hybrid, Phyrexian and {C} are kept separate. ${demand.excludedNoCost} ${demand.excludedNoCost === 1 ? 'copy has' : 'copies have'} no usable mana cost.`}
    >
      <div className={styles.colorTable} style={{ ['--cols' as string]: '3' }}>
        <div className={styles.colorRowHead}>
          <span>Color</span>
          <span>Strict pips</span>
          <span>Hybrid</span>
          <span>Phyrexian</span>
        </div>
        {MANA_COLORS.map((color) => (
          <div key={color} className={styles.colorRow}>
            <span className={styles.colorName}>
              <ColorSwatch symbol={color} />
              {PRODUCED_LABEL[color]}
            </span>
            <span className={styles.metricCell}>{demand.strictPips[color]}</span>
            <span className={styles.metricCell}>{demand.hybridColored[color]}</span>
            <span className={styles.metricCell}>{demand.phyrexianColored[color]}</span>
          </div>
        ))}
      </div>

      <p className={styles.metaNote} style={{ marginTop: 'var(--space-3)' }}>
        Explicit colorless {'{C}'}: <strong>{demand.colorlessPips}</strong> · Variable {'{X}'}:{' '}
        <strong>{demand.variableSymbols}</strong> · Generic: <strong>{demand.genericPips}</strong>
      </p>

      {MANA_COLORS.map((color) => (
        <ContributorDisclosure
          key={color}
          label={`${PRODUCED_LABEL[color]} pip sources`}
          contributors={demand.contributors[color]}
          onPreview={onPreview}
        />
      ))}
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Production                                                                   */
/* -------------------------------------------------------------------------- */

function ManaProductionPanel({
  production,
  refresh,
  onPreview,
}: {
  production: ManaProduction;
  refresh: CardDataRefresh;
  onPreview: (card: Card) => void;
}) {
  const symbols: ProducedMana[] = [...MANA_COLORS, 'C'];
  return (
    <Section
      icon="cards"
      title="Mana production & sources"
      subtitle="From Scryfall's structured “produces” data. A multicolor source counts once for every color, so per-color counts are NOT additive."
    >
      <RefreshControl refresh={refresh} incompleteCards={production.incompleteCards} />

      {production.totalLands === 0 && (
        <div className={styles.notice}>
          <Icon name="info" size={16} className={styles.noticeIcon} />
          No lands in the deck yet.
        </div>
      )}

      <div className={styles.colorTable} style={{ ['--cols' as string]: '3' }}>
        <div className={styles.colorRowHead}>
          <span>Source of</span>
          <span>Total</span>
          <span>Land</span>
          <span>Non-land</span>
        </div>
        {symbols.map((symbol) => (
          <div key={symbol} className={styles.colorRow}>
            <span className={styles.colorName}>
              <ColorSwatch symbol={symbol} />
              {PRODUCED_LABEL[symbol]}
            </span>
            <span className={styles.metricCell}>{production.sourcesByColor[symbol]}</span>
            <span className={styles.metricCell}>{production.landSourcesByColor[symbol]}</span>
            <span className={styles.metricCell}>{production.nonlandSourcesByColor[symbol]}</span>
          </div>
        ))}
      </div>

      <p className={styles.metaNote} style={{ marginTop: 'var(--space-3)' }}>
        {production.totalLands} lands ({production.landsWithProduction} make mana) ·{' '}
        {production.nonlandProducers} non-land sources
      </p>

      {symbols.map((symbol) => {
        const all = [
          ...production.landContributors[symbol],
          ...production.nonlandContributors[symbol],
        ];
        return (
          <ContributorDisclosure
            key={symbol}
            label={`${PRODUCED_LABEL[symbol]} sources`}
            contributors={all}
            onPreview={onPreview}
          />
        );
      })}
    </Section>
  );
}

function RefreshControl({
  refresh,
  incompleteCards,
}: {
  refresh: CardDataRefresh;
  incompleteCards: number;
}) {
  return (
    <div className={styles.notice} aria-live="polite">
      <Icon name="info" size={16} className={styles.noticeIcon} />
      <div className={styles.refreshRow} style={{ flex: 1 }}>
        <span style={{ flex: 1, minWidth: '12rem' }}>
          {incompleteCards > 0
            ? `${incompleteCards} ${incompleteCards === 1 ? 'card was' : 'cards were'} saved before production data existed. Refresh to complete the analysis.`
            : 'Production data is captured for every card in this deck.'}
        </span>
        <Button
          variant="secondary"
          size="sm"
          icon="refresh"
          onClick={refresh.refresh}
          disabled={refresh.status === 'loading'}
        >
          {refresh.status === 'loading' ? 'Refreshing…' : 'Refresh card data'}
        </Button>
        <RefreshStatus refresh={refresh} />
      </div>
    </div>
  );
}

function RefreshStatus({ refresh }: { refresh: CardDataRefresh }) {
  if (refresh.status === 'idle' || refresh.status === 'loading') return null;
  if (refresh.status === 'error' || refresh.status === 'offline') {
    return (
      <span className={`${styles.refreshStatus} ${styles.refreshStatusError}`}>
        {refresh.error}
      </span>
    );
  }
  const r = refresh.result;
  if (!r) return null;
  return (
    <span className={styles.refreshStatus}>
      Updated {r.updated} {r.updated === 1 ? 'card' : 'cards'}
      {r.notFound.length > 0 ? `, ${r.notFound.length} not found` : ''}.
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Demand vs production                                                         */
/* -------------------------------------------------------------------------- */

function DemandVsProductionPanel({
  comparison,
  onPreview,
}: {
  comparison: DemandVsProduction;
  onPreview: (card: Card) => void;
}) {
  return (
    <Section
      icon="chart"
      title="Demand vs production"
      subtitle="An honest side-by-side, not a pass/fail verdict. Strict colored demand against recognized sources, in WUBRG order."
    >
      {comparison.incompleteProductionCards > 0 && (
        <div className={styles.notice}>
          <Icon name="warning" size={16} className={styles.noticeIcon} />
          {comparison.incompleteProductionCards} card(s) have incomplete production data — refresh
          for accurate source counts.
        </div>
      )}

      <div className={styles.colorTable} style={{ ['--cols' as string]: '4' }}>
        <div className={styles.colorRowHead}>
          <span>Color</span>
          <span>Strict demand</span>
          <span>Sources</span>
          <span>Land</span>
          <span>Sources / pip</span>
        </div>
        {comparison.colors.map((c) => (
          <div key={c.color} className={styles.colorRow}>
            <span className={styles.colorName}>
              <ColorSwatch symbol={c.color} />
              {PRODUCED_LABEL[c.color]}
            </span>
            <span className={styles.metricCell}>{c.strictPipDemand}</span>
            <span className={styles.metricCell}>{c.recognizedSources}</span>
            <span className={styles.metricCell}>
              {c.landSources}
              <span className={styles.metricMuted}> / {c.nonlandSources} nl</span>
            </span>
            <span className={styles.metricCell}>
              {c.sourcesPerStrictPip === null ? '—' : c.sourcesPerStrictPip.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <p className={styles.metaNote} style={{ marginTop: 'var(--space-3)' }}>
        Explicit colorless {'{C}'} demand: <strong>{comparison.colorlessDemand}</strong> · colorless
        sources: <strong>{comparison.colorlessSources}</strong>
      </p>

      {comparison.colors.map((c) => (
        <div key={c.color}>
          <ContributorDisclosure
            label={`${PRODUCED_LABEL[c.color]}: demand`}
            contributors={c.demandContributors}
            onPreview={onPreview}
          />
          <ContributorDisclosure
            label={`${PRODUCED_LABEL[c.color]}: sources`}
            contributors={c.productionContributors}
            onPreview={onPreview}
          />
        </div>
      ))}

      <p className={styles.metaNote} style={{ marginTop: 'var(--space-3)' }}>
        Heuristic: <strong>sources / pip = recognized sources ÷ strict pip demand</strong>. A rough
        comparison only — it ignores hybrid flexibility, fixing, card draw, and your curve. It is
        not a recommendation for how many lands to run.
      </p>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Assumptions                                                                  */
/* -------------------------------------------------------------------------- */

function AssumptionsPanel() {
  return (
    <Section icon="info" title="Assumptions & data quality">
      <ul className={styles.assumptions}>
        <li>
          Mana value uses each card&rsquo;s normalized Scryfall value. {'{X}'} costs are not
          predicted; double-faced, split and adventure cards use stored front-face data.
        </li>
        <li>
          Colored demand counts only strict pips ({'{W}'}). Hybrid ({'{W/U}'}), two-brid ({'{2/W}'}
          ), and Phyrexian ({'{W/P}'}) symbols are reported separately because they can be paid
          other ways; {'{C}'} is an explicit colorless requirement.
        </li>
        <li>
          Production uses Scryfall&rsquo;s structured &ldquo;produces&rdquo; data — a
          &ldquo;can-produce&rdquo; signal only. It says nothing about quantity, reliability,
          timing, or restrictions, and conditional sources are not distinguished from unconditional
          ones.
        </li>
        <li>
          Per-color source counts are non-additive: a multicolor source is counted once for every
          color it can make.
        </li>
        <li>
          Cards saved before this analysis existed are marked incomplete (not &ldquo;produces
          nothing&rdquo;); use &ldquo;Refresh card data&rdquo; to complete them.
        </li>
        <li>This is a set of honest heuristics, not an exact Magic rules evaluation.</li>
      </ul>
    </Section>
  );
}
