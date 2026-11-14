import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { Button } from './Button';
import type { ButtonSize, ButtonTone, ButtonVariant } from './Button';
import * as stories from './Button.stories';

// Today's DOM for the two variants that predate the row, captured before the row variant and the
// icon slots existed. Never edited: they guard "every default leaves today's DOM unchanged".
const DEFAULT_BUTTON_HTML =
  '<button type="button" tabindex="0" data-variant="primary" data-size="md" data-tone="accent" class="root"><span class="label">Open projects</span></button>';
const GHOST_BUTTON_HTML =
  '<button type="button" tabindex="0" data-variant="ghost" data-size="md" data-tone="accent" class="root"><span class="label">Open projects</span></button>';

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
  Row,
  RowWithBadge,
  RowDisabled,
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
    ['Row', Row],
    ['RowWithBadge', RowWithBadge],
    ['RowDisabled', RowDisabled],
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
    expectTypeOf<ButtonVariant>().toEqualTypeOf<'primary' | 'secondary' | 'ghost' | 'row'>();
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

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['false', false],
    ['true', true],
    ['an empty string', ''],
  ])('renders no badge, and no space for one, when the badge is %s', (_name, badge) => {
    render(<Button badge={badge}>Suggestions</Button>);
    const button = screen.getByRole('button', { name: 'Suggestions' });
    expect(button.querySelector('.badge')).toBeNull();
    // The label span alone: no stray space text node either.
    expect(button.childNodes).toHaveLength(1);
  });

  it('renders a zero badge, since zero is a count', () => {
    render(<Button badge={0}>Suggestions</Button>);
    expect(screen.getByRole('button', { name: 'Suggestions 0' })).toBeInTheDocument();
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

  it('leaves the default DOM unchanged by the row variant and the icon slots', () => {
    const { unmount } = render(<Button>Open projects</Button>);
    expect(screen.getByRole('button').outerHTML).toBe(DEFAULT_BUTTON_HTML);
    unmount();
    render(<Button variant="ghost">Open projects</Button>);
    expect(screen.getByRole('button').outerHTML).toBe(GHOST_BUTTON_HTML);
  });

  it('renders a row with its end icon after the label and outside the name', () => {
    render(<Row />);
    const button = screen.getByRole('button', { name: 'Change password' });
    expect(button).toHaveAttribute('data-variant', 'row');
    expect(Array.from(button.children).map((child) => child.className)).toEqual([
      'label',
      'endIcon',
    ]);
    expect(button.lastElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(button.lastElementChild?.querySelector('svg')).not.toBeNull();
  });

  it('puts the end icon after the badge and keeps the count, not the icon, in the name', () => {
    render(<RowWithBadge />);
    const button = screen.getByRole('button', { name: 'Sessions 2' });
    expect(Array.from(button.children).map((child) => child.className)).toEqual([
      'label',
      'badge',
      'endIcon',
    ]);
    expect(button.lastElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('gives every variant the same decorative end icon slot', () => {
    for (const variant of ['primary', 'secondary', 'ghost'] as const) {
      const { unmount } = render(
        <Button variant={variant} endIcon={<svg data-testid="end-glyph" />}>
          Next
        </Button>,
      );
      const button = screen.getByRole('button', { name: 'Next' });
      expect(button.lastElementChild).toHaveClass('endIcon');
      expect(button.lastElementChild).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('end-glyph').parentElement).toBe(button.lastElementChild);
      unmount();
    }
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['false', false],
    ['true', true],
    ['an empty string', ''],
  ])('renders no end icon slot when the end icon is %s', (_name, endIcon) => {
    render(<Button endIcon={endIcon}>Open projects</Button>);
    expect(screen.getByRole('button').outerHTML).toBe(DEFAULT_BUTTON_HTML);
  });

  it('calls onClick once when a row is pressed', async () => {
    const onClick = vi.fn();
    render(<Row onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls nothing when a disabled row is pressed', async () => {
    const onClick = vi.fn();
    render(<RowDisabled onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
