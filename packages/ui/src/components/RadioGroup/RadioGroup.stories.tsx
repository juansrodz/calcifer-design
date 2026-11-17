import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Card } from '../Card/Card';
import { RadioGroup } from './RadioGroup';

const meta = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
  args: {
    label: 'Who can see this event',
    name: 'visibility',
    defaultValue: 'link',
    options: [
      { value: 'public', label: 'Anyone with the address' },
      { value: 'link', label: 'Anyone with the link' },
      { value: 'invited', label: 'Invited people only' },
      { value: 'archived', label: 'Nobody — archived', disabled: true },
    ],
    onValueChange: fn(),
  },
  argTypes: { orientation: { control: 'radio', options: ['vertical', 'horizontal'] } },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Horizontal: Story = {
  args: {
    label: 'Portion size',
    name: 'portion',
    orientation: 'horizontal',
    defaultValue: 'medium',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  },
};
export const Described: Story = {
  args: { description: 'You can change this at any time from the event page.' },
};
export const Required: Story = { args: { required: true, defaultValue: undefined } };
export const WithError: Story = {
  args: { required: true, defaultValue: undefined, error: 'Choose who can see the event.' },
};
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: 'dark' } };

/**
 * On a card, the raised surface: the unselected rings read `--color-border-control`, 3:1 or better
 * on the surfaces the theme check covers, in both themes (WCAG 1.4.11).
 */
export const OnRaisedCard: Story = {
  render: (args) => (
    <div style={{ background: 'var(--color-surface-1)', padding: 'var(--space-5)' }}>
      <Card heading="Event settings">
        <RadioGroup {...args} />
      </Card>
    </div>
  ),
};
