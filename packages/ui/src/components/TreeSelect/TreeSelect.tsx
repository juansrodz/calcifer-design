import { Popover as BasePopover } from '@base-ui/react/popover';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import popupStyles from '../../styles/popup.module.css';
import type { FieldFrameProps } from '../Field/Field';
import { PickerField } from '../Field/PickerField';
import { TreeView, type TreeItem } from '../Tree/Tree';
import { indexItems } from '../Tree/treeIndex';
import styles from './TreeSelect.module.css';

export interface TreeSelectLabels {
  /** Joins the trigger's accessible name when the field is `required`. */
  required: string;
  /** Shown when `Form` submits a `required` field with nothing chosen. */
  requiredMessage: string;
  /** The clear button's name. Defaults to "Clear" and the field's own label. */
  clear: string;
  /** Shown in the popup, in place of the tree, while `items` is empty. */
  empty: string;
}

const DEFAULT_LABELS: Omit<TreeSelectLabels, 'clear'> = {
  required: 'required',
  requiredMessage: 'Choose an option.',
  empty: 'No options',
};

export interface TreeSelectProps extends FieldFrameProps {
  /** The visible label, the start of the trigger's accessible name and the name of the tree. */
  label: string;
  /**
   * The hierarchy, as `Tree` takes it. A new array of the same ids changes no state. While it is
   * empty the popup still opens, says `labels.empty` and takes focus itself.
   */
  items: TreeItem[];
  /** Sits under the trigger and joins its `aria-describedby`. */
  description?: ReactNode;
  /**
   * Draws the required mark and adds the word to the trigger's name. `Form` refuses to submit while
   * nothing is chosen, with `labels.requiredMessage` on the frame. A plain `<form>` is not blocked:
   * the value travels in a hidden input, which has no constraints, so the app validates.
   */
  required?: boolean;
  /**
   * Controlled: a node's `id`, or `null` for nothing chosen. An id no node holds reads as nothing
   * chosen, and nothing is reported for it. A node that is `disabled` can still be the value, since
   * it is the app's to set: it shows and submits, and only cannot be chosen by the user.
   */
  value?: string | null;
  /**
   * Uncontrolled: the first value, and the one a native reset of the surrounding form goes back to,
   * with `onValueChange` told. A controlled `value` stays through a reset, as the parent's to change.
   */
  defaultValue?: string | null;
  /** The chosen node's `id`, or `null` once cleared, in one argument, and only for a real change. */
  onValueChange?: (value: string | null) => void;
  /** Called when focus leaves the trigger, for a form library's "touched". */
  onBlur?: () => void;
  /** Shown on the trigger while nothing is chosen. */
  placeholder?: string;
  /** Shows a button that clears the choice, while there is one. */
  clearable?: boolean;
  /** The words the control says itself, for an app that is not in English. */
  labels?: Partial<TreeSelectLabels>;
}

/**
 * Choose one node from a hierarchy: a button showing the choice opens a `Tree`, with focus on the
 * chosen node and the branches around it opened. Choosing closes it and returns focus, as Escape
 * does. Submits the node's `id` through a hidden input.
 *
 * The popup does not trap focus, as `DatePicker`'s dialog does: there is one tab stop in it, so Tab
 * closes it and moves on. Shift+Tab goes to the trigger and leaves it open, and Escape or a second
 * Shift+Tab closes it from there.
 */
export function TreeSelect({
  label,
  name,
  items,
  description,
  error,
  required = false,
  disabled = false,
  value,
  defaultValue,
  onValueChange,
  onBlur,
  placeholder = 'Select…',
  clearable = false,
  labels,
}: TreeSelectProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [heldValue, setHeldValue] = useState(defaultValue ?? null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  if (open && disabled) {
    setOpen(false);
  }
  const index = useMemo(() => indexItems(items), [items]);
  const nodeOf = (id: string | null) => (id === null ? undefined : index.nodes.get(id));
  const chosenNode = nodeOf(value === undefined ? heldValue : value);
  const chosen = chosenNode?.id ?? null;
  const words = { ...DEFAULT_LABELS, clear: `Clear ${label}`, ...labels };
  const hasItems = index.roots.length > 0;

  const commit = (nextValue: string | null) => {
    setHeldValue(nextValue);
    const nextChosen = nodeOf(nextValue)?.id ?? null;
    if (nextChosen !== chosen) {
      onValueChange?.(nextChosen);
    }
  };

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen && chosenNode !== undefined) {
      setExpandedIds([...new Set([...expandedIds, ...chosenNode.ancestorIds])]);
    }
    setOpen(nextOpen);
  };

  // The tree took its focused item with it, and the page must not be left holding focus.
  useLayoutEffect(() => {
    if (open && !hasItems && document.activeElement === document.body) {
      popupRef.current?.focus();
    }
  }, [open, hasItems]);

  return (
    <PickerField
      label={label}
      name={name}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      value={chosen}
      valueText={chosenNode === undefined ? placeholder : chosenNode.item.label}
      icon={<ChevronDownIcon />}
      iconClassName={styles.chevron}
      requiredWord={words.required}
      validate={() => (required && chosen === null ? words.requiredMessage : null)}
      onReset={() => {
        if (value === undefined) {
          commit(defaultValue ?? null);
        }
      }}
      clearable={clearable}
      clearLabel={words.clear}
      onClear={() => commit(null)}
      onBlur={onBlur}
      onTriggerKeyDown={(event) => {
        // As `Select` opens. A button's own keys already cover Enter and Space.
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (!open) {
            changeOpen(true);
          }
        }
      }}
      open={open}
      onOpenChange={changeOpen}
    >
      <BasePopover.Portal>
        <BasePopover.Positioner className={popupStyles.layer} align="start" sideOffset={8}>
          <BasePopover.Popup
            ref={popupRef}
            className={[popupStyles.surface, styles.popup].join(' ')}
            data-popup="select"
            // Named as the tree inside is: the pattern asks each of them for a name, and the
            // field's label is the only true one either has.
            aria-label={label}
            // The tree's one tab stop, which it has already placed on the chosen node. With no
            // tree, Base UI falls back on the popup itself.
            initialFocus={() => popupRef.current?.querySelector('[tabindex="0"]') ?? true}
          >
            {hasItems ? (
              <TreeView
                items={items}
                aria-label={label}
                selectionMode="single"
                selectedIds={chosen === null ? [] : [chosen]}
                expandedIds={expandedIds}
                onExpandedChange={setExpandedIds}
                onItemChoose={(id) => {
                  commit(id);
                  setOpen(false);
                }}
              />
            ) : (
              // A description, so that it is read out with the popup as focus lands there.
              <BasePopover.Description className={styles.empty}>
                {words.empty}
              </BasePopover.Description>
            )}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </PickerField>
  );
}
