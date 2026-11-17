import { SearchField } from '../SearchField/SearchField';
import styles from './DataGrid.module.css';
import { useDebouncedDraft } from './useDebouncedDraft';

const searchDelayMs = 400;

export interface GridSearchProps {
  /** The field's name. */
  label: string;
  clearLabel: string;
  /** The search in the query. */
  value: string;
  /** Called once typing pauses, on Enter, on clearing, and when focus leaves with a change pending. */
  onSearchChange: (term: string) => void;
  /** Escape in the empty field: the grid closes the field. */
  onClose: () => void;
  onFocus: () => void;
}

/**
 * The toolbar's search field, on the library's `SearchField`. What is typed applies 400ms after
 * typing stops, or at once on Enter; the clear button, and Escape with text, clear it at once.
 * Escape in the empty field closes it. Leaving the field applies a pending change, so that a click
 * elsewhere, such as on Clear filters, acts on the query with it, as a text filter does.
 */
export function GridSearch({
  label,
  clearLabel,
  value,
  onSearchChange,
  onClose,
  onFocus,
}: GridSearchProps) {
  const { draft, change, flush, commitNow } = useDebouncedDraft(
    value,
    onSearchChange,
    searchDelayMs,
  );
  return (
    <SearchField
      label={label}
      hideLabel
      size="sm"
      clearLabel={clearLabel}
      className={styles.search}
      value={draft}
      onValueChange={change}
      // Enter submits what is typed; the clear button and Escape with text submit `''`.
      onSubmit={(term) => (term === '' ? commitNow('') : flush())}
      onKeyDown={(event) => {
        // The keys that commit or cancel an IME candidate belong to the composition.
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        // A search never submits a form the grid sits in.
        if (event.key === 'Enter') event.preventDefault();
        if (event.key === 'Escape' && event.currentTarget.value === '') {
          // The key closed the field, so it closes nothing else, such as a dialog around the grid.
          event.preventDefault();
          event.stopPropagation();
          flush();
          onClose();
        }
      }}
      onFocus={onFocus}
      onBlur={flush}
      data-grid-search-field=""
    />
  );
}
