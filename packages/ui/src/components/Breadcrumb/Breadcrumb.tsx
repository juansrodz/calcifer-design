import type { ReactElement } from 'react';
import type { LinkRenderProps } from '../NavMenu/NavMenu';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
  label: string;
  /**
   * Makes the item a link. Ignored on the last item, which is the page the reader is on, and
   * optional before it for a level with no page of its own.
   */
  href?: string;
}

export interface BreadcrumbProps {
  /** The trail, outermost first. The last item is the current page. */
  items: BreadcrumbItem[];
  /** The navigation landmark's name. */
  'aria-label'?: string;
  /**
   * Lets the app render router links; defaults to a plain anchor. Called only for an item that
   * is a link, so `href` is always there.
   */
  renderLink?: (item: BreadcrumbItem & { href: string }, props: LinkRenderProps) => ReactElement;
}

function defaultRenderLink(
  item: BreadcrumbItem & { href: string },
  { children, ...linkProps }: LinkRenderProps,
): ReactElement {
  return (
    <a href={item.href} {...linkProps}>
      {children}
    </a>
  );
}

function renderItemContent(
  item: BreadcrumbItem,
  isLast: boolean,
  renderLink: NonNullable<BreadcrumbProps['renderLink']>,
): ReactElement {
  if (isLast) {
    return (
      <span className={styles.current} aria-current="page">
        {item.label}
      </span>
    );
  }
  if (item.href === undefined) {
    return <span className={styles.text}>{item.label}</span>;
  }
  return renderLink({ ...item, href: item.href }, { className: styles.link, children: item.label });
}

export function Breadcrumb({
  items,
  'aria-label': ariaLabel = 'Breadcrumb',
  renderLink = defaultRenderLink,
}: BreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <nav aria-label={ariaLabel}>
      <ol className={styles.list}>
        {items.map((item, index) => (
          // By position: a trail's items have no id, and neither `label` nor `href` has to be
          // unique. A step of the trail is what its position says it is.
          <li key={index} className={styles.item}>
            {index > 0 ? (
              <span className={styles.separator} aria-hidden="true">
                /
              </span>
            ) : null}
            {renderItemContent(item, index === items.length - 1, renderLink)}
          </li>
        ))}
      </ol>
    </nav>
  );
}
