import { useState, type FocusEvent } from 'react';

interface IndexedOption {
  value: string;
  disabled?: boolean;
}

/**
 * Internal, not exported from `src/index.ts`. What `Segmented` and `ToggleChipGroup` share on top
 * of Base UI's `ToggleGroup`.
 *
 * Each option is heard by its index, because Base UI's `Toggle` takes `''` for no value at all and
 * generates an id instead: `groupValue` turns the pressed indexes into the group's value, and
 * `optionsAt` reads a new value back as options, in the options' order.
 *
 * Tab lands on the option at `tabStopIndex`. Base UI's `ToggleGroup` has no prop for that and roves
 * from the first enabled option, so while focus is outside the group each `Toggle` is told its
 * `tabIndex` (spread `itemProps` on it, and hand `onGroupBlur` to an element holding them all).
 * Inside the group Base UI roves as usual: an override there would leave the stop's option as a
 * second stop on the way out. A disabled option cannot take focus, so Base UI decides then too, as
 * it does for a `tabStopIndex` of -1.
 */
export function useIndexedToggleGroup<Option extends IndexedOption>(
  options: readonly Option[],
  tabStopIndex: number,
) {
  const [focusedValue, setFocusedValue] = useState<string | null>(null);
  // Read from `options`, not only from blur: React fires none for a focused element it removes.
  const focusIsInside = options.some((option) => option.value === focusedValue && !option.disabled);
  const tabStopOption = options[tabStopIndex];
  const placesTabStop = !focusIsInside && tabStopOption !== undefined && !tabStopOption.disabled;
  return {
    groupValue: (pressedIndexes: readonly number[]) => pressedIndexes.map(String),
    optionsAt: (nextIndexes: readonly string[]) =>
      nextIndexes
        .map(Number)
        .sort((first, second) => first - second)
        .flatMap((index) => {
          const option = options[index];
          return option ? [option] : [];
        }),
    onGroupBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setFocusedValue(null);
      }
    },
    itemProps: (option: Option, index: number) => ({
      onFocus: () => setFocusedValue(option.value),
      ...(placesTabStop ? { tabIndex: index === tabStopIndex ? 0 : -1 } : null),
    }),
  };
}
