import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './IconButton.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible label — icon-only controls must name their action. */
  label: string;
  icon: IconName;
  size?: 'sm' | 'md';
  bordered?: boolean;
  danger?: boolean;
  active?: boolean;
  iconSize?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    size = 'md',
    bordered,
    danger,
    active,
    iconSize,
    className,
    type = 'button',
    ...props
  },
  ref,
) {
  const classes = [
    styles.iconButton,
    size === 'sm' ? styles.sm : styles.md,
    bordered ? styles.bordered : '',
    danger ? styles.danger : '',
    active ? styles.active : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      aria-label={label}
      title={label}
      aria-pressed={active}
      {...props}
    >
      <Icon name={icon} size={iconSize ?? (size === 'sm' ? 16 : 18)} />
    </button>
  );
});
