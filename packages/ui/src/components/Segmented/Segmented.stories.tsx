import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { CheckIcon } from '../../icons/CheckIcon';
import { Segmented, type SegmentedOption } from './Segmented';

const options: SegmentedOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

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
