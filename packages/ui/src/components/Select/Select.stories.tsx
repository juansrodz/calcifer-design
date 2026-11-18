import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import fieldStyles from '../../styles/field.module.css';
import { Avatar } from '../Avatar/Avatar';
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
    const bringerName = args.options.find((option) => option.value === bringer)?.label;
    return (
      <Select
        {...args}
        value={bringer}
        onValueChange={(value) => {
          setBringer(value);
          onValueChange?.(value);
        }}
        startIcon={
          bringer === null || bringerName === undefined ? undefined : (
            <Avatar name={bringerName} size="xs" colorSeed={bringer} />
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
  play: WithStartIcon.play,
};

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
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 200 }}>
        <Story />
      </div>
    ),
  ],
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
