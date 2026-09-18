import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ReactElement } from 'react';
import popupStyles from '../../styles/popup.module.css';
import type { PopupAlign, PopupSide } from '../Popover/Popover';

export interface TooltipProps {
  /**
   * The control the tip describes, rendered as the trigger itself: it must be a single element
   * that produces a native `<button>`.
   */
  trigger: ReactElement;
  /**
   * The tip's text, applied to the trigger as `aria-label`. Base UI merges the render element's
   * own props last, so this becomes the trigger's accessible name only when the trigger carries
   * no `aria-label` of its own — a trigger that already has one (as `IconButton` always does,
   * from its required `label`) keeps its own, and the two must then be kept identical by hand;
   * nothing here enforces that.
   *
   * Base UI's tooltip puts nothing in the accessibility tree: the popup carries no
   * `role="tooltip"`, the trigger gets no `aria-describedby`, and it is disabled on touch
   * devices. This is therefore a label for a control that has no visible text, not a place for
   * prose — for a sentence of help use `Popover`, and for feedback about something that just
   * happened use a toast.
   */
  label: string;
  side?: PopupSide;
  align?: PopupAlign;
  /** Gap between the trigger and the popup, in pixels. */
  sideOffset?: number;
  /**
   * Hover delay in milliseconds for this trigger alone. Leave it out and the tooltip takes the
   * delay from the nearest `TooltipProvider`, falling back to Base UI's own 600ms.
   */
  delay?: number;
}

export function Tooltip({
  trigger,
  label,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  delay,
}: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={trigger} aria-label={label} delay={delay} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          className={popupStyles.layer}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseTooltip.Popup className={popupStyles.surface} data-popup="tooltip">
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
