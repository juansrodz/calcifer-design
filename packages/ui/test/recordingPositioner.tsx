import type * as PopoverModule from '@base-ui/react/popover';
import { forwardRef, type ComponentProps } from 'react';

/** The props each `Popover.Positioner` was rendered with, oldest first. */
export const recordedPositionerProps: Record<string, unknown>[] = [];

/**
 * For a `vi.mock('@base-ui/react/popover', …)` factory: hands back the module with its
 * `Popover.Positioner` swapped for one that records its props into `recordedPositionerProps`
 * and renders the original. jsdom lays nothing out, so a test of placement can pin only what the
 * positioner is told. Reach it through a dynamic `import()` in the factory, which is hoisted
 * above the file's imports.
 */
export function withRecordingPositioner(original: typeof PopoverModule): typeof PopoverModule {
  const OriginalPositioner = original.Popover.Positioner;
  const RecordingPositioner = forwardRef<HTMLDivElement, ComponentProps<typeof OriginalPositioner>>(
    function RecordingPositioner(props, ref) {
      recordedPositionerProps.push(props as Record<string, unknown>);
      return <OriginalPositioner ref={ref} {...props} />;
    },
  );
  return { ...original, Popover: { ...original.Popover, Positioner: RecordingPositioner } };
}
