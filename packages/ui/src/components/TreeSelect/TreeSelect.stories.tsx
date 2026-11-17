import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import { Field } from '../Field/Field';
import { Form } from '../Form/Form';
import { TextInput } from '../TextInput/TextInput';
import type { TreeItem } from '../Tree/Tree';
import { TreeSelect, type TreeSelectProps } from './TreeSelect';

const items: TreeItem[] = [
  {
    id: 'engineering',
    label: 'Engineering',
    children: [
      { id: 'platform', label: 'Platform' },
      {
        id: 'product',
        label: 'Product',
        children: [
          { id: 'web', label: 'Web' },
          { id: 'mobile', label: 'Mobile' },
        ],
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    children: [
      { id: 'finance', label: 'Finance' },
      { id: 'legal', label: 'Legal', disabled: true },
    ],
  },
  { id: 'design', label: 'Design' },
];

const meta = {
  title: 'Forms/TreeSelect',
  component: TreeSelect,
  args: { label: 'Team', name: 'team', items, onValueChange: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '20rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TreeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Chosen: Story = { args: { defaultValue: 'web' } };
export const Described: Story = { args: { description: 'Who owns this budget.' } };
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'web' } };
export const WithError: Story = {
  args: { error: 'That team has no budget left.', defaultValue: 'web' },
};
export const Clearable: Story = { args: { clearable: true, defaultValue: 'web' } };
export const Placeholder: Story = { args: { placeholder: 'Any team' } };
export const NoOptions: Story = { args: { items: [] } };
export const LongLabels: Story = {
  args: {
    defaultValue: 'long',
    items: [
      {
        id: 'long',
        label: 'A department with an unusually long name that will not fit on one line',
        children: [{ id: 'word', label: 'an-exceptionally-long-team-name-with-no-spaces-at-all' }],
      },
    ],
  },
};

function ControlledTreeSelect(props: TreeSelectProps) {
  const [team, setTeam] = useState<string | null>('finance');
  return <TreeSelect {...props} value={team} onValueChange={setTeam} clearable />;
}
export const Controlled: Story = { render: (args) => <ControlledTreeSelect {...args} /> };

export const InForm: Story = {
  args: { required: true },
  render: (args) => (
    <Form aria-label="Budget" onSubmit={fn()}>
      <TreeSelect {...args} />
      <Button type="submit">Save</Button>
    </Form>
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { defaultValue: 'web', clearable: true },
};

/** A tree taller than the popup's 24rem cap once its chosen branch is open. */
const manyTeams: TreeItem[] = [
  ...items,
  {
    id: 'people',
    label: 'People',
    children: [
      { id: 'recruiting', label: 'Recruiting' },
      { id: 'learning', label: 'Learning' },
      { id: 'benefits', label: 'Benefits' },
      { id: 'workplace', label: 'Workplace' },
      { id: 'events', label: 'Events' },
    ],
  },
  { id: 'research', label: 'Research' },
  { id: 'support', label: 'Support' },
];

/** Halfway down an end drawer, where neither above nor below has the whole tree's room and the
    side of the trigger is the scrim: the tree stays above or below and clamps to it. */
export const InEndDrawer: Story = {
  args: { defaultValue: 'events', items: manyTeams },
  render: (args) => (
    <Dialog heading="Edit the budget" variant="sheet" side="end" defaultOpen>
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
        <TreeSelect {...args} />
      </div>
    </Dialog>
  ),
};
