import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { CheckIcon } from '../../icons/CheckIcon';
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
  WithStartIcon,
  Pending,
  PendingNoIcon,
  PendingInverse,
  DangerViaHooks,
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
    ['WithStartIcon', WithStartIcon],
    ['Pending', Pending],
    ['PendingNoIcon', PendingNoIcon],
    ['PendingInverse', PendingInverse],
    ['DangerViaHooks', DangerViaHooks],
  ])('%s story renders and has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  // jsdom loads no CSS, so this pins the story's side of the hooks: a class on the button sets
  // them, and nothing else. The library's side (every state reads them, nothing declares them) is
  // pinned in `token-reads.test.ts`, and the story's play checks the painted pair in a browser.
  it('has the DangerViaHooks story set the hooks from a class on the button, with no [data-tone] and no paint of its own', () => {
    const { container } = render(<DangerViaHooks />);
    const css = container.querySelector('style')?.textContent ?? '';
    const button = screen.getByRole('button', { name: 'Delete event' });
    expect(button).toHaveClass('root', 'button-danger');
    expect(button).toHaveAttribute('data-tone', 'accent');
    expect(css).toMatch(/^\.button-danger \{/m);
    expect(css).toContain('--button-fill: var(--color-danger);');
    expect(css).toContain('--button-fill-hover: ');
    expect(css).toContain('--button-label-color: var(--color-inverse-text);');
    expect(css).not.toContain('data-tone');
    expect(css).not.toMatch(/(?:^|[\s{;])(?:background|color)\s*:/m);
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

  it('renders a leading icon before the label and outside the name', () => {
    render(<WithStartIcon />);
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(Array.from(button.children).map((child) => child.className)).toEqual(['icon', 'label']);
    expect(button.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(button.firstElementChild?.querySelector('svg')).not.toBeNull();
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button).not.toHaveAttribute('data-pending');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['false', false],
    ['true', true],
    ['an empty string', ''],
  ])('renders no leading icon slot when the start icon is %s', (_name, startIcon) => {
    render(<Button startIcon={startIcon}>Open projects</Button>);
    expect(screen.getByRole('button').outerHTML).toBe(DEFAULT_BUTTON_HTML);
  });

  it('keeps the label as the name, marks the button busy and swaps the icon for the spinner', () => {
    render(<Pending />);
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending', '');
    expect(button).not.toHaveAttribute('disabled');
    expect(Array.from(button.children).map((child) => child.className)).toEqual(['icon', 'label']);
    expect(button.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(within(button).getByTestId('spinner')).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('puts the spinner over the label, keeping the label and the name, when there is no icon', () => {
    render(<PendingNoIcon />);
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending', '');
    expect(Array.from(button.children).map((child) => child.className)).toEqual([
      'pendingOverlay',
      'label',
    ]);
    const overlay = button.firstElementChild;
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(within(overlay as HTMLElement).getByTestId('spinner')).toBeInTheDocument();
    // The label is still in the DOM with its text, as in the idle button; the stylesheet only
    // hides it, and the jsdom tests load no CSS (L2-14).
    expect(button.lastElementChild).toHaveClass('label');
    expect(button.lastElementChild?.textContent).toBe('Sign in');
  });

  it('keeps the inverse tone and marks it pending', () => {
    render(<PendingInverse />);
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toHaveAttribute('data-tone', 'inverse');
    expect(button).toHaveAttribute('data-pending', '');
  });

  it.each([
    ['with an icon', Pending, 'Save changes'],
    ['with no icon', PendingNoIcon, 'Sign in'],
  ])('blocks the click and the keys while pending, %s', async (_name, Story, name) => {
    const onClick = vi.fn();
    render(<Story onClick={onClick} />);
    const button = screen.getByRole('button', { name });
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveFocus();
  });

  it('keeps focus on the same element while pending starts and ends', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button startIcon={<CheckIcon />} onClick={onClick}>
        Save changes
      </Button>,
    );
    await userEvent.tab();
    const button = screen.getByRole('button', { name: 'Save changes' });
    rerender(
      <Button pending startIcon={<CheckIcon />} onClick={onClick}>
        Save changes
      </Button>,
    );
    expect(document.activeElement).toBe(button);
    rerender(
      <Button startIcon={<CheckIcon />} onClick={onClick}>
        Save changes
      </Button>,
    );
    expect(document.activeElement).toBe(button);
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button.firstElementChild?.querySelector('svg')).not.toBeNull();
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // The app's Log Out button (A0 Task 18b, A8): no icon, so the overlay path. No timer is advanced.
  it('keeps the name, the busy state and the focus of an icon-less button while it is pending', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Log Out</Button>);
    await userEvent.tab();
    const button = screen.getByRole('button', { name: 'Log Out' });
    rerender(
      <Button pending onClick={onClick}>
        Log Out
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Log Out' })).toBe(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveFocus();
    await userEvent.click(button);
    await userEvent.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
    rerender(<Button onClick={onClick}>Log Out</Button>);
    expect(button).toHaveFocus();
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button.outerHTML).toBe(DEFAULT_BUTTON_HTML.replace('Open projects', 'Log Out'));
  });

  it('paints and behaves as disabled, not as pending, when it is disabled and pending', async () => {
    const onClick = vi.fn();
    render(<Pending disabled onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Save changes' });
    // `data-pending` is what lifts the dimmed look back to full strength, so a button the caller
    // disabled must not carry it (PF-13); it is still busy and still blocks activation.
    expect(button).not.toHaveAttribute('data-pending');
    expect(button).toHaveAttribute('data-disabled');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    // It shows what a disabled button shows: the icon, no spinner.
    expect(Array.from(button.children).map((child) => child.className)).toEqual(['icon', 'label']);
    expect(button.firstElementChild?.querySelector('svg')).not.toBeNull();
    expect(within(button).queryByTestId('spinner')).toBeNull();
    // Focusable, as `loading` with `disabled` is: the house behaviour for a busy button.
    expect(button).not.toHaveAttribute('disabled');
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.click(button);
    await userEvent.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a disabled pending button with no icon exactly as a disabled one, label and all', () => {
    const { unmount } = render(<PendingNoIcon disabled />);
    const pendingButton = screen.getByRole('button', { name: 'Sign in' });
    // No overlay (it would have nothing to anchor to, `position: relative` riding on
    // `data-pending`) and no spinner: the label is the only child, and it is the idle label.
    expect(Array.from(pendingButton.children).map((child) => child.className)).toEqual(['label']);
    expect(pendingButton.firstElementChild?.textContent).toBe('Sign in');
    expect(within(pendingButton).queryByTestId('spinner')).toBeNull();
    expect(pendingButton).not.toHaveAttribute('data-pending');
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
    expect(pendingButton).toHaveAttribute('aria-disabled', 'true');
    const pendingChildren = Array.from(pendingButton.children).map((child) => child.outerHTML);
    unmount();
    // The same children as the disabled button alone: the busy state is the only difference.
    render(<Button disabled>Sign in</Button>);
    const disabledButton = screen.getByRole('button', { name: 'Sign in' });
    expect(Array.from(disabledButton.children).map((child) => child.outerHTML)).toEqual(
      pendingChildren,
    );
  });

  it('writes no pending marker or busy state when pending is false', () => {
    render(
      <Button pending={false} startIcon={<CheckIcon />}>
        Save changes
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).not.toHaveAttribute('data-pending');
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button.querySelector('[data-testid="spinner"]')).toBeNull();
  });

  it('falls back to the overlay when pending with an empty start icon', () => {
    render(
      <Button pending startIcon="">
        Sign in
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(Array.from(button.children).map((child) => child.className)).toEqual([
      'pendingOverlay',
      'label',
    ]);
  });

  it('keeps today’s DOM for loading: no pending marker, no spinner, the label alone', () => {
    render(<Loading />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-loading', '');
    expect(button).not.toHaveAttribute('data-pending');
    expect(Array.from(button.children).map((child) => child.className)).toEqual(['label']);
    expect(within(button).queryByTestId('spinner')).toBeNull();
  });
});
