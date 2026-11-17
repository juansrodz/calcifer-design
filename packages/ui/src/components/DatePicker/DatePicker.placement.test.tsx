import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { forwardRef, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type * as PopoverModule from '@base-ui/react/popover';
import { DatePicker } from './DatePicker';

// jsdom lays nothing out, so where Floating UI would put the calendar cannot be measured here; the
// browser check in the release report does that against the `InEndDrawer` story. This file pins
// the two things that decide it: what the positioner is told, and when the grid keeps its room.

const recordedPositionerProps = vi.hoisted(() => [] as Record<string, unknown>[]);

vi.mock('@base-ui/react/popover', async (importOriginal) => {
  const original = await importOriginal<typeof PopoverModule>();
  const OriginalPositioner = original.Popover.Positioner;
  const RecordingPositioner = forwardRef<HTMLDivElement, ComponentProps<typeof OriginalPositioner>>(
    function RecordingPositioner(props, ref) {
      recordedPositionerProps.push(props as Record<string, unknown>);
      return <OriginalPositioner ref={ref} {...props} />;
    },
  );
  return { ...original, Popover: { ...original.Popover, Positioner: RecordingPositioner } };
});

describe('DatePicker placement', () => {
  it('never falls back to the side of its trigger, where an end drawer has only the scrim', async () => {
    render(<DatePicker label="Event date" name="eventDate" defaultValue="2026-11-20" />);
    await userEvent.click(screen.getByRole('button', { name: /Event date/ }));
    await screen.findByRole('dialog');
    const lastProps = recordedPositionerProps.at(-1);
    expect(lastProps).toMatchObject({ align: 'start', sideOffset: 8 });
    expect(lastProps?.['side']).toBeUndefined();
    expect(lastProps?.['collisionAvoidance']).toEqual({ fallbackAxisSide: 'none' });
  });
});

describe('the room kept for a sixth week', () => {
  const stylesheet = readFileSync(join(import.meta.dirname, 'DatePicker.module.css'), 'utf-8');

  it('is kept only while the calendar sits above its trigger', () => {
    const aboveRule = stylesheet.match(/^\.popup\[data-side='top'\] \.gridSlot \{([^}]*)\}/m);
    expect(aboveRule?.[1]).toContain('min-height: calc(7 * var(--size-touch));');
  });

  it('is not kept below the trigger, where a shorter month moves no button', () => {
    expect(stylesheet).not.toMatch(/^\.gridSlot \{[^}]*min-height/m);
  });
});
