import { Button as BaseButton } from '@base-ui/react/button';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm' | 'lg';
/**
 * The colour family a filled button draws from. `accent` is the house look; `inverse` is the
 * high-contrast fill for a button that sits on an accent or photo surface; `selected` is the chosen
 * state's colour. Ghost has no tone rule.
 */
export type ButtonTone = 'accent' | 'inverse' | 'selected';

export interface ButtonProps extends Omit<
  ComponentPropsWithoutRef<typeof BaseButton>,
  'className'
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  /**
   * A count or short status shown after the label, such as the `2` in "Suggestions 2". It is part
   * of the button's accessible name.
   */
  badge?: ReactNode;
  /** Shows a busy state, keeps the button focusable, and blocks activation. */
  loading?: boolean;
  className?: string;
}

/**
 * `true`, `false`, `null` and `undefined` render nothing, and `''` renders an empty text node, so
 * none of them may leave an empty badge (or its space) behind.
 */
function hasContent(node: ReactNode) {
  return node !== undefined && node !== null && node !== '' && typeof node !== 'boolean';
}

export function Button({
  variant = 'primary',
  size = 'md',
  tone = 'accent',
  badge,
  loading = false,
  disabled,
  className,
  children,
  nativeButton,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;
  // Base UI's Button defaults `nativeButton` to `true`, which assumes the `render` prop
  // (when given) still produces a native `<button>`. Most consumers use `render` to swap
  // in a non-button element (e.g. a router `Link`, which renders an `<a>`), so default to
  // `false` whenever `render` is supplied; an explicit `nativeButton` from the caller wins.
  const isNativeButton = nativeButton ?? !rest.render;
  return (
    <BaseButton
      {...rest}
      nativeButton={isNativeButton}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
      data-loading={loading ? '' : undefined}
      disabled={isDisabled}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
    >
      <span className={styles.label}>{children}</span>
      {/* The space is rendered, not styled, so the accessible name joins the label and the count
          ("Suggestions 2") with no stylesheet loaded; the flex row draws nothing for it. */}
      {hasContent(badge) ? (
        <>
          {' '}
          <span className={styles.badge}>{badge}</span>
        </>
      ) : null}
    </BaseButton>
  );
}
