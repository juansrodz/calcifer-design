import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState, type ReactNode } from 'react';
import { fn } from 'storybook/test';
import { Dialog } from '../Dialog/Dialog';
import { Field } from '../Field/Field';
import { TextInput } from '../TextInput/TextInput';
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
/** The date as a longer line, with the calendar glyph leading it, as a form that reads like a sentence has it. */
export const LeadingIconLongDate: Story = {
  args: {
    locale: 'en-US',
    defaultValue: '2026-02-17',
    formatOptions: { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
    iconPlacement: 'start',
  },
};
/**
 * Sets `dir="rtl"` on `<html>` while the story is shown, as an app does for a right-to-left
 * language, and puts it back after.
 */
function DocumentRightToLeft({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const previousDir = root.getAttribute('dir');
    root.setAttribute('dir', 'rtl');
    return () => {
      if (previousDir === null) root.removeAttribute('dir');
      else root.setAttribute('dir', previousDir);
    };
  }, []);
  return children;
}
/**
 * `iconPlacement="start"` in a right-to-left page. The direction comes from the document's `dir`
 * (here `dir="rtl"` on `<html>`), not from `locale`: the field follows the inherited CSS direction,
 * so the glyph leads at the inline start, on the right, and the calendar's popover, rendered at
 * the end of the document, turns with it. A `locale` alone formats the date but does not mirror
 * the field.
 */
export const LeadingIconRightToLeft: Story = {
  args: {
    locale: 'ar-EG',
    defaultValue: '2026-02-17',
    formatOptions: { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
    iconPlacement: 'start',
  },
  decorators: [
    (Story) => (
      <DocumentRightToLeft>
        <Story />
      </DocumentRightToLeft>
    ),
  ],
};
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultValue: '2026-03-08' } };

/**
 * The picker halfway down an end drawer, as an item editor has it. At 1280 × 800 there is not room
 * for the calendar above or below the trigger, and it must still open on that axis, inside the
 * drawer, rather than beside the trigger over the scrim. November 2026 has five weeks, so the
 * calendar below its trigger keeps no sixth row of room.
 */
export const InEndDrawer: Story = {
  args: { defaultValue: '2026-11-20' },
  render: (args) => (
    <Dialog heading="Edit the potluck" variant="sheet" side="end" defaultOpen>
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <Field label="Name">
          <TextInput defaultValue="Friendsgiving" />
        </Field>
        <Field label="Where">
          <TextInput defaultValue="The Rodriguez house" />
        </Field>
        <Field label="Host">
          <TextInput defaultValue="Sebastian" />
        </Field>
        <DatePicker {...args} />
      </div>
    </Dialog>
  ),
};
