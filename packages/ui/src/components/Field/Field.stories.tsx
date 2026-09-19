import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from '../TextInput/TextInput';
import { Field } from './Field';

const meta = {
  title: 'Forms/Field',
  component: Field,
  args: {
    label: 'Email',
    name: 'email',
    children: <TextInput type="email" placeholder="you@example.com" />,
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Described: Story = {
  args: { description: 'We only use it to sign you in.' },
};

export const Required: Story = {
  args: { required: true, description: 'We only use it to sign you in.' },
};

export const WithError: Story = {
  args: {
    description: 'We only use it to sign you in.',
    error: 'Enter an email address.',
  },
};

export const Disabled: Story = { args: { disabled: true } };

/** The escape hatch spec §2.3 and the whosbringingwhat revamp both need: any element, fully
    wired, wearing the control skin. A textarea here; a date or file input is the same shape. */
export const RenderedTextarea: Story = {
  args: {
    label: 'Notes',
    name: 'notes',
    description: 'Anything the host should know.',
    children: <TextInput render={<textarea rows={4} />} />,
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { description: 'We only use it to sign you in.', error: 'Enter an email address.' },
};
