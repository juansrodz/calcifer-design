import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Fragment, type ReactElement, type ReactNode } from 'react';
import { hasContent } from '../../utils/hasContent';
import { usePortalContainer } from '../ThemeScope/PortalContainerContext';
import popupStyles from '../../styles/popup.module.css';
import type { PopupAlign, PopupSide } from '../Popover/Popover';
import styles from './Menu.module.css';

export interface MenuItem {
  /** Stable across renders; used as the React key. */
  id: string;
  /** The visible text, and what Base UI's typeahead matches against. */
  label: string;
  /**
   * Content before the label: an icon from your own set (an `<svg>` is sized to 1rem and coloured
   * by the text-muted role, as on `Select`'s `startIcon`) or a small avatar, such as an
   * `<Avatar size="xs" />` for the person the item names. Absent (or `null`, `false`, `''`), the
   * item is exactly what it is without the prop.
   *
   * It is decorative: the slot is `aria-hidden`, so nothing in it (an avatar's hidden name
   * included) is announced, and typeahead matches the `label`, not the slot's text. Keep it free of
   * anything focusable, and say what it means in the `label` when the label does not already.
   *
   * Under forced colours the item under the pointer is filled `Highlight`, and everything in the
   * slot takes its `HighlightText` ink, borders and backgrounds included. A literal `fill` or
   * `stroke` attribute, a shadow or an image (an avatar's photo) is drawn as authored there, so an
   * icon should paint with `currentColor`.
   */
  startIcon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  /** Draws a hairline above this item, separating the group below from the one above. */
  separatorBefore?: boolean;
}

export interface MenuProps {
  /**
   * The control that opens the menu, rendered as the trigger itself: it must be a single element
   * that produces a native `<button>`, and the popup takes its accessible name from it.
   */
  trigger: ReactElement;
  items: MenuItem[];
  side?: PopupSide;
  align?: PopupAlign;
  /** Gap between the trigger and the popup, in pixels. */
  sideOffset?: number;
  /**
   * Base UI defaults this to `true`, which locks page scroll and blocks pointer interaction
   * outside. A menu hanging off a toolbar button is not that, and `NavMenu` already ships
   * `modal={false}` for the same reason, so the default is inverted here.
   */
  modal?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  /** Base UI calls this as `(open, eventDetails)`; the second argument is passed through. */
  onOpenChange?: (open: boolean, eventDetails: unknown) => void;
}

export function Menu({
  trigger,
  items,
  side = 'bottom',
  align = 'end',
  sideOffset = 8,
  modal = false,
  open,
  defaultOpen,
  onOpenChange,
}: MenuProps) {
  const container = usePortalContainer();
  return (
    <BaseMenu.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal container={container}>
        <BaseMenu.Positioner
          className={popupStyles.layer}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseMenu.Popup className={popupStyles.surface} data-popup="menu">
            {items.map((item) => (
              <Fragment key={item.id}>
                {item.separatorBefore === true ? (
                  <BaseMenu.Separator className={styles.separator} />
                ) : null}
                <BaseMenu.Item
                  className={styles.item}
                  disabled={item.disabled}
                  onClick={item.onSelect}
                  // Typeahead reads the item's text otherwise, and the slot's (an avatar's
                  // initials) comes first.
                  label={item.label}
                >
                  {hasContent(item.startIcon) ? (
                    <span className={styles.startIcon} aria-hidden="true">
                      {item.startIcon}
                    </span>
                  ) : null}
                  {item.label}
                </BaseMenu.Item>
              </Fragment>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
