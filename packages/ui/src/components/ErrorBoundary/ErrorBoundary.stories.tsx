import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from './ErrorBoundary';

function FailingRemote(): never {
  throw new Error('The showcase remote failed to mount.');
}

const meta = {
  title: 'Primitives/ErrorBoundary',
  component: ErrorBoundary,
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Caught: Story = {
  args: { children: <FailingRemote /> },
};

export const Healthy: Story = {
  args: { children: <p>The showcase remote mounted.</p> },
};

export const CustomFallback: Story = {
  args: {
    children: <FailingRemote />,
    fallback: ({ error }) => <p>Could not show this panel: {error.message}</p>,
  },
};
