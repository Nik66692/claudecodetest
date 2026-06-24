import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconEnd?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: styles.primary!,
  secondary: styles.secondary!,
  ghost: styles.ghost!,
  danger: styles.danger!,
  dangerGhost: styles.dangerGhost!,
};

const sizeClass: Record<Size, string> = {
  sm: styles.sm!,
  md: styles.md!,
  lg: styles.lg!,
};

const iconSizeFor: Record<Size, number> = { sm: 15, md: 17, lg: 18 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    icon,
    iconEnd,
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const classes = [
    styles.button,
    variantClass[variant],
    sizeClass[size],
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={iconSizeFor[size]} />
      )}
      {children}
      {iconEnd && !loading && <Icon name={iconEnd} size={iconSizeFor[size]} />}
    </button>
  );
});
