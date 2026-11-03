import type { Meta, StoryObj } from '@storybook/react';
import { Field } from '../Field/Field';
import { TextArea, type TextAreaProps } from './TextArea';

interface TextAreaStoryProps extends TextAreaProps {
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

function TextAreaInField({ description, error, required, disabled, ...rest }: TextAreaStoryProps) {
  return (
    <div style={{ maxWidth: '28rem' }}>
      <Field
        label="Notes"
        name="notes"
        description={description}
        error={error}
        required={required}
        disabled={disabled}
      >
        <TextArea {...rest} />
      </Field>
    </div>
  );
}

const meta = {
  title: 'Forms/TextArea',
  component: TextAreaInField,
} satisfies Meta<typeof TextAreaInField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Described: Story = {
  args: { description: 'Allergies, timings, anything the host should know.' },
};
export const Prefilled: Story = {
  args: { defaultValue: 'No nuts, please.\nArriving after six.' },
};
/** Grows with its content where the browser has `field-sizing`; a resizable box elsewhere. */
export const AutoResize: Story = {
  args: {
    autoResize: true,
    rows: 2,
    defaultValue: 'Type here, and the box grows with what you write.',
  },
};
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Locked by the host.' } };
export const WithError: Story = { args: { error: 'Say a little more.', defaultValue: 'ok' } };
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultValue: 'In the dark.' } };
