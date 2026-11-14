import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';
import type { AvatarSize } from './Avatar';

const meta = {
  title: 'Primitives/Avatar',
  component: Avatar,
  args: { name: 'Ada Lovelace', size: 'md', shape: 'circle' },
  argTypes: {
    size: { control: 'radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'radio', options: ['circle', 'square'] },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const Square: Story = { args: { shape: 'square' } };
export const SingleName: Story = { args: { name: 'Calcifer' } };
export const WithImage: Story = {
  args: { src: 'https://avatars.githubusercontent.com/u/9919?s=200&v=4', name: 'GitHub' },
};

const sizes: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

const people = [
  { name: 'Ada Lovelace', seed: 'uid-1' },
  { name: 'Grace Hopper', seed: 'uid-2' },
  { name: 'Katherine Johnson', seed: 'uid-3' },
  { name: 'Margaret Hamilton', seed: 'uid-4' },
  { name: 'Annie Easley', seed: 'uid-5' },
  { name: 'Mary Jackson', seed: 'uid-6' },
] as const;

const row = { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' } as const;

/** Six seeds, `uid-1` to `uid-6`: the same seed gives the same colour on every screen. */
function SeededRow() {
  return (
    <div style={row}>
      {people.map((person) => (
        <Avatar key={person.seed} name={person.name} colorSeed={person.seed} />
      ))}
    </div>
  );
}

export const ColorFromSeed: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SeededRow />,
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={row}>
      {sizes.map((size) => (
        <Avatar key={size} name="Ada Lovelace" size={size} colorSeed="uid-1" />
      ))}
    </div>
  ),
};

/**
 * A size none of the five presets draws: the two hooks, set from a class, on the root. The story
 * writes its stylesheet inline; a consumer's lives in its own CSS.
 */
export const ExactSize: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <style>{`.avatar-exact-size { --avatar-size: 3.25rem; --avatar-font-size: var(--text-md); }`}</style>
      <Avatar name="Ada Lovelace" colorSeed="uid-1" className="avatar-exact-size" />
    </>
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: { controls: { disable: true } },
  render: () => <SeededRow />,
};
