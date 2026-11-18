import { Button as BaseButton } from '@base-ui/react/button';
import type { ComponentPropsWithoutRef } from 'react';
import { Spinner } from '../Spinner/Spinner';
import styles from './IconButton.module.css';
import { IconButtonContent } from './IconButtonContent';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'soft';
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
  /**
   * Makes the button a toggle: sets `aria-pressed` and, when true, draws the selected state. Leave it
   * undefined for a plain button, which then carries no `aria-pressed` but one you pass yourself.
   */
  pressed?: boolean;
  /**
   * A small count in the button's top-end corner, hidden from assistive technology. Put the count
   * in `label` as well ("Filters, 2 active"). Nothing shows for 0 or undefined; above 99 it reads
   * "99+".
   */
  badge?: number;
  className?: string;
}

/**
 * A square button that holds a glyph and no text. It acts on the current page; for navigation,
 * use `LinkIconButton`, which looks the same and is announced as a link. A router link passed to
 * `render` here is still announced as a button and activates on Space.
 */
export function IconButton({
  label,
  variant = 'ghost',
  size = 'md',
  loading = false,
  pressed,
  badge,
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
      data-pressed={pressed ? '' : undefined}
      disabled={isDisabled}
      focusableWhenDisabled={loading}
      aria-label={label}
      aria-busy={loading || undefined}
      // A caller's own `aria-pressed`, written before `pressed` existed, stands until it is given.
      aria-pressed={pressed ?? rest['aria-pressed']}
    >
      <IconButtonContent icon={loading ? <Spinner size="sm" /> : children} badge={badge} />
    </BaseButton>
  );
}
