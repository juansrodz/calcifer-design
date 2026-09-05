import { useRender } from '@base-ui/react/use-render';
import type { ComponentPropsWithRef } from 'react';
import type { ButtonSize, ButtonVariant } from './Button';
import styles from './Button.module.css';

export interface LinkButtonProps extends ComponentPropsWithRef<'a'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
      children: <span className={styles.label}>{children}</span>,
    },
  });
}
