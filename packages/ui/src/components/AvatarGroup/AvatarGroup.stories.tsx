import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import type { AvatarSize } from '../Avatar/Avatar';
import { avatarColorsTheme, avatarColorsThemeCss } from '../Avatar/fixtures';
import { ThemeScope } from '../ThemeScope/ThemeScope';
import { AvatarGroup } from './AvatarGroup';
import type { AvatarGroupItem } from './AvatarGroup';
import { photoPeople } from './fixtures';

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

// How many avatars each row shows before its chip. A row is its avatars and the chip, each tucked
// 8px under the one before it, so at `xl` (96px) two avatars and the chip are 272px, where three
// would be 360px and run past the 358px a 390px phone leaves. The sizes below it fit at four.
const maxBySize: Readonly<Record<AvatarSize, number>> = { xs: 4, sm: 4, md: 4, lg: 4, xl: 2 };

const column = { display: 'flex', flexDirection: 'column', gap: '1rem' } as const;

// Storybook loads no web font, so the initials draw in whatever the platform's sans stack gives,
// and how wide they are decides what the `Sizes` play measures. Arial's widths, which Liberation
// Sans keeps on a Linux runner, are the stack's usual ones, so that story reads the same on each.
const metricStableSansCss = `.avatar-group-metric-sans {
  --font-sans: Arial, 'Liberation Sans', Helvetica, sans-serif;
}`;

/**
 * How far an avatar's initials sit clear of the next item in the row, in css px: from the right
 * edge of the initials' box to the neighbour's left edge, read at the row of the box nearest the
 * neighbour's centre, where its round edge reaches furthest left. Negative means the neighbour
 * covers the end of the initials.
 */
function clearanceFromNeighbour(avatar: Element, neighbour: Element): number {
  const initials = avatar.querySelector('[aria-hidden="true"]');
  if (initials === null) {
    throw new Error('the avatar draws no initials');
  }
  const range = document.createRange();
  range.selectNodeContents(initials);
  const initialsBox = range.getBoundingClientRect();
  const neighbourBox = neighbour.getBoundingClientRect();
  const radius = neighbourBox.height / 2;
  const centreY = neighbourBox.top + radius;
  const nearestRowOffset =
    Math.min(Math.max(centreY, initialsBox.top), initialsBox.bottom) - centreY;
  const neighbourEdge =
    neighbourBox.left + radius - Math.sqrt(radius * radius - nearestRowOffset * nearestRowOffset);
  return neighbourEdge - initialsBox.right;
}

/**
 * Each of the five sizes, the chip drawn to the same height as the avatars beside it and its count
 * at their initials size. The largest size shows fewer avatars so that every row fits a phone. The
 * play checks that, at every size, no avatar's initials run under the avatar or the chip after it:
 * at `xs` and `sm` the stack overlaps less than the larger sizes, which is what keeps the letters
 * whole.
 */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    for (const list of within(canvasElement).getAllByRole('list')) {
      const items = Array.from(list.children);
      for (const [index, item] of items.slice(0, -1).entries()) {
        const avatar = item.firstElementChild;
        const neighbour = items[index + 1]?.firstElementChild;
        if (!avatar || !neighbour) {
          throw new Error('the row has an item with nothing in it');
        }
        await expect(
          clearanceFromNeighbour(avatar, neighbour),
          `size ${list.dataset['size']}, avatar ${index + 1}`,
        ).toBeGreaterThanOrEqual(0);
      }
    }
  },
  render: (args) => (
    <>
      <style>{metricStableSansCss}</style>
      <div className="avatar-group-metric-sans" style={column}>
        {sizes.map((size) => (
          <AvatarGroup
            key={size}
            items={people}
            max={maxBySize[size]}
            size={size}
            label={`${args.label}, size ${size}`}
          />
        ))}
      </div>
    </>
  ),
};

/**
 * Six people with a photo each and `max` 4: four photos, then a chip for the other two. The photos
 * are drawings inlined as data, so the story needs no network. Where one photo overlaps the next,
 * the ring separates them in the ground colour; under forced colours there is no ring, and the
 * front photo's own 1 px edge in the system text colour does it.
 */
export const Photos: Story = {
  args: { items: photoPeople, max: 4, size: 'md' },
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
