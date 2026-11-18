import { useRender } from '@base-ui/react/use-render';
import type { ComponentPropsWithRef } from 'react';
import { IconButtonContent } from './IconButton';
import type { IconButtonSize, IconButtonVariant } from './IconButton';
import styles from './IconButton.module.css';

export interface LinkIconButtonProps extends Omit<
  ComponentPropsWithRef<'a'>,
  'aria-label' | 'aria-labelledby'
> {
  /**
   * The link's accessible name. Required: there is no visible text to fall back on. As on
   * `IconButton`, the type rejects `aria-label` and `aria-labelledby`, so nothing can replace it.
   */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /**
   * A small count in the top-end corner, hidden from assistive technology. Put the count in `label`
   * as well ("Messages, 3 unread"). Nothing shows for 0 or undefined; above 99 it reads "99+".
   */
  badge?: number;
  /**
   * Replaces the rendered `<a>` so a router link can wear the icon button styling; the element's
   * own props are merged with the ones this component supplies.
   */
  render?: useRender.RenderProp;
}

/**
 * A link that looks like an `IconButton`. It shares `IconButton`'s styling, size and focus ring but
 * none of its semantics: no `role`, no button keyboard handling, so assistive technology announces
 * a link, Enter follows it once and Space does not activate it. Use it for navigation; use
 * `IconButton` for anything that acts on the current page. A link is never pressed, busy or
 * disabled, so it has no `pressed`, `loading` or `disabled`.
 */
export function LinkIconButton({
  label,
  variant = 'ghost',
  size = 'md',
  badge,
  className,
  children,
  render,
  ref,
  ...rest
}: LinkIconButtonProps) {
  return useRender<Record<string, unknown>, HTMLAnchorElement>({
    defaultTagName: 'a',
    render,
    ref,
    props: {
      ...rest,
      className: [styles.root, className].filter(Boolean).join(' '),
      'data-variant': variant,
      'data-size': size,
      'aria-label': label,
      children: <IconButtonContent icon={children} badge={badge} />,
    },
  });
}
