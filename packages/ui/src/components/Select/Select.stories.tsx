import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Avatar } from '../Avatar/Avatar';
import { Select } from './Select';

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

/**
 * The bringer's 24 px avatar inside the trigger, before the chosen name, following the value. The
 * slot is decorative: it is hidden from assistive technology, so the avatar's own name is not read
 * a second time after the option's label, which already says who it is.
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
    const bringerName = bringers.find((option) => option.value === bringer)?.label;
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
};

/** The same in the dark theme. */
export const WithStartIconDark: Story = { ...WithStartIcon, globals: { theme: 'dark' } };

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
