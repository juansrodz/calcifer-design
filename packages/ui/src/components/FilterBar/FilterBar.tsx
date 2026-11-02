import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CloseIcon } from '../../icons/CloseIcon';
import { Button } from '../Button/Button';
import { Field } from '../Field/Field';
import { LiveRegion } from '../LiveRegion/LiveRegion';
import { Tag } from '../Tag/Tag';
import { TextInput } from '../TextInput/TextInput';
import styles from './FilterBar.module.css';

export interface FilterBarFilter {
  /** What `onRemoveFilter` reports. */
  id: string;
  /** The chip's text, and the end of its remove button's name. */
  label: string;
}

export interface FilterBarLabels {
  /** Names the list of chips. */
  activeFilters: string;
  /** The name of one chip's remove button. */
  removeFilter: (label: string) => string;
  /** The words on the button that clears every filter. */
  clearAll: string;
  /** Shown beside the chips, and announced when the count changes. */
  resultCount: (count: number) => string;
}

const DEFAULT_LABELS: FilterBarLabels = {
  activeFilters: 'Active filters',
  removeFilter: (label) => `Remove filter ${label}`,
  clearAll: 'Clear all',
  resultCount: (count) => `${count} ${count === 1 ? 'result' : 'results'}`,
};

const FOCUSABLE =
  'input:not([disabled],[type="hidden"]),button:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]';

interface FilterBarBaseProps {
  /** The filter controls, each with its own label: a `Select`, a `DatePicker`, a `Segmented`. */
  children?: ReactNode;
  /** Shown as chips, in this order. Which filters are on, and what they do, is the app's. */
  activeFilters?: FilterBarFilter[];
  /** One filter's `id`. Each chip has a named remove button while this is given. */
  onRemoveFilter?: (id: string) => void;
  /** A button clears all the chips while this is given and there are chips to clear. */
  onClearAll?: () => void;
  /** Shown beside the chips and announced politely when it changes, not when first shown. */
  resultCount?: number;
  /** The words the bar says itself, for an app that is not in English. */
  labels?: Partial<FilterBarLabels>;
}

interface FilterBarWithSearch extends FilterBarBaseProps {
  /** Controlled, like the filters: the bar holds no filter state of its own. */
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** The search input's visible label and accessible name. */
  searchLabel: string;
}

interface FilterBarWithoutSearch extends FilterBarBaseProps {
  searchValue?: undefined;
  onSearchChange?: undefined;
  searchLabel?: undefined;
}

export type FilterBarProps = FilterBarWithSearch | FilterBarWithoutSearch;

/**
 * The row above a results list: a search, slots for filter controls, the active filters as chips
 * and the count. It holds no filter logic, and only says what the app asked for.
 *
 * Focus does not go with what it was on. A removed chip hands it to the next chip, else the one
 * before; when no chip is left, or Clear all has gone, it passes to the first thing here that can
 * take it, usually the search, and at the last to the bar itself. It waits as long as the app takes
 * to remove the chip, and lets go if the user moves on first.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchLabel,
  children,
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  resultCount,
  labels,
}: FilterBarProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const rootRef = useRef<HTMLDivElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  // `{ filterId: null }` is the Clear all button. Cleared on blur, and React fires none for an
  // element it removes, so anything still here after a commit says where focus had been.
  const focusedPart = useRef<{ filterId: string | null } | null>(null);
  const previousFilters = useRef(activeFilters);
  const hasClearAll = onClearAll !== undefined && activeFilters.length > 0;

  // Empty at first: a live region speaks only when its text changes after it has appeared.
  const [announcement, setAnnouncement] = useState('');
  const [announcedCount, setAnnouncedCount] = useState(resultCount);
  if (resultCount !== announcedCount) {
    setAnnouncedCount(resultCount);
    setAnnouncement(resultCount === undefined ? '' : words.resultCount(resultCount));
  }

  useLayoutEffect(() => {
    const part = focusedPart.current;
    const earlier = previousFilters.current;
    previousFilters.current = activeFilters;
    if (part === null) {
      return;
    }
    const { filterId } = part;
    if (filterId === null ? hasClearAll : removeButtons.current.has(filterId)) {
      return;
    }
    const position = earlier.findIndex((filter) => filter.id === filterId);
    const survivor = [...earlier.slice(position + 1), ...earlier.slice(0, position).reverse()]
      .map((filter) => removeButtons.current.get(filter.id))
      .find((button) => button !== undefined);
    const root = rootRef.current;
    (survivor ?? root?.querySelector<HTMLElement>(FOCUSABLE) ?? root)?.focus();
  });

  const hasSummary = activeFilters.length > 0 || resultCount !== undefined;
  return (
    // `tabIndex={-1}`: the last place focus can be handed to, when nothing else here can take it.
    <div ref={rootRef} className={styles.root} tabIndex={-1}>
      {onSearchChange !== undefined || children ? (
        <div className={styles.controls}>
          {onSearchChange === undefined ? null : (
            <div className={styles.search}>
              <Field label={searchLabel}>
                {/* One argument out: Base UI calls with `(value, eventDetails)`. */}
                <TextInput
                  type="search"
                  value={searchValue}
                  onValueChange={(value) => onSearchChange(value)}
                />
              </Field>
            </div>
          )}
          {children}
        </div>
      ) : null}
      {hasSummary ? (
        <div className={styles.summary}>
          {resultCount === undefined ? null : (
            <span className={styles.count}>{words.resultCount(resultCount)}</span>
          )}
          {activeFilters.length > 0 ? (
            // `role="list"` is not redundant: WebKit drops list semantics for `list-style: none`
            // outside a `nav`, and this is what tells a screen reader how many filters are on.
            <ul role="list" className={styles.chips} aria-label={words.activeFilters}>
              {activeFilters.map((filter) => (
                <li key={filter.id} className={styles.chip}>
                  <Tag>
                    <span className={styles.chipLabel}>{filter.label}</span>
                    {onRemoveFilter === undefined ? null : (
                      <button
                        ref={(element) => {
                          if (element !== null) {
                            removeButtons.current.set(filter.id, element);
                          }
                          return () => {
                            removeButtons.current.delete(filter.id);
                          };
                        }}
                        type="button"
                        className={styles.remove}
                        aria-label={words.removeFilter(filter.label)}
                        onClick={() => onRemoveFilter(filter.id)}
                        onFocus={() => {
                          focusedPart.current = { filterId: filter.id };
                        }}
                        onBlur={() => {
                          focusedPart.current = null;
                        }}
                      >
                        <CloseIcon />
                      </button>
                    )}
                  </Tag>
                </li>
              ))}
            </ul>
          ) : null}
          {hasClearAll ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClearAll()}
              onFocus={() => {
                focusedPart.current = { filterId: null };
              }}
              onBlur={() => {
                focusedPart.current = null;
              }}
            >
              {words.clearAll}
            </Button>
          ) : null}
        </div>
      ) : null}
      <LiveRegion message={announcement} />
    </div>
  );
}
