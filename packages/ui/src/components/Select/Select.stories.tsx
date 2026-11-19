import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { useState, type ReactNode } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import type { PaintCheck } from '../../../.storybook/paint-checks';
import fieldStyles from '../../styles/field.module.css';
import { Avatar } from '../Avatar/Avatar';
import { PortalContainerContext } from '../ThemeScope/PortalContainerContext';
import { Select } from './Select';
import styles from './Select.module.css';

const meta = {
  title: 'Forms/Select',
  component: Select,
  args: {
    label: 'Category',
    name: 'category',
    options: [
      { value: 'mains', label: 'Mains' },
      { value: 'sides', label: 'Sides' },
      { value: 'desserts', label: 'Desserts' },
      { value: 'drinks', label: 'Drinks', disabled: true },
    ],
    onValueChange: fn(),
  },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Chosen: Story = { args: { defaultValue: 'sides' } };
export const Described: Story = { args: { description: 'Where the item shows up on the list.' } };
export const Required: Story = { args: { required: true } };
export const WithError: Story = { args: { error: 'Choose a category.' } };
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: 'dark' }, args: { error: 'Choose a category.' } };

const bringers = [
  { value: 'sebastian', label: 'Sebastian' },
  { value: 'christian', label: 'Christian' },
];

/** The trigger's parts, found by the classes `Select` puts on them, or a thrown error. */
function triggerParts(canvasElement: HTMLElement, label: string) {
  const trigger = within(canvasElement).getByRole('combobox', { name: label });
  const slot = trigger.querySelector(`.${fieldStyles.affixIcon}`);
  const value = trigger.querySelector(`.${styles.value}`);
  const chevron = trigger.querySelector(`.${styles.icon}`);
  if (
    !(slot instanceof HTMLElement) ||
    !(value instanceof HTMLElement) ||
    !(chevron instanceof HTMLElement)
  ) {
    throw new Error('the trigger is missing its slot, its value or its chevron');
  }
  return { trigger, slot, value, chevron };
}

/**
 * The trigger's height with the slot, and with the slot taken out of the layout for one measure:
 * the same trigger without a start icon. Both must be the control's floor.
 */
async function expectFloorHeight(trigger: HTMLElement, slot: HTMLElement) {
  const withSlot = trigger.getBoundingClientRect().height;
  slot.style.display = 'none';
  const withoutSlot = trigger.getBoundingClientRect().height;
  slot.style.removeProperty('display');
  await expect(withSlot).toBe(withoutSlot);
  await expect(withSlot).toBe(Number.parseFloat(getComputedStyle(trigger).minHeight));
}

/**
 * The bringer's 24 px avatar inside the trigger, before the chosen name, following the value. The
 * slot is decorative: it is hidden from assistive technology, so the avatar's own name is not read
 * a second time after the option's label, which already says who it is. The `play` measures the
 * trigger: the avatar leaves its height at the control's floor.
 */
