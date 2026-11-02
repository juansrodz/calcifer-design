import type { Meta, StoryObj } from '@storybook/react';
import { Field } from '../Field/Field';
import { TimePicker, type TimePickerProps } from './TimePicker';

interface TimePickerStoryProps extends TimePickerProps {
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

function TimePickerInField({
  description,
  error,
  required,
  disabled,
  ...rest
}: TimePickerStoryProps) {
  return (
    <div style={{ maxWidth: '16rem' }}>
      <Field
        label="Arrival"
        name="arrival"
        description={description}
        error={error}
        required={required}
        disabled={disabled}
      >
        <TimePicker {...rest} />
      </Field>
    </div>
  );
}

const meta = {
  title: 'Forms/TimePicker',
  component: TimePickerInField,
} satisfies Meta<typeof TimePickerInField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Prefilled: Story = { args: { defaultValue: '18:30' } };
export const Bounded: Story = {
  args: { min: '09:00', max: '17:00', step: 900, defaultValue: '09:15' },
};
export const Described: Story = { args: { description: 'Doors open at six.' } };
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '18:30' } };
export const WithError: Story = {
  args: { error: 'Arrive before the doors close.', defaultValue: '23:30' },
};
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultValue: '18:30' } };
