import { forwardRef, type SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  /** Accessible label; rendered visually hidden unless provided via aria. */
  label: string;
  size?: 'sm' | 'md';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, label, size = 'md', className, id, ...props },
  ref,
) {
  return (
    <span className={[styles.wrap, size === 'sm' ? styles.sm : ''].filter(Boolean).join(' ')}>
      <select
        ref={ref}
        id={id}
        className={[styles.select, className ?? ''].filter(Boolean).join(' ')}
        aria-label={label}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className={styles.chevron}>
        <Icon name="chevron-down" size={16} />
      </span>
    </span>
  );
});
