import type { Meta, StoryObj } from '@storybook/react';
import type { AvatarSize } from '../Avatar/Avatar';
import { avatarColorsTheme, avatarColorsThemeCss } from '../Avatar/fixtures';
import { ThemeScope } from '../ThemeScope/ThemeScope';
import { AvatarGroup } from './AvatarGroup';
import type { AvatarGroupItem } from './AvatarGroup';

const people: readonly AvatarGroupItem[] = [
  { id: 'uid-1', name: 'Ada Lovelace', colorSeed: 'uid-1' },
  { id: 'uid-2', name: 'Grace Hopper', colorSeed: 'uid-2' },
  { id: 'uid-3', name: 'Katherine Johnson', colorSeed: 'uid-3' },
  { id: 'uid-4', name: 'Margaret Hamilton', colorSeed: 'uid-4' },
  { id: 'uid-5', name: 'Annie Easley', colorSeed: 'uid-5' },
  { id: 'uid-6', name: 'Mary Jackson', colorSeed: 'uid-6' },
  { id: 'uid-7', name: 'Dorothy Vaughan', colorSeed: 'uid-7' },
];

const meta = {
  title: 'Primitives/AvatarGroup',
  component: AvatarGroup,
  args: { items: people.slice(0, 3), label: 'Going to this event', size: 'sm' },
  argTypes: {
    size: { control: 'radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    max: { control: 'number' },
  },
  // The library's own theme gives all six avatar colours one neutral pair, so a seeded group only
  // shows its colours under a theme that gives each its own, with that theme's sheet on the page
  // as a consumer's build puts it there.
  decorators: [
    (Story) => (
      <>
        <style>{avatarColorsThemeCss}</style>
        <ThemeScope theme={avatarColorsTheme}>
          <Story />
        </ThemeScope>
      </>
    ),
  ],
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three people, each coloured from their id, ringed where they overlap. */
export const Default: Story = {};

/** Seven people and `max` 4: four avatars, then a chip for the other three. */
export const Overflow: Story = {
  args: { items: people, max: 4 },
};

const sizes: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

const column = { display: 'flex', flexDirection: 'column', gap: '1rem' } as const;

/** Each of the five sizes, the chip drawn to the same height as the avatars beside it. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={column}>
      {sizes.map((size) => (
        <AvatarGroup
          key={size}
          items={people}
          max={4}
          size={size}
          label={`${args.label}, size ${size}`}
        />
      ))}
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={column}>
      <AvatarGroup items={people.slice(0, 3)} label={`${args.label}, three`} />
      <AvatarGroup items={people} max={4} label={`${args.label}, seven`} />
    </div>
  ),
};
