import type { Meta, StoryObj } from '@storybook/react';
import { Steps, type StepsItem } from './Steps';

const items: StepsItem[] = [
  { id: 'account', title: 'Account', description: 'Who you are.' },
  { id: 'workspace', title: 'Workspace', description: 'Where the work lives.' },
  { id: 'invite', title: 'Invite', description: 'Who else is coming.' },
  { id: 'done', title: 'Done' },
];

const meta = {
  title: 'Navigation/Steps',
  component: Steps,
  args: { items, current: 1, 'aria-label': 'Sign-up progress' },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Vertical: Story = { args: { orientation: 'vertical' } };
export const WithError: Story = { args: { currentStatus: 'error' } };
export const NotStarted: Story = { args: { current: -1 } };
export const AllComplete: Story = { args: { current: 4 } };
export const TranslatedStatuses: Story = {
  args: {
    statusLabels: {
      complete: 'Terminado',
      active: 'En curso',
      error: 'Con errores',
      upcoming: 'Pendiente',
    },
  },
};
export const Dark: Story = { globals: { theme: 'dark' }, args: { currentStatus: 'error' } };
