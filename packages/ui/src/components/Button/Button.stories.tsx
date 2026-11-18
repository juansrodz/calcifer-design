import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { CheckIcon } from '../../icons/CheckIcon';
import { ChevronRightIcon } from '../../icons/ChevronRightIcon';
import { Button } from './Button';
import { LinkButton } from './LinkButton';

/**
 * The surface an inverse button is made for: a solid fill the button's own fill must read against.
 * The soft inverse fill is translucent, so it sits on `--color-inverse` (dark in light mode, light
 * in dark mode), which its ink was chosen against; the solid inverse fill sits on the accent.
 */
function Backdrop({ fill, children }: { fill: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: fill,
      }}
    >
      {children}
    </div>
  );
}

const onAccent = [
  (Story: () => ReactNode) => (
    <Backdrop fill="var(--color-accent)">
      <Story />
    </Backdrop>
  ),
];

const onInverse = [
  (Story: () => ReactNode) => (
    <Backdrop fill="var(--color-inverse)">
      <Story />
    </Backdrop>
  ),
];

/** A 16x16 stroke glyph in `currentColor`, sized to the button's text. */
function PlusIcon() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      style={{ verticalAlign: '-0.125em' }}
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

/** A row fills the box it sits in, so a story gives it one to fill. */
const inRowBox = [
  (Story: () => ReactNode) => (
    <div style={{ width: '20rem' }}>
      <Story />
    </div>
  ),
];

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Open projects', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'ghost', 'row'] },
    size: { control: 'radio', options: ['md', 'sm', 'lg'] },
    tone: { control: 'radio', options: ['accent', 'inverse', 'selected'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Small: Story = { args: { size: 'sm' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, children: 'Loading projects' } };

/** The high-contrast fill for a button on an accent or photo surface. */
export const Inverse: Story = { args: { tone: 'inverse' }, decorators: onAccent };
/** The translucent inverse fill; its ink was chosen against `--color-inverse`. */
export const InverseSecondary: Story = {
  args: { variant: 'secondary', tone: 'inverse' },
  decorators: onInverse,
};
/** The inverse primary dims its own fill and ink instead of the whole button. */
export const InverseDisabled: Story = {
  args: { tone: 'inverse', disabled: true },
  decorators: onAccent,
};
export const Selected: Story = { args: { tone: 'selected' } };
export const SelectedSecondary: Story = { args: { variant: 'secondary', tone: 'selected' } };
/** A count after the label; it is part of the accessible name ("Suggestions 2"). */
export const WithBadge: Story = {
  args: { variant: 'secondary', children: 'Suggestions', badge: <span>2</span> },
};
/** The large size, with its leading icon in `startIcon`. */
export const Large: Story = {
  args: {
    size: 'lg',
    tone: 'inverse',
    startIcon: <PlusIcon />,
    children: 'Add an event',
  },
  decorators: onAccent,
};
/** A decorative glyph before the label; it is outside the accessible name. */
export const WithStartIcon: Story = {
  args: { startIcon: <CheckIcon />, children: 'Save changes' },
};
/**
 * `pending` swaps the leading icon for a spinner and keeps the label, so the name stays "Save
 * changes". The button is busy and cannot be activated, but it keeps focus.
 */
export const Pending: Story = { args: { ...WithStartIcon.args, pending: true } };
/**
 * With no leading icon the spinner sits over the label's box and the label stays in the layout,
 * invisible but still the accessible name, so the button does not change width.
 */
export const PendingNoIcon: Story = { args: { pending: true, children: 'Sign in' } };
/** The inverse fill keeps its colour while pending, and the spinner's head takes the button's ink. */
export const PendingInverse: Story = {
  args: { pending: true, tone: 'inverse', startIcon: <CheckIcon />, children: 'Save changes' },
  decorators: onAccent,
};
/**
 * A list row: full width, start-aligned, quiet at rest and `--color-surface-2` on hover and press.
 * The chevron is `endIcon`, decorative and outside the accessible name.
 */
export const Row: Story = {
  args: { variant: 'row', endIcon: <ChevronRightIcon />, children: 'Change password' },
  decorators: inRowBox,
};
/** The row's count is `badge`, so it is part of the name ("Sessions 2"); the chevron is not. */
export const RowWithBadge: Story = {
  args: {
    variant: 'row',
    endIcon: <ChevronRightIcon />,
    badge: <span>2</span>,
    children: 'Sessions',
  },
  decorators: inRowBox,
};
export const RowDisabled: Story = { ...Row, args: { ...Row.args, disabled: true } };

/** Tabs to the button and checks it lands there with a visible focus ring. */
export const FocusVisible: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button')).toHaveFocus();
  },
};

