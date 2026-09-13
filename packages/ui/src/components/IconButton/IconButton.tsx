import { Button as BaseButton } from '@base-ui/react/button';
import type { ComponentPropsWithoutRef } from 'react';
import { Spinner } from '../Spinner/Spinner';
import styles from './IconButton.module.css';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost';
export type IconButtonSize = 'md' | 'sm';

export interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<typeof BaseButton>,
  'className' | 'aria-label' | 'aria-labelledby'
> {
  /**
   * The button's accessible name. Required: there is no visible text to fall back on.
   *
   * The type deliberately rejects `aria-label` and `aria-labelledby`. `aria-labelledby` beats
   * `aria-label` in the accessible-name algorithm no matter which order the props are written
   * in, so a caller passing it alongside `label` would silently replace the name this component
   * is supposed to guarantee. TypeScript does not excess-property-check a JSX spread, though: an
   * object built elsewhere and spread in as `{...props}` can still smuggle either through to the
   * DOM, where it wins the accessible-name algorithm the same way. There is no runtime guard.
   */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Swaps the icon for a spinner, keeps the button focusable, and blocks activation. */
  loading?: boolean;
  className?: string;
}

export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  nativeButton,
  ...rest
}: IconButtonProps) {
  const isDisabled = Boolean(disabled) || loading;
  // Same reasoning as Button: Base UI defaults `nativeButton` to true, which assumes a `render`
  // prop still produces a native <button>. Most callers use `render` to swap in something else.
  const isNativeButton = nativeButton ?? !rest.render;
  return (
    <BaseButton
      {...rest}
      nativeButton={isNativeButton}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? '' : undefined}
      disabled={isDisabled}
      focusableWhenDisabled={loading}
      aria-label={label}
      aria-busy={loading || undefined}
    >
      <span className={styles.icon}>{loading ? <Spinner size="sm" /> : children}</span>
    </BaseButton>
  );
}