export const WithStartIcon: Story = {
  args: {
    label: 'Who is bringing',
    name: 'bringer',
    options: bringers,
    defaultValue: 'sebastian',
  },
  render: function WithStartIconRender({ onValueChange, defaultValue, ...args }) {
    const [bringer, setBringer] = useState(defaultValue ?? null);
    const bringerOption = args.options.find((option) => option.value === bringer);
    return (
      <Select
        {...args}
        value={bringer}
        onValueChange={(value) => {
          setBringer(value);
          onValueChange?.(value);
        }}
        startIcon={
          bringerOption === undefined ? undefined : (
            <Avatar name={bringerOption.label} size="xs" colorSeed={bringerOption.value} />
          )
        }
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const { trigger, slot } = triggerParts(canvasElement, args.label);
    await expectFloorHeight(trigger, slot);
  },
};

/** The same in the dark theme. */
export const WithStartIconDark: Story = {
  ...WithStartIcon,
  globals: { theme: 'dark' },
  // Named, not left to the spread: Storybook's indexer does not follow the spread, so without this
  // key the story is indexed as a smoke test and the play never runs.
  play: WithStartIcon.play,
};

/** A 200 px field, too narrow for the long name in the stories below. */
const inNarrowField: Decorator = (Story) => (
  <div style={{ inlineSize: 200 }}>
    <Story />
  </div>
);

/**
 * A name too long for a 200 px field. The value shrinks into its ellipsis, the avatar keeps its
 * 24 px, the chevron stays inside the trigger's inline-end edge, and the height stays the floor.
 */
export const WithStartIconLongValue: Story = {
  ...WithStartIcon,
  args: {
    ...WithStartIcon.args,
    options: [
      { value: 'sebastian', label: 'Juan Sebastian Rodriguez, bringing the lasagne for everyone' },
      { value: 'christian', label: 'Christian' },
    ],
  },
  decorators: [inNarrowField],
  play: async ({ canvasElement, args }) => {
    const { trigger, slot, value, chevron } = triggerParts(canvasElement, args.label);
    await expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    await expect(slot.getBoundingClientRect().width).toBe(24);
    const triggerBox = trigger.getBoundingClientRect();
    const chevronBox = chevron.getBoundingClientRect();
    if (getComputedStyle(trigger).direction === 'rtl') {
      await expect(chevronBox.left).toBeGreaterThanOrEqual(triggerBox.left);
    } else {
      await expect(chevronBox.right).toBeLessThanOrEqual(triggerBox.right);
    }
    await expectFloorHeight(trigger, slot);
  },
};

/**
 * The same long name in a right-to-left page: the row mirrors, and the `play` of the story above
 * takes its right-to-left branch, with the chevron inside the trigger's left edge.
 */
export const WithStartIconRightToLeft: Story = {
  ...WithStartIconLongValue,
  decorators: [
    inNarrowField,
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
  // Named, not left to the spread, for the reason `WithStartIconDark` gives.
  play: WithStartIconLongValue.play,
};

/** Opens from the keyboard and checks the highlight lands on an option, so arrows work at once. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('combobox', { name: 'Category' }).focus();
    await userEvent.keyboard('{Enter}');
    const firstOption = await screen.findByRole('option', { name: 'Mains' });
    // Base UI moves focus to the option after the popup mounts, a moment after it is in the DOM.
    await waitFor(() => expect(firstOption).toHaveFocus());
  },
};

/**
 * Holds the select's portal inside the story root, where the test runner's paint checks look; Base
 * UI would otherwise portal the popup to `<body>`. (`Menu.stories.tsx` has the same wrapper.)
 */
function PortalInStoryRoot({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <PortalContainerContext.Provider value={host}>
      {children}
      <div ref={setHost} />
    </PortalContainerContext.Provider>
  );
}

/**
 * `Chosen`, open, with the chosen option highlighted and not focused, as a pointer leaves it after
 * the select was opened with a press. The `play` opens the select, which highlights and focuses the
 * chosen option, then takes the focus away; the highlight stays.
 *
 * The test runner checks the paint under forced colours with the pointer away (`press`, which also
 * holds `:active`; nothing in the popup reads it): the chosen option is filled `Highlight` with
 * `HighlightText` ink and its check mark takes that ink, and the disabled option is `GrayText`.
 */
export const ChosenHighlighted: Story = {
  args: { defaultValue: 'sides' },
  decorators: [
    (Story) => (
      <PortalInStoryRoot>
        <Story />
      </PortalInStoryRoot>
    ),
  ],
  parameters: {
    paintChecks: [
      {
        target: '[role="option"][data-selected]',
        interaction: 'press',
        forcedColors: true,
        expected: { backgroundColor: 'Highlight', color: 'HighlightText' },
      },
      {
        target: `[role="option"][data-selected] .${styles.indicator}`,
        interaction: 'press',
        forcedColors: true,
        expected: { color: 'HighlightText' },
      },
      {
        target: '[role="option"][data-disabled]',
        interaction: 'press',
        forcedColors: true,
        expected: { color: 'GrayText' },
      },
    ] satisfies readonly PaintCheck[],
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox', { name: 'Category' }));
    const sides = await screen.findByRole('option', { name: 'Sides' });
    await waitFor(() => expect(sides).toHaveAttribute('data-highlighted'));
    // Base UI moves focus there about 118 ms after it highlights the option; blur only once it has.
    await waitFor(() => expect(sides).toHaveFocus());
    sides.blur();
    await waitFor(() => expect(sides).not.toHaveFocus());
    await expect(sides).toHaveAttribute('data-highlighted');
  },
};

/**
 * A disabled option that is also the chosen one, opened from the keyboard, so it takes focus with
 * its ring. The ring is drawn at full strength, 3:1 or more against the popup like any other focus
 * ring: the dim falls on the option's text and check mark, not on the row that draws the ring.
 *
 * Under forced colours (the test runner's paint checks) the whole option is `GrayText`, its check
 * mark included, as the rest of a disabled option is.
 */
export const ChosenDisabledFocused: Story = {
  args: { defaultValue: 'drinks' },
  decorators: [
    (Story) => (
      <PortalInStoryRoot>
        <Story />
      </PortalInStoryRoot>
    ),
  ],
  parameters: {
    paintChecks: [
      {
        target: '[role="option"][data-disabled]',
        interaction: 'press',
        forcedColors: true,
        expected: { color: 'GrayText' },
      },
      {
        target: `[role="option"][data-disabled] .${styles.indicator}`,
        interaction: 'press',
        forcedColors: true,
        expected: { color: 'GrayText' },
      },
    ] satisfies readonly PaintCheck[],
  },
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole('combobox', { name: 'Category' }).focus();
    await userEvent.keyboard('{Enter}');
    const drinks = await screen.findByRole('option', { name: 'Drinks' });
    await waitFor(() => expect(drinks).toHaveFocus());
    await expect(drinks).toHaveAttribute('aria-disabled', 'true');
    await expect(drinks.matches(':focus-visible')).toBe(true);
    // The row draws the ring, so nothing dims the row; its text and check mark carry the dim.
    await expect(getComputedStyle(drinks).opacity).toBe('1');
    await expect(getComputedStyle(drinks).outlineStyle).toBe('solid');
    for (const part of Array.from(drinks.children)) {
      await expect(getComputedStyle(part).opacity).toBe('0.45');
    }
    await expect(drinks.children).toHaveLength(2);
  },
};
