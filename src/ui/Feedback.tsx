import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Feedback.module.css';

export function Spinner({ size = 20, label }: { size?: number; label?: string }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label ?? 'Loading'}
    />
  );
}

export function InlineLoading({ children = 'Loading…' }: { children?: ReactNode }) {
  return (
    <div className={styles.inlineLoading} role="status">
      <Spinner size={16} />
      <span>{children}</span>
    </div>
  );
}

export interface StateProps {
  icon?: IconName;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function EmptyState({ icon = 'cards', title, children, actions }: StateProps) {
  return (
    <div className={styles.state}>
      <span className={styles.stateIcon}>
        <Icon name={icon} size={26} />
      </span>
      <h2 className={styles.stateTitle}>{title}</h2>
      {children && <p className={styles.stateBody}>{children}</p>}
      {actions && <div className={styles.stateActions}>{actions}</div>}
    </div>
  );
}

export function ErrorState({ title, children, actions }: Omit<StateProps, 'icon'>) {
  return (
    <div className={styles.state} role="alert">
      <span className={`${styles.stateIcon} ${styles.errorIcon}`}>
        <Icon name="warning" size={26} />
      </span>
      <h2 className={styles.stateTitle}>{title}</h2>
      {children && <p className={styles.stateBody}>{children}</p>}
      {actions && <div className={styles.stateActions}>{actions}</div>}
    </div>
  );
}
