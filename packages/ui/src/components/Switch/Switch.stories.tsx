import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, within } from 'storybook/test';
import type { PaintCheck } from '../../../.storybook/paint-checks';
import { Switch } from './Switch';

const meta = {
  title: 'Forms/Switch',
  component: Switch,
  args: { label: 'Email me when someone joins', name: 'notify', onCheckedChange: fn() },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Described: Story = {
  args: { description: 'One message per event, never a digest.' },
};
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
export const WithError: Story = { args: { required: true, error: 'Turn this on to continue.' } };

/** Resolves a CSS colour on a probe in the story, as the track and thumb would paint it. */
function resolveColour(canvasElement: HTMLElement, value: string): string {
  const probe = canvasElement.ownerDocument.createElement('span');
  probe.style.color = value;
  canvasElement.append(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
}

/**
 * The two unchecked-track hooks, `--switch-track-unchecked-background` and
 * `--switch-track-unchecked-border-color`, set from a class on a wrapper (they inherit): here a solid
 * track with no edge of its own, as the WBW mock draws its switch (4e). The mock's lavender is the
 * app's to set; this story fills the track with the control colour instead, so it still holds 3:1
 * on every surface, as WCAG 1.4.11 asks and as a consumer's own colours must. Checked, the two
 * unchecked hooks do not reach the track; `TrackAndThumbHooks` shows the checked pair.
 */
export const UncheckedTrack: Story = {
  decorators: [
    (Story) => (
      <>
        <style>{`.switch-unchecked-track {
  --switch-track-unchecked-background: var(--color-border-control);
  --switch-track-unchecked-border-color: transparent;
}`}</style>
        <div className="switch-unchecked-track">
          <Story />
        </div>
      </>
    ),
  ],
  // Runs in a browser only (jsdom resolves no custom properties): the track reads both hooks.
  play: async ({ canvasElement }) => {
    const track = within(canvasElement).getByRole('switch', {
      name: 'Email me when someone joins',
    });
    const controlColour = resolveColour(canvasElement, 'var(--color-border-control)');
    const trackStyle = getComputedStyle(track);
    await expect(trackStyle.backgroundColor).toBe(controlColour);
    await expect(trackStyle.borderTopColor).toBe('rgba(0, 0, 0, 0)');
  },
};

export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultChecked: true } };

// The colours TrackAndThumbHooks sets, one per hook and no two alike, so a hook read in the wrong
// place shows. Each holds the ratios a consumer owns, in both themes: the unchecked fill and the
// checked edge are 3:1 or more on every surface, and the thumb is 4.5:1 or more on both fills.
const hookColours = {
  uncheckedBackground: 'var(--color-text-muted)',
  uncheckedBorder: 'transparent',
  checkedBackground: 'var(--color-text)',
  checkedBorder: 'var(--color-border-control)',
  thumb: 'var(--color-surface-1)',
} as const;

// What forced colours paint whatever the hooks say, for each track and thumb. Run by
// `.storybook/paint-checks.ts` (installed from `test-runner-jest.config.js`) under a real pointer;
// hovering changes no colour here, so each check reads the resting forced paint.
const forcedColourChecks = [
  {
    target: "[role='switch'][aria-checked='false']",
    interaction: 'hover',
    forcedColors: true,
    expected: { backgroundColor: 'Canvas' },
  },
  {
    target: "[role='switch'][aria-checked='false'] > span",
    interaction: 'hover',
    forcedColors: true,
    expected: { backgroundColor: 'ButtonText' },
  },
  {
    target: "[role='switch'][aria-checked='true']",
    interaction: 'hover',
    forcedColors: true,
    expected: { backgroundColor: 'Highlight' },
  },
  {
    target: "[role='switch'][aria-checked='true'] > span",
    interaction: 'hover',
    forcedColors: true,
    expected: { backgroundColor: 'HighlightText' },
  },
] satisfies readonly PaintCheck[];

/**
 * All five hooks, set from a class on a wrapper (they inherit): the unchecked track's
 * `--switch-track-unchecked-background` and `--switch-track-unchecked-border-color`, the checked
 * track's `--switch-track-checked-background` and `--switch-track-checked-border-color`, and the
 * thumb's `--switch-thumb-background`, which both states read. Each pair reaches its own state
 * only. The colours are the story's, chosen to hold 3:1, as a consumer's own must. Forced colours
 * ignore every hook: the paint checks pin the system colours.
 */
export const TrackAndThumbHooks: Story = {
  parameters: { controls: { disable: true }, paintChecks: forcedColourChecks },
  render: () => (
    <>
      <style>{`.switch-hooks {
  --switch-track-unchecked-background: ${hookColours.uncheckedBackground};
  --switch-track-unchecked-border-color: ${hookColours.uncheckedBorder};
  --switch-track-checked-background: ${hookColours.checkedBackground};
  --switch-track-checked-border-color: ${hookColours.checkedBorder};
  --switch-thumb-background: ${hookColours.thumb};
}`}</style>
      <div className="switch-hooks" style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <Switch label="Email me when someone joins" name="notify" />
        <Switch label="Text me the day before" name="remind" defaultChecked />
      </div>
    </>
  ),
  // Runs in a browser only (jsdom resolves no custom properties): each track and thumb paints its
  // own hook's colour, resolved on a probe in this theme.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const unchecked = canvas.getByRole('switch', { name: 'Email me when someone joins' });
    const checked = canvas.getByRole('switch', { name: 'Text me the day before' });
    await expect(unchecked).toHaveAttribute('aria-checked', 'false');
    await expect(checked).toHaveAttribute('aria-checked', 'true');
    const uncheckedStyle = getComputedStyle(unchecked);
    const checkedStyle = getComputedStyle(checked);
    const expected = Object.fromEntries(
      Object.entries(hookColours).map(([hook, value]) => [
        hook,
        resolveColour(canvasElement, value),
      ]),
    ) as Record<keyof typeof hookColours, string>;
    await expect(new Set(Object.values(expected)).size).toBe(5);
    await expect(uncheckedStyle.backgroundColor).toBe(expected.uncheckedBackground);
    await expect(uncheckedStyle.borderTopColor).toBe(expected.uncheckedBorder);
    await expect(checkedStyle.backgroundColor).toBe(expected.checkedBackground);
    await expect(checkedStyle.borderTopColor).toBe(expected.checkedBorder);
    for (const track of [unchecked, checked]) {
      const thumb = track.firstElementChild;
      if (!(thumb instanceof HTMLElement)) {
        throw new Error('the switch has no thumb');
      }
      await expect(getComputedStyle(thumb).backgroundColor).toBe(expected.thumb);
    }
  },
};

/** The same five hooks in the dark theme. The play is named again: the indexer reads no spread. */
export const TrackAndThumbHooksDark: Story = {
  ...TrackAndThumbHooks,
  globals: { theme: 'dark' },
  play: TrackAndThumbHooks.play,
};
