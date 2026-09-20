import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
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

/** Opens from the keyboard and checks the highlight lands on an option, so arrows work at once. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('combobox', { name: 'Category' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(await screen.findByRole('option', { name: 'Mains' })).toHaveFocus();
  },
};
