import { Field as BaseField } from '@base-ui/react/field';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { useId, type ReactNode } from 'react';
import { useControllable } from '../../hooks/useControllable';
import { CheckIcon } from '../../icons/CheckIcon';
import { hasContent } from '../../utils/hasContent';
import type { FieldFrameProps } from '../Field/Field';
import { GroupFrame } from '../Field/GroupFrame';
import styles from './ChoiceCard.module.css';

export interface ChoiceCardOption {
  /** Submitted with the form, and what `value`/`onValueChange` speak in. */
  value: string;
  /** The card's title, and its radio's accessible name. The description is not part of it. */
  label: string;
  /**
   * A line under the title. Phrasing content only: the card is one `<label>`. It joins the
   * radio's accessible description, not its name.
   */
  description?: ReactNode;
  /** Drawn in a disc above the title. Decorative, so it stays out of the accessible name. */
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ChoiceCardProps extends FieldFrameProps {
  /** Names the group. Rendered as a plain element, not a `<label>`, as `RadioGroup` does. */
  label: string;
  options: readonly ChoiceCardOption[];
  /** Controlled; `null` chooses nothing. Pair it with `onValueChange`, or use `defaultValue`. */
  value?: string | null;
  defaultValue?: string | null;
  /**
   * The newly chosen option's value. One argument, as on every other control in the tier: Base UI
   * calls its own callback `(value, eventDetails)` and this wrapper drops the second.
   */
  onValueChange?: (value: string) => void;
  /** Called when the focus leaves a card, as `RadioGroup`'s `onBlur` is. */
  onBlur?: () => void;
  /** How many cards sit side by side. The arrow keys follow the cards' order either way. */
  columns?: 1 | 2;
}

interface ChoiceCardItemProps {
  option: ChoiceCardOption;
  checked: boolean;
}

/** One card. A component of its own because each card needs two ids of its own from `useId`. */
function ChoiceCardItem({ option, checked }: ChoiceCardItemProps) {
  const titleId = useId();
  const descriptionId = useId();
  const hasDescription = hasContent(option.description);
  return (
    // `Field.Item` scopes the control id per option, as in `RadioGroup`. It is the grid's item, so
    // it is a column the card grows to fill: the cards of a row come out one height.
    <BaseField.Item className={styles.item} disabled={option.disabled}>
      {/* The label wraps the whole card, so a press anywhere on it chooses the radio. Base UI
          writes `data-disabled` on it; `data-checked` it cannot know, so the group passes it. */}
      <BaseField.Label className={styles.card} data-checked={checked ? '' : undefined}>
        {hasContent(option.icon) ? (
          <span className={styles.disc} aria-hidden="true">
            {option.icon}
          </span>
        ) : null}
        <span className={styles.title} id={titleId}>
          {option.label}
        </span>
        {hasDescription ? (
          <span className={styles.description} id={descriptionId}>
            {option.description}
          </span>
        ) : null}
        {/* An explicit `aria-labelledby` wins over the link the wrapping label would give, so the
            radio is named by the title alone and the description joins it as a description. */}
        <BaseRadio.Root
          className={styles.ring}
          value={option.value}
          aria-labelledby={titleId}
          aria-describedby={hasDescription ? descriptionId : undefined}
        >
          <BaseRadio.Indicator className={styles.mark}>
            <CheckIcon />
          </BaseRadio.Indicator>
        </BaseRadio.Root>
      </BaseField.Label>
    </BaseField.Item>
  );
}

export function ChoiceCard({
  label,
  options,
  name,
  description,
  error,
  value,
  defaultValue,
  onValueChange,
  onBlur,
  required = false,
  disabled = false,
  columns = 2,
}: ChoiceCardProps) {
  const labelId = useId();
  // Each card's `data-checked` needs the chosen value, which Base UI keeps to itself when it owns
  // it. So the group always hands Base UI a value: the consumer's when they control it, a held one
  // otherwise.
  const [chosenValue, setChosenValue] = useControllable(value, defaultValue ?? null);
  return (
    <GroupFrame
      labelId={labelId}
      label={label}
      name={name}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
    >
      <BaseRadioGroup<string | null>
        className={styles.grid}
        data-columns={columns}
        aria-labelledby={labelId}
        value={chosenValue}
        onValueChange={(nextValue) => {
          // Base UI reports the value of the radio that was pressed, never `null`; the type
          // admits it only because the group can be told to hold none.
          if (nextValue === null) {
            return;
          }
          setChosenValue(nextValue);
          // One argument out, whatever Base UI passes in — see the prop's doc.
          onValueChange?.(nextValue);
        }}
        onBlur={onBlur}
        required={required}
      >
        {options.map((option) => (
          <ChoiceCardItem
            key={option.value}
            option={option}
            checked={chosenValue === option.value}
          />
        ))}
      </BaseRadioGroup>
    </GroupFrame>
  );
}
