import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button/Button';
import { Card } from './Card';

const meta = {
  title: 'Primitives/Card',
  component: Card,
  args: {
    heading: 'Federation Showcase',
    children: <p>A small app built to show what a remote is.</p>,
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithFooter: Story = { args: { footer: <Button size="sm">Open</Button> } };
export const AsArticle: Story = { args: { as: 'article', headingLevel: 2 } };
export const Interactive: Story = { args: { interactive: true } };
export const Danger: Story = {
  args: {
    tone: 'danger',
    children: <p>Couldn't load this remote. The entry script timed out after 3000 ms.</p>,
    footer: (
      <Button size="sm" variant="secondary">
        Retry
      </Button>
    ),
  },
};
