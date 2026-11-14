import { Button as BaseButton } from '@base-ui/react/button';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import styles from './Button.module.css';

/**
 * `row` is a list row: as wide as the box it sits in, start-aligned, with no fill or border at rest
 * and a quiet surface on hover and press. Pair it with `endIcon` for a trailing chevron.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'row';
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
  /**
   * A decorative glyph after the label (and after the badge), such as a row's chevron. It is hidden
   * from assistive technology and never part of the accessible name; a count goes in `badge`.
   */
  endIcon?: ReactNode;
  /** Shows a busy state, keeps the button focusable, and blocks activation. */
  loading?: boolean;
  className?: string;
}

/**
 * `true`, `false`, `null` and `undefined` render nothing, and `''` renders an empty text node, so
 * none of them may leave an empty badge, end icon or space behind. Shared with `LinkButton`; the
 * barrel does not export it.
 */
export function hasContent(node: ReactNode) {
  return node !== undefined && node !== null && node !== '' && typeof node !== 'boolean';
}

export function Button({
  variant = 'primary',
  size = 'md',
  tone = 'accent',
  badge,
  endIcon,
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
      {hasContent(endIcon) ? (
        <span className={styles.endIcon} aria-hidden="true">
          {endIcon}
        </span>
      ) : null}
    </BaseButton>
  );
}
