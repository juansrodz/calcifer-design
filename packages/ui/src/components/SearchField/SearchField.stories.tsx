import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Dialog } from '../Dialog/Dialog';
import { SearchField } from './SearchField';

const meta = {
  title: 'Forms/SearchField',
  component: SearchField,
  args: {
    label: 'Search people',
    placeholder: 'Search by name',
    onValueChange: fn(),
    onSubmit: fn(),
  },
  argTypes: {
    size: { control: 'radio', options: ['md', 'sm'] },
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A value brings the clear control; Escape does the same from the keyboard. */
export const WithValue: Story = { args: { defaultValue: 'Ada' } };

/** The label still names the field for assistive technology; only the eye loses it. */
export const HiddenLabel: Story = { args: { hideLabel: true } };

export const Small: Story = { args: { size: 'sm', defaultValue: 'Ada' } };

/** A disabled field dims its pill and draws no clear control, whatever it holds. */
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Ada' } };

/**
 * Controlled: the field shows what `value` says. With `value` fixed, a keystroke changes nothing
 * on screen, but `onValueChange` still hears it.
 */
export const Controlled: Story = { args: { value: 'Ada' } };

/**
 * Escape clears a search with a value and keeps the dialog open; a second Escape, in the now
 * empty field, closes it.
 */
export const InDialog: Story = {
  render: (args) => (
    <Dialog heading="Find a person" defaultOpen>
      <SearchField {...args} defaultValue="Ada" />
    </Dialog>
  ),
};

/** Prints how many times `onValueChange` was called, so one clear can be told from two. */
export const CountsChanges: Story = {
  args: { defaultValue: 'Ada' },
  render: function CountsChangesRender({ onValueChange, ...args }) {
    const [changes, setChanges] = useState(0);
    return (
      <>
        <SearchField
          {...args}
          onValueChange={(value) => {
            setChanges((count) => count + 1);
            onValueChange?.(value);
          }}
        />
        <p>Changes: {changes}</p>
      </>
    );
  },
};

export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultValue: 'Ada' } };
