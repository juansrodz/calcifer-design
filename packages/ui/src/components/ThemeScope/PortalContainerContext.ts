import { createContext, useContext } from 'react';

/**
 * A Base UI `container` value: the scope's portal host element, or `null` while it has not
 * attached yet. Base UI waits on an explicit `null` and resolves the portal once the element
 * arrives (R19).
 */
export type PortalContainer = HTMLDivElement | null;

/**
 * The nearest `ThemeScope`'s portal host. `undefined` is the default and means there is no scope:
 * Base UI then portals to `<body>`, exactly as before scopes existed (R6). Internal: the hook is
 * the public way in.
 */
export const PortalContainerContext = createContext<PortalContainer | undefined>(undefined);

/**
 * The nearest `ThemeScope`'s portal host (`null` until the scope's first commit has attached it),
 * or `undefined` outside any scope. Pass it as `container` to a Base UI `Portal`.
 */
export function usePortalContainer(): PortalContainer | undefined {
  return useContext(PortalContainerContext);
}
