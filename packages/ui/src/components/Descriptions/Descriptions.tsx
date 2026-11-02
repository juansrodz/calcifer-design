import { useId, type ReactNode } from 'react';
import pairStyles from '../../styles/pair.module.css';
import { DEFAULT_EMPTY_TEXT, isEmptyValue } from '../ViewField/ViewField';
import styles from './Descriptions.module.css';

export interface DescriptionsItem {
  /** Identifies the item across renders. */
  id: string;
  label: ReactNode;
  value?: ReactNode;
  /** How many columns it takes. Limited to `columns`, and ignored at narrow widths. */
  span?: 1 | 2 | 3;
}

export interface DescriptionsProps {
  items: DescriptionsItem[];
  /**
   * The columns from the `sm` breakpoint up; below it there is one. The breakpoint is the
   * viewport's, so in a narrow place on a wide screen, such as a sidebar, pass `1`.
   */
  columns?: 1 | 2 | 3;
  /** Rendered above the list, and names it through `aria-labelledby`. */
  heading?: ReactNode;
  /** `4` is the extra step `Card` does not have: this often sits inside a card's own `h3`. */
  headingLevel?: 2 | 3 | 4;
  /** Shown instead of a value that is `undefined`, `null`, `false` or `''`. */
  emptyText?: ReactNode;
}

/** A set of label and value pairs in one `<dl>`. For a single pair use `ViewField`. */
export function Descriptions({
  items,
  columns = 2,
  heading,
  headingLevel = 3,
  emptyText = DEFAULT_EMPTY_TEXT,
}: DescriptionsProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={styles.root}>
      {heading ? (
        <Heading id={headingId} className={styles.heading}>
          {heading}
        </Heading>
      ) : null}
      <dl
        className={styles.list}
        data-columns={columns}
        aria-labelledby={heading ? headingId : undefined}
      >
        {items.map((item) => {
          const isEmpty = isEmptyValue(item.value);
          // Clamped here and read from an attribute in the stylesheet, not written as an inline
          // `grid-column`: an inline span would hold at narrow widths too, and `span 2` in a
          // one-column grid conjures a second column and pushes the page sideways.
          const span = Math.min(item.span ?? 1, columns);
          return (
            <div key={item.id} className={styles.group} data-span={span > 1 ? span : undefined}>
              <dt className={pairStyles.label}>{item.label}</dt>
              <dd className={pairStyles.value} data-empty={isEmpty ? '' : undefined}>
                {isEmpty ? emptyText : item.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