// What DangerViaHooks paints on hover, for both of its elements: the hover fill its class sets and
// the rest ink, which its hover label falls back to.
const dangerHoverPaint = {
  backgroundColor: 'color-mix(in srgb, var(--color-danger) 88%, var(--color-text))',
  color: 'var(--color-inverse-text)',
};

/**
 * A destructive action on a fill of the consumer's own, from the hooks alone: a class on the
 * button sets `--button-fill`, `--button-fill-hover` and `--button-label-color`. No selector
 * matches `[data-tone]` and none weighs more than the class: the library declares no hook, so the
 * class wins at rest, on hover, pressed, focused, disabled and busy. `--button-label-color-hover`
 * is left out, so the hover label falls back to `--button-label-color`. Here the fill is the
 * theme's danger colour on the inverse ink (white in light, near-black in dark), and the hover
 * fill moves it a step toward the text colour, which deepens it in light and lifts it in dark.
 * A `LinkButton` shares the stylesheet, so the same class reaches it.
 */
export const DangerViaHooks: Story = {
  parameters: {
    controls: { disable: true },
    // Run by `.storybook/paint-checks.ts` (installed from `test-runner-jest.config.js`) with a real
    // pointer: the hover fill, on both elements, and the system colours under forced colours.
    paintChecks: [
      { target: 'button', interaction: 'hover', expected: dangerHoverPaint },
      { target: 'a', interaction: 'hover', expected: dangerHoverPaint },
      {
        target: 'button',
        interaction: 'hover',
        forcedColors: true,
        expected: { backgroundColor: 'ButtonFace', color: 'ButtonText' },
      },
    ],
  },
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <style>{`.button-danger {
  --button-fill: var(--color-danger);
  --button-fill-hover: color-mix(in srgb, var(--color-danger) 88%, var(--color-text));
  --button-label-color: var(--color-inverse-text);
}`}</style>
      <Button className="button-danger">Delete event</Button>
      <LinkButton className="button-danger" href="#delete-series">
        Delete the series
      </LinkButton>
    </div>
  ),
  // Runs in a browser only (jsdom loads no CSS): both elements paint the hooks' pair at rest, not
  // the accent's, though they carry `data-tone="accent"`. A probe resolves the two tokens in this
  // theme.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Delete event' });
    const link = canvas.getByRole('link', { name: 'Delete the series' });
    const probe = canvasElement.ownerDocument.createElement('span');
    probe.style.background = 'var(--color-danger)';
    probe.style.color = 'var(--color-inverse-text)';
    canvasElement.append(probe);
    try {
      const expected = getComputedStyle(probe);
      for (const element of [button, link]) {
        const painted = getComputedStyle(element);
        await expect(element).toHaveAttribute('data-tone', 'accent');
        await expect(painted.backgroundColor).toBe(expected.backgroundColor);
        await expect(painted.color).toBe(expected.color);
      }
    } finally {
      probe.remove();
    }
  },
};

// What RowViaHooks paints on hover and on a press: its hover pair.
const rowHoverPaint = {
  backgroundColor: 'var(--color-danger)',
  color: 'var(--color-inverse-text)',
};

/**
 * A destructive list row, from the hooks: danger text at rest on no fill, and a solid danger fill
 * with the inverse ink on hover and press. The hover pair differs from the rest pair in both
 * colours, so a press that took one hook of the pair and not the other would show danger text on
 * a danger fill. On a touch screen no hover rule runs, so the press sets the pair itself.
 */
export const RowViaHooks: Story = {
  parameters: {
    controls: { disable: true },
    // Run by `.storybook/paint-checks.ts` (installed from `test-runner-jest.config.js`): a press
    // with no pointer over the row (a touch press), and a real hover. Both paint the hover pair.
    paintChecks: [
      { target: 'button', interaction: 'press', expected: rowHoverPaint },
      { target: 'button', interaction: 'hover', expected: rowHoverPaint },
    ],
  },
  decorators: inRowBox,
  render: () => (
    <>
      <style>{`.row-danger {
  --button-label-color: var(--color-danger);
  --button-fill-hover: var(--color-danger);
  --button-label-color-hover: var(--color-inverse-text);
}`}</style>
      <Button variant="row" className="row-danger" endIcon={<ChevronRightIcon />}>
        Delete account
      </Button>
    </>
  ),
};
