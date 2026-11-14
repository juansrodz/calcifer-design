import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { CheckIcon } from '../../icons/CheckIcon';
import { Tag } from '../Tag/Tag';
import { Segmented, type SegmentedOption } from './Segmented';

const options: SegmentedOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function GridIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 4h8M5 8h8M5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" />
    </svg>
  );
}

const meta = {
  title: 'Forms/Segmented',
  component: Segmented,
  args: { options, 'aria-label': 'Range', onValueChange: fn() },
} satisfies Meta<typeof Segmented>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Preselected: Story = { args: { defaultValue: 'week' } };
export const Small: Story = { args: { size: 'sm' } };
export const WithIcons: Story = {
  args: {
    options: [
      { value: 'open', label: 'Open' },
      { value: 'done', label: 'Done', icon: <CheckIcon /> },
    ],
  },
};
/**
 * A count after the label: a plain number on Going, a pill on Requests. The badge is part of the
 * option's accessible name ("Requests 2").
 */
export const WithBadges: Story = {
  args: {
    options: [
      { value: 'going', label: 'Going', badge: 12 },
      { value: 'requests', label: 'Requests', badge: <Tag tone="accent">2</Tag> },
      { value: 'declined', label: 'Declined' },
    ],
  },
};
/** The label is still the accessible name; only the icon shows. */
export const IconOnly: Story = {
  args: {
    'aria-label': 'View',
    options: [
      { value: 'grid', label: 'Grid view', icon: <GridIcon />, hideLabel: true },
      { value: 'list', label: 'List view', icon: <ListIcon />, hideLabel: true },
    ],
  },
};
/** `fill` stretches the group across its row and shares the row between the options. */
export const Fill: Story = {
  args: {
    fill: true,
    options: [
      { value: 'going', label: 'Going' },
      { value: 'not-going', label: 'Not going' },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: '20rem' }}>
        <Story />
      </div>
    ),
  ],
};
/**
 * A consumer gives the chosen option a shadow by setting `--segmented-pressed-shadow` on the group
 * or an ancestor; here a story stylesheet points it at the soft surface shadow.
 */
export const PressedShadow: Story = {
  args: { defaultValue: 'week' },
  decorators: [
    (Story) => (
      <>
        <style>{'.pressed-shadow-demo { --segmented-pressed-shadow: var(--shadow-soft); }'}</style>
        <div className="pressed-shadow-demo">
          <Story />
        </div>
      </>
    ),
  ],
};
export const DisabledOption: Story = {
  args: {
    defaultValue: 'week',
    options: [
      { value: 'day', label: 'Day', disabled: true },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
    ],
  },
};
export const LabelledByHeading: Story = {
  args: { 'aria-label': undefined, 'aria-labelledby': 'range-heading' },
  decorators: [
    (Story) => (
      <>
        <h2 id="range-heading">Range</h2>
        <Story />
      </>
    ),
  ],
};
/** A row too long for a phone: the options wrap inside the track rather than scroll the page. */
export const ManyOptions: Story = {
  args: {
    options: [
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'this-week', label: 'This week' },
      { value: 'last-week', label: 'Last week' },
      { value: 'this-month', label: 'This month' },
      { value: 'last-month', label: 'Last month' },
    ],
  },
};
export const Controlled: Story = {
  render: function ControlledStory(args) {
    const [value, setValue] = useState('month');
    return (
      <>
        <Segmented {...args} value={value} onValueChange={setValue} />
        <p>Showing: {value}</p>
      </>
    );
  },
};
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultValue: 'week' } };
