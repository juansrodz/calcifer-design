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
  Small,
  CheckAtStart,
  CheckAtStartRightToLeft,
  FontSizeViaHook,
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
    ['Small', Small],
    ['CheckAtStart', CheckAtStart],
    ['CheckAtStartRightToLeft', CheckAtStartRightToLeft],
    ['FontSizeViaHook', FontSizeViaHook],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  // jsdom loads no CSS, so this pins the story's side of the hook: each wrapper sets
  // `--toggle-chip-font-size` and neither a `font-size` nor a re-scoped type token. The library's
  // side (both sizes read it, nothing declares it) is pinned in `token-reads.test.ts`, and the
  // story's play checks the drawn size in a browser.
  it('has the FontSizeViaHook story set the chip size from a wrapper, with no font-size and no re-scoped token', () => {
    const { container } = render(<FontSizeViaHook />);
    const css = container.querySelector('style')?.textContent ?? '';
    expect(css).toMatch(/^\.chip-type-category \{ --toggle-chip-font-size: 0\.78125rem; \}$/m);
    expect(css).toMatch(/^\.chip-type-dietary \{ --toggle-chip-font-size: 0\.75rem; \}$/m);
    expect(css).not.toMatch(/(?:^|[\s{;])font-size\s*:/m);
    expect(css).not.toMatch(/--text-[\w-]+\s*:/);
    const side = screen.getByRole('button', { name: 'Side' });
    const spicy = screen.getByRole('button', { name: 'Spicy' });
    expect(side.closest('.chip-type-category')).not.toBeNull();
    expect(spicy.closest('.chip-type-dietary')).not.toBeNull();
    expect(side).toHaveAttribute('data-size', 'sm');
    expect(spicy).toHaveAttribute('data-size', 'sm');
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

  it('is the md size unless it asks for sm', () => {
    const { rerender } = render(<ToggleChip>Vegetarian</ToggleChip>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'md');
    rerender(<ToggleChip size="sm">Vegetarian</ToggleChip>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm');
  });

  it('keeps the consumer’s class beside its own', () => {
    render(<ToggleChip className="mine">Vegetarian</ToggleChip>);
    expect(screen.getByRole('button')).toHaveClass('mine');
  });
});
