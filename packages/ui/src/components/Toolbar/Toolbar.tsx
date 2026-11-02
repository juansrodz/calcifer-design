import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { createContext, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import styles from './Toolbar.module.css';

/**
 * Whether a control sits in a `Toolbar`, which then owns the one tab stop. Private to the library:
 * `src/index.ts` does not export it, and `Segmented` reads it to leave that stop alone.
 */
export const InsideToolbarContext = createContext(false);

export interface ToolbarProps {
  /** Names the toolbar. Required: a toolbar has no visible name to fall back on. */
  'aria-label': string;
  /** Which arrow keys move focus: left and right when `horizontal`, up and down when `vertical`. */
  orientation?: 'horizontal' | 'vertical';
  /** `ToolbarButton`, `ToolbarGroup`, `ToolbarSeparator` and `Segmented`. */
  children: ReactNode;
}

/**
 * A row or a column of controls that is one tab stop, whose arrow keys move focus and loop at the
 * ends. Base UI's `Toolbar.Root` does not turn on Home and End and has no public prop to; the
 * WAI-ARIA toolbar pattern lists them as optional.
 */
export function Toolbar({
  'aria-label': ariaLabel,
  orientation = 'horizontal',
  children,
}: ToolbarProps) {
  return (
    <InsideToolbarContext.Provider value={true}>
      <BaseToolbar.Root className={styles.root} aria-label={ariaLabel} orientation={orientation}>
        {children}
      </BaseToolbar.Root>
    </InsideToolbarContext.Provider>
  );
}

export type ToolbarButtonProps = ComponentPropsWithoutRef<typeof BaseToolbar.Button>;

/**
 * A button in the toolbar's roving focus. `render` picks its look: `<Button variant="ghost" />`
 * or `<IconButton label="Approve">{icon}</IconButton>`, and with no `render` it wears a small
 * secondary `Button`. Base UI's part draws nothing of its own, so it would otherwise be unstyled.
 *
 * `disabled` goes here, not on the element in `render`. Here, Base UI keeps the button focusable
 * and says so with `aria-disabled`. On a `Button` in `render` it comes out natively disabled, out
 * of the arrow keys' reach, and with a contradictory `aria-disabled="false"`. Measured.
 */
export function ToolbarButton({
  render = <Button variant="secondary" size="sm" />,
  ...rest
}: ToolbarButtonProps) {
  return <BaseToolbar.Button render={render} {...rest} />;
}

export interface ToolbarGroupProps {
  /** Names the group for assistive technology. */
  'aria-label'?: string;
  /** Disables every `ToolbarButton` inside it. */
  disabled?: boolean;
  children: ReactNode;
}

/** Groups related controls. It adds no tab stop: arrow keys pass straight through it. */
export function ToolbarGroup({ 'aria-label': ariaLabel, disabled, children }: ToolbarGroupProps) {
  return (
    <BaseToolbar.Group className={styles.group} aria-label={ariaLabel} disabled={disabled}>
      {children}
    </BaseToolbar.Group>
  );
}

/** A rule between controls, drawn across the toolbar's own direction. */
export function ToolbarSeparator() {
  return <BaseToolbar.Separator className={styles.separator} />;
}
