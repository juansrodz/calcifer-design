import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'Primitives/ProgressBar',
  component: ProgressBar,
  args: { label: 'Uploading photos', value: 40 },
  argTypes: {
    status: { control: 'radio', options: ['active', 'finished', 'error'] },
    size: { control: 'radio', options: ['sm', 'md'] },
    tone: { control: 'radio', options: ['accent', 'selected'] },
  },
  // A bar fills its container, so the stories hold it to a readable width.
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '24rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Five of eight, with a formatter that says so: the value at the end reads `5/8`. */
export const Default: Story = {
  args: {
    label: 'Items packed',
    value: 5,
    max: 8,
    formatValue: (value, max) => `${value}/${max}`,
  },
};

/** No value: a segment slides along the track and no number is shown. Still when motion is reduced. */
export const Indeterminate: Story = {
  args: { label: 'Loading events', value: null, helperText: 'This can take a minute.' },
};

/**
 * `finished` fills the track whatever `value` is: this one is handed 40, and the fill, the visible
 * value and the announced value all read full. The status word joins the name.
 */
export const Finished: Story = { args: { value: 40, status: 'finished' } };

/** `error` keeps the value, takes the danger colour, and is stated in words. */
export const Error: Story = {
  args: {
    value: 30,
    status: 'error',
    helperText: 'Upload failed. Check your connection and retry.',
  },
};

export const Small: Story = { args: { size: 'sm', value: 60 } };

/** The label stays the bar's name and leaves the screen; the value stays at the end. */
export const HiddenLabel: Story = {
  args: { label: 'Upload progress', value: 45, hideLabel: true },
};

/** The selected colour, for a bar that belongs to a chosen thing. */
export const Selected: Story = { args: { tone: 'selected', value: 70 } };

export const Dark: Story = {
  args: { value: 62.5, helperText: 'Two files left.' },
  globals: { theme: 'dark' },
};
