import { TextInput } from '../TextInput/TextInput';
import { useDebouncedDraft } from './useDebouncedDraft';

const textFilterDelayMs = 300;

export interface GridTextFilterProps {
  /** "Filter by <column>". */
  label: string;
  /** The filter's value in the query. */
  value: string;
  /** Called once typing pauses, on Enter, and when focus leaves the field with a change pending. */
  onValueChange: (value: string) => void;
}

/**
 * A column's text filter in the filter strip: what is typed applies 300ms after typing stops, or at
 * once on Enter. Leaving the field applies a pending change too, so that a click elsewhere, such as
 * on Clear filters, acts on the query with it, and the typed text never comes back afterwards.
 */
export function GridTextFilter({ label, value, onValueChange }: GridTextFilterProps) {
  const { draft, change, flush } = useDebouncedDraft(value, onValueChange, textFilterDelayMs);
  return (
    <TextInput
      type="search"
      aria-label={label}
      value={draft}
      onValueChange={change}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return;
        // A filter never submits a form the grid sits in.
        event.preventDefault();
        flush();
      }}
      onBlur={flush}
    />
  );
}
