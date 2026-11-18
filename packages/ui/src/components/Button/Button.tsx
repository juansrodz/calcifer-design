import { Button as BaseButton } from '@base-ui/react/button';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { hasContent } from '../../utils/hasContent';
import { Spinner } from '../Spinner/Spinner';
import styles from './Button.module.css';

/**
 * `row` is a list row: as wide as the box it sits in, start-aligned, with no fill or border at rest
 * and a quiet surface on hover and press. Pair it with `endIcon` for a trailing chevron. A row keeps
 * a 44 px floor and its own padding whatever `size` says; `size` changes only its type. Like ghost,
 * it has no tone rule, so a `tone` on a row is ignored.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'row';
export type ButtonSize = 'md' | 'sm' | 'lg';
/**
 * The colour family a filled button draws from. `accent` is the house look; `inverse` is the
 * high-contrast fill for a button that sits on an accent or photo surface; `selected` is the chosen
 * state's colour. Ghost and row have no tone rule, so a tone on either is ignored.
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
   * A decorative glyph before the label, such as a check or a plus. It is hidden from assistive
   * technology and never part of the accessible name. While the button is `pending`, a spinner
   * takes its place.
   */
  startIcon?: ReactNode;
  /**
   * A decorative glyph after the label (and after the badge), such as a row's chevron. It is hidden
   * from assistive technology and never part of the accessible name; a count goes in `badge`.
   */
  endIcon?: ReactNode;
  /** Shows a busy state, keeps the button focusable, and blocks activation. */
  loading?: boolean;
  /**
   * Shows a spinner in place of the leading icon and keeps the label, so the accessible name never
   * changes. Sets `aria-busy` and `aria-disabled` and blocks activation, while the button stays
   * focusable, so focus never drops to the page. A button that is also `disabled` keeps the
   * disabled look, with its icon and label as they are and no spinner.
   */
  pending?: boolean;
  /**
   * A class for the button, joined after the component's own. It is how a consumer gives a button
   * a fill of its own, through four hooks, each a custom property that inherits, so a wrapper that
   * sets one reaches every `Button` and `LinkButton` inside it, whatever the variant:
   * - `--button-fill` and `--button-label-color`, the fill and the label colour at rest;
   * - `--button-fill-hover` and `--button-label-color-hover`, the pair on hover (and a row's
   *   press). Each falls back to its rest hook, so a fill set without a hover pair keeps its colour
   *   on hover.
   *
   * The library declares no hook, so a class that sets one wins in every state (rest, hover,
   * pressed, focused, disabled, loading, pending and chosen) at any weight, with no `[data-tone]`
   * to match. Each defaults to the variant and tone's own colour. A disabled button dims the
   * consumer's pair as it dims its own; under forced colours the system colours win.
   *
   * Set the hover pair with `--button-fill-hover` and `--button-label-color-hover`, not by changing
   * `--button-fill` under your own `:hover`, which also reaches a disabled button. Prefer the class
   * on the button itself: a hook set on a wrapper also reaches the buttons the library renders
   * inside it (a `Toolbar`'s buttons, a `DataGrid`'s Clear filters and Retry, an `ErrorBoundary`'s
   * reset, an `Upload`'s browse button, a `DatePicker`'s close), and it overrides the chosen tone's
   * fill, so a chosen button no longer looks chosen.
   */
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  tone = 'accent',
  badge,
  startIcon,
  endIcon,
  loading = false,
  pending = false,
  disabled,
  className,
  children,
  nativeButton,
  ...rest
}: ButtonProps) {
  const isBusy = loading || pending;
  // The pending look (the spinner, the hidden label, the full-strength paint) belongs to a button
  // that is merely busy. One the caller disabled keeps the disabled look, so the two never mix: a
  // spinner over a dimmed button, or an overlay with nothing to anchor it, would both misread.
  const showsPending = pending && !disabled;
  // Base UI's Button defaults `nativeButton` to `true`, which assumes the `render` prop
  // (when given) still produces a native `<button>`. Most consumers use `render` to swap
  // in a non-button element (e.g. a router `Link`, which renders an `<a>`), so default to
  // `false` whenever `render` is supplied; an explicit `nativeButton` from the caller wins.
  const isNativeButton = nativeButton ?? !rest.render;
  // The leading slot: the icon, or the spinner standing in for it while pending. With no icon a
  // pending button lays the spinner over the label's box instead, and the label stays in the flow
  // (hidden by the stylesheet, never removed) so the name and the width do not change. A disabled
  // button shows its icon, or nothing, whatever `pending` says.
  let leading: ReactNode = null;
  if (hasContent(startIcon)) {
    leading = (
      <span className={styles.icon} aria-hidden="true">
        {showsPending ? <Spinner size="sm" /> : startIcon}
      </span>
    );
  } else if (showsPending) {
    leading = (
      <span className={styles.pendingOverlay} aria-hidden="true">
        <Spinner size="sm" />
      </span>
    );
  }
  return (
    <BaseButton
      {...rest}
      nativeButton={isNativeButton}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      data-tone={tone}
      data-loading={loading ? '' : undefined}
      // `data-pending` lifts the disabled dimming so the spinner reads at full strength, which only
      // a button that is merely busy should get.
      data-pending={showsPending ? '' : undefined}
      disabled={Boolean(disabled) || isBusy}
      focusableWhenDisabled={isBusy}
      aria-busy={isBusy || undefined}
    >
      {leading}
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
