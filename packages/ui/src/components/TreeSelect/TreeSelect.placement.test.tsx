import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type * as PopoverModule from '@base-ui/react/popover';
import { recordedPositionerProps } from '../../../test/recordingPositioner';
import { TreeSelect } from './TreeSelect';

// jsdom lays nothing out, so where Floating UI would put the tree cannot be measured here; the
// browser check in the release report does that against the `InEndDrawer` story. This file pins
// what decides it: what the positioner is told.

vi.mock('@base-ui/react/popover', async (importOriginal) => {
  const { withRecordingPositioner } = await import('../../../test/recordingPositioner');
  return withRecordingPositioner(await importOriginal<typeof PopoverModule>());
});

describe('TreeSelect placement', () => {
  it('never falls back to the side of its trigger, where an end drawer has only the scrim', async () => {
    render(
      <TreeSelect
        label="Team"
        name="team"
        items={[
          { id: 'design', label: 'Design' },
          { id: 'finance', label: 'Finance' },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Team/ }));
    await screen.findByRole('tree');
    const lastProps = recordedPositionerProps.at(-1);
    expect(lastProps).toMatchObject({ align: 'start', sideOffset: 8 });
    expect(lastProps?.['side']).toBeUndefined();
    expect(lastProps?.['collisionAvoidance']).toEqual({ fallbackAxisSide: 'none' });
  });
});
