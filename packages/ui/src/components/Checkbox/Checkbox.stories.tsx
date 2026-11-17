import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Card } from '../Card/Card';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  args: { label: 'Bring a dish', name: 'bringing', onCheckedChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { label: 'Select all items', indeterminate: true } };
export const Described: Story = {
  args: { description: 'We will list you next to the dish on the event page.' },
};
export const Required: Story = { args: { label: 'Accept the house rules', required: true } };
export const WithError: Story = {
  args: { label: 'Accept the house rules', required: true, error: 'You must accept to join.' },
};
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultChecked: true } };

/**
 * Unchecked and checked on a card, the raised surface where the translucent hairline used to fade
 * to about 1.1:1. The unchecked boundary reads `--color-border-control`, 3:1 or better on the
 * surfaces the theme check covers, in both themes (WCAG 1.4.11).
 */
export const OnRaisedCard: Story = {
  render: (args) => (
    <div style={{ background: 'var(--color-surface-1)', padding: 'var(--space-5)' }}>
      <Card heading="What are you bringing?">
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <Checkbox {...args} />
          <Checkbox {...args} label="Bring drinks" name="drinks" defaultChecked />
        </div>
      </Card>
    </div>
  ),
};
