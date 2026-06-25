import type { ManaColor } from '@/domain/types';
import { COLOR_LABELS } from '@/domain/colors';
import styles from './Mana.module.css';

const COLOR_PIP_CLASS: Record<string, string> = {
  W: styles.w!,
  U: styles.u!,
  B: styles.b!,
  R: styles.r!,
  G: styles.g!,
  C: styles.c!,
};

const DOT_CLASS: Record<ManaColor, string> = {
  W: styles.dotW!,
  U: styles.dotU!,
  B: styles.dotB!,
  R: styles.dotR!,
  G: styles.dotG!,
};

/** Tokenize a mana cost string such as `{2}{W}{U}` into its symbols. */
// eslint-disable-next-line react-refresh/only-export-components
export function parseManaCost(cost: string): string[] {
  const matches = cost.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1, -1));
}

function symbolLabel(symbol: string): string {
  if (symbol in COLOR_LABELS) return COLOR_LABELS[symbol as ManaColor];
  if (/^\d+$/.test(symbol)) return `${symbol} generic`;
  if (symbol === 'X') return 'X generic';
  if (symbol === 'C') return 'Colorless';
  return symbol;
}

export function ManaCost({ cost }: { cost: string | null }) {
  if (!cost) return null;
  const symbols = parseManaCost(cost);
  if (symbols.length === 0) return null;
  const label = symbols.map(symbolLabel).join(', ');
  return (
    <span className={styles.cost} role="img" aria-label={`Mana cost: ${label}`}>
      {symbols.map((symbol, i) => {
        const colorClass = COLOR_PIP_CLASS[symbol] ?? styles.generic!;
        // Hybrid/phyrexian symbols (e.g. W/U, 2/W) render their raw text.
        const display = symbol.includes('/') ? symbol.replace('/', '') : symbol;
        return (
          <span key={`${symbol}-${i}`} className={`${styles.pip} ${colorClass}`} aria-hidden="true">
            {display}
          </span>
        );
      })}
    </span>
  );
}

export function ColorPips({ colors }: { colors: ManaColor[] }) {
  if (colors.length === 0) {
    return (
      <span className={styles.dots} role="img" aria-label="Colorless">
        <span className={`${styles.dot} ${styles.dotC}`} />
      </span>
    );
  }
  const label = colors.map((c) => COLOR_LABELS[c]).join(', ');
  return (
    <span className={styles.dots} role="img" aria-label={`Colors: ${label}`}>
      {colors.map((c) => (
        <span key={c} className={`${styles.dot} ${DOT_CLASS[c]}`} />
      ))}
    </span>
  );
}
