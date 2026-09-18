import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ReactNode } from 'react';

/**
 * Base UI's own default hover delay, in milliseconds, re-exported as a constant so the shell and
 * every remote use one value across the federation seam. A remote that mounts its own provider
 * with this number produces the same feel as the host's, which is the whole point: the seam
 * should be invisible to someone moving the pointer across it.
 */
export const TOOLTIP_DELAY = 600;

export interface TooltipProviderProps {
  children?: ReactNode;
  /** Hover delay in milliseconds shared by every tooltip below this provider. */
  delay?: number;
  /** How long a tooltip waits before closing, in milliseconds. */
  closeDelay?: number;
}

/**
 * Groups the tooltips below it, so that once one has opened its neighbours open instantly.
 *
 * It renders no DOM, mounts no portal and attaches no window listeners — two React contexts and
 * a timer — which is why every federated remote mounts its own instead of trying to reach the
 * host's through context, which cannot cross a React root boundary. It is also optional: without
 * one, each trigger falls back to this same delay on its own.
 */
export function TooltipProvider({
  children,
  delay = TOOLTIP_DELAY,
  closeDelay,
}: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={delay} closeDelay={closeDelay}>
      {children}
    </BaseTooltip.Provider>
  );
}
