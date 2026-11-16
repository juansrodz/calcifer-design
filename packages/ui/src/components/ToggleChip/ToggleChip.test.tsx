import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { ToggleChip } from './ToggleChip';
import * as stories from './ToggleChip.stories';

const {
  Chip,
  ChipPressed,
  SingleGroup,
  MultipleGroup,
  PressedRing,
  Required,
  WithError,
  DisabledOption,
  Dark,
} = composeStories(stories);

describe('ToggleChip', () => {
  it.each([
    ['Chip', Chip],
    ['ChipPressed', ChipPressed],
    ['SingleGroup', SingleGroup],
    ['MultipleGroup', MultipleGroup],
    ['PressedRing', PressedRing],
    ['Required', Required],
    ['WithError', WithError],
    ['DisabledOption', DisabledOption],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a toggle button that starts unpressed', () => {
    render(<Chip />);
    expect(screen.getByRole('button', { name: 'Vegetarian' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('presses on a click, and reports the new state with one argument', async () => {
    const onPressedChange = vi.fn();
    render(<ToggleChip onPressedChange={onPressedChange}>Vegetarian</ToggleChip>);
    const chip = screen.getByRole('button', { name: 'Vegetarian' });
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(onPressedChange).toHaveBeenCalledTimes(1);
    // One argument: Base UI's own callback also passes event details, which this wrapper drops.
    expect(onPressedChange.mock.calls[0]).toEqual([true]);
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange.mock.calls[1]).toEqual([false]);
  });

  it('presses from the keyboard', async () => {
    render(<Chip />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Vegetarian' })).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Vegetarian' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('starts pressed in ChipPressed', () => {
    render(<ChipPressed />);
    expect(screen.getByRole('button', { name: 'Vegetarian' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('follows a controlled `pressed`, and keeps it when the consumer ignores the change', async () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <ToggleChip pressed={false} onPressedChange={onPressedChange}>
        Vegetarian
      </ToggleChip>,
    );
    const chip = screen.getByRole('button', { name: 'Vegetarian' });
    await userEvent.click(chip);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <ToggleChip pressed onPressedChange={onPressedChange}>
        Vegetarian
      </ToggleChip>,
    );
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('draws no check, pressed or not', () => {
    const { rerender } = render(<Chip />);
    expect(screen.getByRole('button').querySelector('svg')).toBeNull();
    rerender(<ChipPressed />);
    expect(screen.getByRole('button').querySelector('svg')).toBeNull();
  });

  it('puts an icon before the label, outside the accessible name', () => {
    render(
      <ToggleChip icon={<span data-testid="icon" />} defaultPressed>
        Dessert
      </ToggleChip>,
    );
    const chip = screen.getByRole('button', { name: 'Dessert' });
    const icon = screen.getByTestId('icon');
    expect(chip).toContainElement(icon);
    expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(chip).toHaveAttribute('data-with-icon');
  });

  it('marks no icon on a chip without one', () => {
    render(<Chip />);
    expect(screen.getByRole('button')).not.toHaveAttribute('data-with-icon');
  });

  it('cannot be pressed while disabled', async () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleChip disabled onPressedChange={onPressedChange}>
        Vegetarian
      </ToggleChip>,
    );
    const chip = screen.getByRole('button', { name: 'Vegetarian' });
    await userEvent.click(chip);
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(chip).toBeDisabled();
  });

  it('keeps the consumer’s class beside its own', () => {
    render(<ToggleChip className="mine">Vegetarian</ToggleChip>);
    expect(screen.getByRole('button')).toHaveClass('mine');
  });
});
