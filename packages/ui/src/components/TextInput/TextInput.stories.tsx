import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Field } from '../Field/Field';
import { TextInput } from './TextInput';

const meta = {
  title: 'Forms/TextInput',
  component: TextInput,
  args: { placeholder: 'you@example.com', onValueChange: fn() },
  argTypes: {
    type: {
      control: 'radio',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'date', 'number'],
    },
  },
  decorators: [
    (Story) => (
      <Field label="Email" name="email">
        <Story />
      </Field>
    ),
  ],
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Email: Story = { args: { type: 'email' } };
export const Password: Story = { args: { type: 'password', placeholder: undefined } };
export const Date: Story = { args: { type: 'date', placeholder: undefined } };
export const ReadOnly: Story = { args: { defaultValue: 'sebastian@example.com', readOnly: true } };
export const Dark: Story = { globals: { theme: 'dark' } };
