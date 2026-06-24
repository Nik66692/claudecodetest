import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './TextField.module.css';

interface CommonProps {
  label?: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  leadingIcon?: IconName;
}

export interface TextFieldProps
  extends CommonProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hideLabel, hint, error, required, leadingIcon, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={hideLabel ? 'sr-only' : styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className={styles.inputWrap}>
        {leadingIcon && (
          <span className={styles.leadingIcon}>
            <Icon name={leadingIcon} size={18} />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            styles.input,
            leadingIcon ? styles.hasLeadingIcon : '',
            error ? styles.invalid : '',
            className ?? '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required}
          {...props}
        />
      </div>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          <Icon name="warning" size={13} />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export interface TextAreaProps
  extends CommonProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hideLabel, hint, error, required, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={hideLabel ? 'sr-only' : styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={[styles.textarea, error ? styles.invalid : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          <Icon name="warning" size={13} />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
});
