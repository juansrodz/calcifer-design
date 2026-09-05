import { Button as BaseButton } from '@base-ui/react/button';
import type { ComponentPropsWithoutRef } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<typeof BaseButton>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a busy state, keeps the button focusable, and blocks activation. */
  loading?: boolean;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;
  return (
    <BaseButton
      {...rest}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? '' : undefined}
      disabled={isDisabled}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
    >
      <span className={styles.label}>{children}</span>
    </BaseButton>
  );
}
