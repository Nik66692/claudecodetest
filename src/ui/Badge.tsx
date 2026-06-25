import type { ReactNode } from 'react';
import styles from './Badge.module.css';

type Tone = 'neutral' | 'accent' | 'warning' | 'danger' | 'success';

const toneClass: Record<Tone, string> = {
  neutral: '',
  accent: styles.accent!,
  warning: styles.warning!,
  danger: styles.danger!,
  success: styles.success!,
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`${styles.badge} ${toneClass[tone]}`}>{children}</span>;
}
