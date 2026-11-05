import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { CheckIcon } from '../../icons/CheckIcon';
import { MinusIcon } from '../../icons/MinusIcon';
import fieldStyles from '../../styles/field.module.css';
import checkboxStyles from '../Checkbox/Checkbox.module.css';

export interface GridCheckboxProps {
  /** The checkbox's accessible name. There is no visible label. */
  label: string;
  checked: boolean;
  /** Neither ticked nor unticked: the state of select-all over a partial selection. */
  indeterminate?: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  tabIndex?: number;
}

/**
 * The bare checkbox of the selection column: `Checkbox` without its field row and label, which a
 * grid cell has no room for.
 */
export function GridCheckbox({
  label,
  checked,
  indeterminate = false,
  disabled = false,
  onCheckedChange,
  tabIndex,
}: GridCheckboxProps) {
  return (
    <BaseCheckbox.Root
      className={[fieldStyles.controlBox, checkboxStyles.box].join(' ')}
      aria-label={label}
      checked={checked}
      indeterminate={indeterminate}
      disabled={disabled}
      tabIndex={tabIndex}
      // One argument out, whatever Base UI passes in.
      onCheckedChange={(nextChecked) => onCheckedChange(nextChecked)}
    >
      <BaseCheckbox.Indicator className={checkboxStyles.indicator}>
        {indeterminate ? <MinusIcon /> : <CheckIcon />}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
