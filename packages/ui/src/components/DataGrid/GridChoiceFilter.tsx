import { Combobox } from '@base-ui/react/combobox';
import { useId, useMemo, useRef, useState } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import a11yStyles from '../../styles/a11y.module.css';
import fieldStyles from '../../styles/field.module.css';
import popupStyles from '../../styles/popup.module.css';
import { usePortalContainer } from '../ThemeScope/PortalContainerContext';
import type { DataGridFilterOption } from './columns';
import styles from './DataGrid.module.css';

/**
 * A row of the list: one of the column's options, or "All", whose `null` value no option's string
 * value can equal.
 */
interface ChoiceItem {
  value: string | null;
  label: string;
}

export interface GridChoiceFilterProps {
  /** "Filter by <column>". */
  label: string;
  options: readonly DataGridFilterOption[];
  multiple: boolean;
  /** One value, several, or none. */
  value: string | readonly string[] | undefined;
  /** Called at once, with undefined for "All". */
  onValueChange: (value: string | string[] | undefined) => void;
  allLabel: string;
  selectedCountLabel: (count: number) => string;
  noOptionsLabel: string;
}

function isSameItem(first: ChoiceItem, second: ChoiceItem): boolean {
  return first.value === second.value;
}

/**
 * A column's select or multi-select filter in the filter strip: a combobox whose list starts with
 * "All". Typing narrows the list; choosing an item applies at once. A select's input shows its
 * choice; a multi-select's input holds what is typed, and its placeholder, which is also its
 * description, sums up the choice.
 */
export function GridChoiceFilter({
  label,
  options,
  multiple,
  value,
  onValueChange,
  allLabel,
  selectedCountLabel,
  noOptionsLabel,
}: GridChoiceFilterProps) {
  const summaryId = useId();
  const container = usePortalContainer();
  // Controlled, so that the key handler knows whether Escape closes the list or leaves the cell.
  const [open, setOpen] = useState(false);
  const { contains } = Combobox.useFilter();

  const allItem = useMemo<ChoiceItem>(() => ({ value: null, label: allLabel }), [allLabel]);
  // A stable list: Base UI resets a select's text to its choice whenever the list changes.
  const items = useMemo<ChoiceItem[]>(() => [allItem, ...options], [allItem, options]);

  // Stable too, for the same reason: Base UI tells a new value by reference, and the reset would
  // lose the keystroke that opens the list.
  const chosenItems = useMemo<ChoiceItem[]>(() => {
    const chosenValues = value === undefined ? [] : typeof value === 'string' ? [value] : value;
    // A value no option offers, as a query from a link can hold, still shows as itself.
    return chosenValues.map(
      (chosenValue) =>
        options.find((option) => option.value === chosenValue) ?? {
          value: chosenValue,
          label: chosenValue,
        },
    );
  }, [value, options]);
  const [firstChosen] = chosenItems;
  const summary =
    firstChosen === undefined
      ? allLabel
      : chosenItems.length === 1
        ? firstChosen.label
        : selectedCountLabel(chosenItems.length);
  // "All" is the choice while nothing else is, so it shows as chosen.
  const selected = useMemo(() => {
    if (!multiple) return chosenItems[0] ?? allItem;
    return chosenItems.length === 0 ? [allItem] : chosenItems;
  }, [multiple, chosenItems, allItem]);

  // Whether a pointer's press is what focuses the input. The press places the caret after focus
  // has moved, so it would undo a selection made as the input gains focus.
  const pointerFocusingRef = useRef(false);

  const reportChoice = (next: ChoiceItem | ChoiceItem[] | null) => {
    if (!Array.isArray(next)) {
      onValueChange(next?.value ?? undefined);
      return;
    }
    // "All" joins the choice when it is picked over other options; picked again on its own, it
    // leaves the choice empty. Either way the filter goes.
    const pickedAll = chosenItems.length > 0 && next.some((item) => item.value === null);
    const nextValues = next.flatMap((item) => (item.value === null ? [] : [item.value]));
    onValueChange(pickedAll || nextValues.length === 0 ? undefined : nextValues);
  };

  return (
    <Combobox.Root<ChoiceItem, boolean>
      multiple={multiple}
      items={items}
      value={selected}
      onValueChange={(next, eventDetails) => {
        // Only a chosen item changes the filter. Emptying a select's text would clear it too.
        if (eventDetails.reason !== 'item-press') {
          eventDetails.cancel();
          return;
        }
        reportChoice(next);
      }}
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        // A multi-select stays open while its options toggle, narrowed by a query or not.
        if (!nextOpen && multiple && eventDetails.reason === 'item-press') {
          eventDetails.cancel();
          return;
        }
        setOpen(nextOpen);
      }}
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={isSameItem}
      // "All" is no match for what is typed; it shows while nothing is.
      filter={(item, query) => item.value !== null && contains(item.label, query)}
    >
      <div className={styles.choiceFilter}>
        <Combobox.Input
          className={`${fieldStyles.control} ${styles.choiceInput}`}
          aria-label={label}
          placeholder={multiple ? summary : undefined}
          aria-describedby={multiple ? summaryId : undefined}
          onPointerDown={(event) => {
            pointerFocusingRef.current = document.activeElement !== event.currentTarget;
          }}
          onFocus={(event) => {
            const focusedByPointer = pointerFocusingRef.current;
            pointerFocusingRef.current = false;
            // A select's input holds its choice. Selected, that text gives way to what is typed,
            // so the list narrows to it rather than to the choice with the typing after it.
            if (multiple) return;
            const input = event.currentTarget;
            input.select();
            if (!focusedByPointer) return;
            const textAtFocus = input.value;
            // After the press has placed its caret; not once the user has typed or moved on.
            requestAnimationFrame(() => {
              if (document.activeElement === input && input.value === textAtFocus) input.select();
            });
          }}
          onKeyDown={(event) => {
            // A filter never submits a form the grid sits in. Base UI claims an Enter that picks
            // a highlighted item, but leaves the others to the form.
            if (event.key === 'Enter') event.preventDefault();
            // An open list's Escape is Base UI's: it closes the list and claims the key, so the
            // grid keeps focus here. With the list closed, Escape is the grid's, which leaves the
            // cell; Base UI would clear the value instead.
            if (event.key === 'Escape' && !open) event.preventBaseUIHandler();
          }}
        />
        {/* A pointer's way to open the list; the input is the keyboard's and the screen reader's. */}
        <Combobox.Trigger className={styles.choiceTrigger} aria-hidden="true">
          <ChevronDownIcon />
        </Combobox.Trigger>
      </div>
      {multiple ? (
        <span id={summaryId} className={a11yStyles.visuallyHidden}>
          {summary}
        </span>
      ) : null}
      <Combobox.Portal container={container}>
        <Combobox.Positioner className={popupStyles.layer} align="start" sideOffset={8}>
          <Combobox.Popup className={popupStyles.surface} data-popup="select">
            <Combobox.Empty className={styles.choiceEmpty}>{noOptionsLabel}</Combobox.Empty>
            <Combobox.List>
              {(item: ChoiceItem) => (
                <Combobox.Item
                  key={item.value === null ? 'all' : `option-${item.value}`}
                  className={styles.choiceOption}
                  value={item}
                >
                  {item.label}
                  <Combobox.ItemIndicator className={styles.choiceIndicator}>
                    <CheckIcon />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
