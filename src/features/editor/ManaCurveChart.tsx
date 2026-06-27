import type { Card } from '@/domain/types';
import type { ManaCurve } from '@/domain/analysis';
import { Icon } from '@/ui';
import styles from './Analysis.module.css';

export interface ManaCurveChartProps {
  curve: ManaCurve;
  onPreview: (card: Card) => void;
}

/**
 * Accessible mana-curve bar chart built from project-owned CSS (no charting
 * library). Bars are scaled to the largest bucket; each bar shows its count and
 * percentage as text so the chart never relies on color or length alone, and a
 * collapsible data table provides a full textual equivalent.
 */
export function ManaCurveChart({ curve, onPreview }: ManaCurveChartProps) {
  const maxCount = Math.max(1, ...curve.buckets.map((b) => b.count));

  return (
    <div>
      <ul className={styles.curve} aria-label="Mana value distribution">
        {curve.buckets.map((bucket) => (
          <li key={bucket.label} className={styles.curveRow}>
            <span className={styles.curveLabel} aria-hidden="true">
              {bucket.label}
            </span>
            <span
              className={styles.curveBarTrack}
              role="img"
              aria-label={`Mana value ${bucket.label}: ${bucket.count} cards, ${bucket.percentage.toFixed(0)} percent`}
            >
              <span
                className={styles.curveBar}
                style={{ width: `${(bucket.count / maxCount) * 100}%` }}
              />
            </span>
            <span className={styles.curveMeta} aria-hidden="true">
              <span className={styles.curveCount}>{bucket.count}</span> ·{' '}
              {bucket.percentage.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>

      <details className={styles.disclosure}>
        <summary className={styles.disclosureSummary}>Show curve as a table</summary>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Mana value</th>
              <th scope="col">Cards</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {curve.buckets.map((bucket) => (
              <tr key={bucket.label}>
                <th scope="row">{bucket.label}</th>
                <td>{bucket.count}</td>
                <td>{bucket.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>{curve.totalCards}</td>
              <td>avg {curve.averageManaValue.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </details>

      {curve.buckets.some((b) => b.count > 0) && (
        <details className={styles.disclosure}>
          <summary className={styles.disclosureSummary}>List cards by bucket</summary>
          {curve.buckets
            .filter((b) => b.cards.length > 0)
            .map((bucket) => (
              <div key={bucket.label} style={{ marginTop: 'var(--space-2)' }}>
                <p className={styles.curveMeta}>
                  <Icon name="cards" size={13} /> Mana value {bucket.label}
                </p>
                <div className={styles.contribList}>
                  {bucket.cards.map((c) => (
                    <button
                      key={c.cardId}
                      type="button"
                      className={styles.contribItem}
                      onClick={() => onPreview(c.card)}
                    >
                      {c.card.printing.images.small && (
                        <img
                          className={styles.contribThumb}
                          src={c.card.printing.images.small}
                          alt=""
                        />
                      )}
                      <span className={styles.contribName}>{c.name}</span>
                      {c.quantity > 1 && <span className={styles.contribQty}>×{c.quantity}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </details>
      )}
    </div>
  );
}
