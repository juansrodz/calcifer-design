import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { CheckIcon } from '../../icons/CheckIcon';
import { CloseIcon } from '../../icons/CloseIcon';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { Segmented } from '../Segmented/Segmented';
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from './Toolbar';

const controls = (
  <>
    <ToolbarButton onClick={fn()}>Save</ToolbarButton>
    <ToolbarButton render={<Button variant="ghost" size="sm" />}>Preview</ToolbarButton>
    <ToolbarSeparator />
    <ToolbarGroup aria-label="Review">
      <ToolbarButton
        render={
          <IconButton label="Approve" variant="secondary" size="sm">
            <CheckIcon />
          </IconButton>
        }
      />
      <ToolbarButton
        render={
          <IconButton label="Reject" variant="secondary" size="sm">
            <CloseIcon />
          </IconButton>
        }
      />
    </ToolbarGroup>
  </>
);

const meta = {
  title: 'Navigation/Toolbar',
  component: Toolbar,
  args: { 'aria-label': 'Document actions', children: controls },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Vertical: Story = { args: { orientation: 'vertical' } };
export const DisabledButton: Story = {
  args: {
    children: (
      <>
        <ToolbarButton>Save</ToolbarButton>
        <ToolbarButton disabled>Publish</ToolbarButton>
        <ToolbarButton>Share</ToolbarButton>
      </>
    ),
  },
};
export const DisabledGroup: Story = {
  args: {
    children: (
      <>
        <ToolbarButton>Save</ToolbarButton>
        <ToolbarGroup aria-label="Publishing" disabled>
          <ToolbarButton>Publish</ToolbarButton>
          <ToolbarButton>Schedule</ToolbarButton>
        </ToolbarGroup>
      </>
    ),
  },
};
export const WithSegmented: Story = {
  args: {
    children: (
      <>
        <ToolbarButton>Refresh</ToolbarButton>
        <ToolbarSeparator />
        <Segmented
          aria-label="Range"
          size="sm"
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
          ]}
        />
      </>
    ),
  },
};
/** A row too long for a phone: the controls wrap rather than scroll the page. */
export const ManyControls: Story = {
  args: {
    children: (
      <>
        {['Save', 'Preview', 'Publish', 'Schedule', 'Duplicate', 'Archive', 'Share'].map((name) => (
          <ToolbarButton key={name}>{name}</ToolbarButton>
        ))}
      </>
    ),
  },
};
export const Dark: Story = { globals: { theme: 'dark' } };
