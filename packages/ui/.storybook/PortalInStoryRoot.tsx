import { useState, type ReactElement, type ReactNode } from 'react';
import { PortalContainerContext } from '../src/components/ThemeScope/PortalContainerContext';

interface PortalInStoryRootProps {
  children: ReactNode;
}

/**
 * A story decorator's wrapper that holds a Base UI popup's portal inside the story root, where the
 * test runner's paint checks look; Base UI would otherwise portal the popup to `<body>`. Stories
 * only: outside `src`, so nothing here reaches the library build.
 */
export function PortalInStoryRoot({ children }: PortalInStoryRootProps): ReactElement {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <PortalContainerContext.Provider value={host}>
      {children}
      <div ref={setHost} />
    </PortalContainerContext.Provider>
  );
}
