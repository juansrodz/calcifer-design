import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { CalendarIcon } from '../../icons/CalendarIcon';
import { Field } from '../Field/Field';
import { TextInput } from './TextInput';

/** What a story may say about the `Field` every story sits in, through `parameters.field`. */
interface StoryField {
  label: string;
  name: string;
}

const defaultField: StoryField = { label: 'Email', name: 'email' };

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
    (Story, context) => {
      const field = (context.parameters.field as StoryField | undefined) ?? defaultField;
      return (
        <Field label={field.label} name={field.name}>
          <Story />
        </Field>
      );
    },
  ],
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Email: Story = { args: { type: 'email' } };
export const Password: Story = { args: { type: 'password', placeholder: undefined } };
export const Date: Story = { args: { type: 'date', placeholder: undefined } };
export const ReadOnly: Story = { args: { defaultValue: 'sebastian@example.com', readOnly: true } };
/** The icon sits in the field's pill before the text. It is decorative: the label names the input. */
export const WithStartIcon: Story = {
  args: { startIcon: <CalendarIcon />, placeholder: 'Where is it?' },
  parameters: { field: { label: 'Location', name: 'location' } satisfies StoryField },
};
export const Dark: Story = { globals: { theme: 'dark' } };
