import type { Meta, StoryObj } from '@storybook/react';
import { Timeline, type TimelineItem } from './Timeline';

const items: TimelineItem[] = [
  { id: 'opened', title: 'Ticket opened', timestamp: '2026-03-08', tone: 'neutral' },
  {
    id: 'assigned',
    title: 'Assigned to Ana',
    timestamp: '2026-03-08T09:30:00Z',
    description: 'Moved from the triage queue.',
    tone: 'accent',
  },
  { id: 'failed', title: 'Deploy failed', timestamp: '2026-03-09T14:05:00Z', tone: 'danger' },
  { id: 'shipped', title: 'Fix shipped', timestamp: '2026-03-10T08:00:00Z', tone: 'success' },
];

const meta = {
  title: 'Data display/Timeline',
  component: Timeline,
  args: { items, 'aria-label': 'History', locale: 'en-GB' },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutTones: Story = {
  args: {
    items: [
      { id: 'one', title: 'Created', timestamp: '2026-03-08' },
      { id: 'two', title: 'Edited', description: 'No time was recorded for this.' },
    ],
  },
};
export const Spanish: Story = {
  args: {
    locale: 'es-ES',
    toneLabels: { neutral: 'Nota', accent: 'Destacado', success: 'Correcto', danger: 'Problema' },
  },
};
export const RightToLeft: Story = {
  args: { locale: 'ar-EG' },
  decorators: [
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
};
export const InvalidTimestamp: Story = {
  args: { items: [{ id: 'odd', title: 'Imported', timestamp: 'last spring', tone: 'danger' }] },
};
export const LongText: Story = {
  args: {
    items: [
      {
        id: 'long',
        title: 'an-exceptionally-long-event-name-with-no-spaces-at-all-in-a-narrow-column',
        description: 'A description long enough to wrap to several lines at the width of a phone.',
        timestamp: '2026-03-08T09:30:00Z',
        tone: 'success',
      },
    ],
  },
};
export const Dark: Story = { globals: { theme: 'dark' } };
