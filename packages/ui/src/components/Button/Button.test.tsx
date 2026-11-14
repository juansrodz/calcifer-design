import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { Button } from './Button';
import type { ButtonSize, ButtonTone } from './Button';
import * as stories from './Button.stories';

const {
  Primary,
  Secondary,
  Ghost,
  Disabled,
  Loading,
  Small,
  Inverse,
  InverseSecondary,
  InverseDisabled,
  Selected,
  SelectedSecondary,
  WithBadge,
  Large,
} = composeStories(stories);

describe('Button', () => {
  it.each([
    ['Primary', Primary],
    ['Secondary', Secondary],
    ['Ghost', Ghost],
    ['Disabled', Disabled],
    ['Loading', Loading],
    ['Small', Small],
    ['Inverse', Inverse],
    ['InverseSecondary', InverseSecondary],
    ['InverseDisabled', InverseDisabled],
    ['Selected', Selected],
    ['SelectedSecondary', SelectedSecondary],
    ['WithBadge', WithBadge],
    ['Large', Large],
  ])('%s story renders and has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    render(<Primary onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open projects' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', async () => {
    const onClick = vi.fn();
    render(<Loading onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('marks the loading state busy and keeps focusability', () => {
    render(<Loading />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).not.toHaveAttribute('disabled');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies the variant data attribute', () => {
    render(<Ghost />);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'ghost');
  });

  it('defaults to the accent tone and the medium size', () => {
    render(<Primary />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-tone', 'accent');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it('types the tones and the sizes', () => {
    expectTypeOf<ButtonTone>().toEqualTypeOf<'accent' | 'inverse' | 'selected'>();
    expectTypeOf<ButtonSize>().toEqualTypeOf<'md' | 'sm' | 'lg'>();
  });

  it('writes the tone as a data attribute', () => {
    render(<Inverse />);
    expect(screen.getByRole('button')).toHaveAttribute('data-tone', 'inverse');
  });

  it('writes the selected tone on both fills', () => {
    render(
      <>
        <Selected />
        <SelectedSecondary />
      </>,
    );
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('data-tone', 'selected');
    }
  });

  it('writes the large size as a data attribute', () => {
    render(<Large />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(button).toHaveAttribute('data-tone', 'inverse');
  });

  it('keeps the inverse secondary on its own variant', () => {
    render(<InverseSecondary />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-tone', 'inverse');
  });

  it('marks a disabled inverse button so its dimmed fill can paint', () => {
    render(<InverseDisabled />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-tone', 'inverse');
    expect(button).toHaveAttribute('data-disabled');
  });

  it('renders the badge after the label and names the button with it', () => {
    render(<WithBadge />);
    const button = screen.getByRole('button', { name: 'Suggestions 2' });
    const label = button.firstElementChild;
    const badge = button.lastElementChild;
    expect(label).toHaveClass('label');
    expect(label).toHaveTextContent('Suggestions');
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveTextContent('2');
    expect(label).not.toBe(badge);
    // A text node of one space joins the label and the count (L2-14).
    expect(label?.nextSibling?.textContent).toBe(' ');
  });

  it('renders no badge element when none is given', () => {
    render(<Primary />);
    expect(screen.getByRole('button').querySelector('.badge')).toBeNull();
  });

  it('renders as the given element with no console error when composed with render', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Base UI clones this element and injects `Button`'s own children ("Go") into it at
    // runtime, so the anchor is not actually empty despite how it looks here.
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    render(<Button render={<a href="/x" />}>Go</Button>);
    // Base UI sets `role="button"` whenever `nativeButton` is false, regardless of the
    // rendered tag, so the accessible role here is "button" even though the element is
    // an anchor underneath.
    const anchorButton = screen.getByRole('button', { name: 'Go' });
    expect(anchorButton.tagName).toBe('A');
    expect(anchorButton).toHaveAttribute('href', '/x');
    expect(anchorButton).toHaveClass('root');
    expect(anchorButton).toHaveTextContent('Go');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
