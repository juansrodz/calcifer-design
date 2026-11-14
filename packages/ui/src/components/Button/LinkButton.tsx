import { useRender } from '@base-ui/react/use-render';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { hasContent } from './Button';
import type { ButtonSize, ButtonTone, ButtonVariant } from './Button';
import styles from './Button.module.css';

export interface LinkButtonProps extends ComponentPropsWithRef<'a'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  /**
   * A decorative glyph after the label, such as a row's chevron. It is hidden from assistive
   * technology and never part of the link's accessible name; put a count in the label, since a
   * link has no `badge` slot.
   */
  endIcon?: ReactNode;
  /**
   * Replaces the rendered `<a>` so a router link can wear the button styling; the
   * element's own props are merged with the ones this component supplies.
   */
  render?: useRender.RenderProp;
}

/**
 * A link that looks like a `Button`. It shares `Button`'s styling but none of its
 * semantics: no `role`, no button behaviour, so assistive technology announces a
 * destination change rather than an action. Use it for navigation; use `Button` for
 * anything that acts on the current page.
 */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  tone = 'accent',
  endIcon,
  className,
  children,
  render,
  ref,
  ...rest
}: LinkButtonProps) {
  return useRender<Record<string, unknown>, HTMLAnchorElement>({
    defaultTagName: 'a',
    render,
    ref,
    props: {
      ...rest,
      className: [styles.root, className].filter(Boolean).join(' '),
      'data-variant': variant,
      'data-size': size,
      'data-tone': tone,
      children: (
        <>
          <span className={styles.label}>{children}</span>
          {hasContent(endIcon) ? (
            <span className={styles.endIcon} aria-hidden="true">
              {endIcon}
            </span>
          ) : null}
        </>
      ),
    },
  });
}
