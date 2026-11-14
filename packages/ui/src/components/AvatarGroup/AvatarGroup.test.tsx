import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import { AvatarGroup } from './AvatarGroup';
import styles from './AvatarGroup.module.css';
import * as stories from './AvatarGroup.stories';

const { Default, Overflow, Sizes, Dark } = composeStories(stories);

const sevenPeople = [
  { id: 'uid-1', name: 'Ada Lovelace', colorSeed: 'uid-1' },
  { id: 'uid-2', name: 'Grace Hopper', colorSeed: 'uid-2' },
  { id: 'uid-3', name: 'Katherine Johnson', colorSeed: 'uid-3' },
  { id: 'uid-4', name: 'Margaret Hamilton', colorSeed: 'uid-4' },
  { id: 'uid-5', name: 'Annie Easley', colorSeed: 'uid-5' },
  { id: 'uid-6', name: 'Mary Jackson', colorSeed: 'uid-6' },
  { id: 'uid-7', name: 'Dorothy Vaughan', colorSeed: 'uid-7' },
] as const;

describe('AvatarGroup', () => {
  it.each([
    ['Default', Default],
    ['Overflow', Overflow],
    ['Sizes', Sizes],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is a list named by its label, with one item per person', () => {
    render(<Default />);
    const list = screen.getByRole('list', { name: 'Going to this event' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('shows four avatars and a fifth item for the rest when there are seven', () => {
    render(<Overflow />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(screen.getAllByTestId('avatar')).toHaveLength(4);
    // The count is drawn for the eye and hidden from the reader, whose text is the label.
    const count = within(items[4]!).getByText('+3');
    expect(count).toHaveAttribute('aria-hidden', 'true');
    const spoken = within(items[4]!).getByText('3 more');
    expect(spoken.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('lets overflowLabel word what a screen reader hears', () => {
    render(
      <AvatarGroup
        items={sevenPeople}
        label="Going"
        overflowLabel={(count) => `${count} others`}
      />,
    );
    expect(screen.getByText('3 others')).toBeInTheDocument();
    expect(screen.queryByText('3 more')).not.toBeInTheDocument();
    expect(screen.getByText('+3')).toHaveAttribute('aria-hidden', 'true');
  });

  it('rings every avatar and passes each colorSeed through: uid-1 is colour 2', () => {
    render(<Overflow />);
    const roots = screen.getAllByTestId('avatar');
    for (const root of roots) {
      expect(root).toHaveClass(styles.ring ?? 'ring');
    }
    expect(roots[0]).toHaveAttribute('data-color', '2');
    // uid-2 hashes to colour 1, so the seeds do not all give one colour.
    expect(roots[1]).toHaveAttribute('data-color', '1');
  });

  it('draws no chip when every item fits under max', () => {
    render(<AvatarGroup items={sevenPeople} max={7} label="Going" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it('draws no chip when items equal max exactly', () => {
    render(<AvatarGroup items={sevenPeople.slice(0, 4)} label="Going" />);
    expect(screen.getAllByTestId('avatar')).toHaveLength(4);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('reads a max below one as one: one avatar and the other six in the chip', () => {
    render(<AvatarGroup items={sevenPeople} max={0} label="Going" />);
    expect(screen.getAllByTestId('avatar')).toHaveLength(1);
    expect(screen.getByText('+6')).toBeInTheDocument();
    expect(screen.getByText('6 more')).toBeInTheDocument();
  });

  it('shows whole avatars only for a fractional max, and one for a NaN', () => {
    const { rerender } = render(<AvatarGroup items={sevenPeople} max={2.9} label="Going" />);
    expect(screen.getAllByTestId('avatar')).toHaveLength(2);
    expect(screen.getByText('+5')).toBeInTheDocument();
    rerender(<AvatarGroup items={sevenPeople} max={Number.NaN} label="Going" />);
    expect(screen.getAllByTestId('avatar')).toHaveLength(1);
    expect(screen.getByText('+6')).toBeInTheDocument();
  });

  it('renders nothing for an empty items, not an empty list', () => {
    const { container } = render(<AvatarGroup items={[]} label="Going" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('draws the avatars at the group’s size, small unless asked', () => {
    const { rerender } = render(<AvatarGroup items={sevenPeople.slice(0, 2)} label="Going" />);
    expect(screen.getByRole('list')).toHaveAttribute('data-size', 'sm');
    for (const root of screen.getAllByTestId('avatar')) {
      expect(root).toHaveAttribute('data-size', 'sm');
    }
    rerender(<AvatarGroup items={sevenPeople.slice(0, 2)} size="lg" label="Going" />);
    expect(screen.getByRole('list')).toHaveAttribute('data-size', 'lg');
    for (const root of screen.getAllByTestId('avatar')) {
      expect(root).toHaveAttribute('data-size', 'lg');
    }
  });

  it('renders the five sizes as five lists, xs to xl', () => {
    render(<Sizes />);
    const sizes = screen.getAllByRole('list').map((list) => list.getAttribute('data-size'));
    expect(sizes).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  });

  // 96px boxes overlapping by 8px: three avatars and the chip would be 360px, wider than the 358px
  // a 390px phone leaves, so the largest row shows two and the chip.
  it('shows two avatars and a chip at xl, so the row fits a phone', () => {
    render(<Sizes />);
    const extraLarge = screen.getAllByRole('list').at(-1);
    expect(extraLarge).toHaveAttribute('data-size', 'xl');
    expect(within(extraLarge!).getAllByTestId('avatar')).toHaveLength(2);
    expect(within(extraLarge!).getByText('+5')).toBeInTheDocument();
  });
});
