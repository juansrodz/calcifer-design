import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { DatePicker, type DatePickerProps } from './DatePicker';

const meta = {
  title: 'Forms/DatePicker',
  component: DatePicker,
  args: { label: 'Event date', name: 'eventDate', onValueChange: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '20rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Chosen: Story = { args: { defaultValue: '2026-03-08' } };
export const Described: Story = { args: { description: 'Doors open at six.' } };
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '2026-03-08' } };
export const WithError: Story = {
  args: { error: 'Nobody is free that day.', defaultValue: '2026-03-08' },
};
export const Clearable: Story = { args: { clearable: true, defaultValue: '2026-03-08' } };
export const Bounded: Story = {
  args: { defaultValue: '2026-03-15', min: '2026-03-10', max: '2026-04-20' },
};
/** Weekends are unavailable. Arrow keys still land on them; they just cannot be chosen. */
export const WeekdaysOnly: Story = {
  args: {
    defaultValue: '2026-03-09',
    isDateDisabled: (date) => {
      const weekday = new Date(`${date}T12:00:00`).getDay();
      return weekday === 0 || weekday === 6;
    },
  },
};
export const MondayFirst: Story = { args: { defaultValue: '2026-03-08', weekStartsOn: 1 } };
export const RightToLeft: Story = { args: { defaultValue: '2026-03-08', locale: 'ar-EG' } };
export const Spanish: Story = { args: { defaultValue: '2026-03-08', locale: 'es-ES' } };

function ControlledPicker(props: DatePickerProps) {
  const [date, setDate] = useState<string | null>('2026-03-08');
  return <DatePicker {...props} value={date} onValueChange={setDate} clearable />;
}
export const Controlled: Story = { render: (args) => <ControlledPicker {...args} /> };
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultValue: '2026-03-08' } };
