import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './IconButton.stories';

const { Ghost, Secondary, Primary, Small, Disabled, Loading, Soft, PressedAndBadge } =
  composeStories(stories);

// Today's DOM for the toggle pair and the loading button, captured before `LinkIconButton` shared
// the icon and badge markup. Never edited: it guards "the link form leaves the button unchanged".
const TRASH_ICON_HTML =
  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.75 4.25h10.5"></path><path d="M6.25 4.25V2.75h3.5v1.5"></path><path d="M4.25 4.25 4.9 13.25h6.2l.65-9"></path></svg>';
const PRESSED_AND_BADGE_HTML =
  '<div style="display: flex; gap: var(--space-3);">' +
  '<button type="button" tabindex="0" data-variant="ghost" data-size="md" data-pressed="" aria-label="Filters, 2 active" aria-pressed="true" class="root">' +
  `<span class="icon">${TRASH_ICON_HTML}</span><span class="badge" aria-hidden="true">2</span></button>` +
  '<button type="button" tabindex="0" data-variant="ghost" data-size="md" aria-label="Filters" aria-pressed="false" class="root">' +
  `<span class="icon">${TRASH_ICON_HTML}</span></button></div>`;
const LOADING_HTML =
  '<button type="button" data-disabled="" tabindex="0" aria-disabled="true" data-variant="ghost" data-size="md" data-loading="" aria-label="Delete remote" aria-busy="true" class="root">' +
  '<span class="icon"><span class="root" data-size="sm" data-testid="spinner" aria-hidden="true"></span></span></button>';

describe('IconButton', () => {
  it.each([
    ['Ghost', Ghost],
    ['Secondary', Secondary],
    ['Primary', Primary],
    ['Small', Small],
    ['Disabled', Disabled],
    ['Loading', Loading],
    ['Soft', Soft],
    ['PressedAndBadge', PressedAndBadge],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes its accessible name from the label, since it has no visible text', () => {
    render(<Ghost />);
    expect(screen.getByRole('button', { name: 'Delete remote' })).toBeInTheDocument();
  });

  it('hides the icon from assistive technology so the name is not read twice', () => {
    const { container } = render(<Ghost />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    render(<Ghost onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
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

  it('replaces the icon with a spinner while loading', () => {
    render(<Loading />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('applies the variant and size data attributes', () => {
    render(<Small />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'sm');
  });

  it('takes the soft variant', () => {
    render(<Soft />);
    const button = screen.getByRole('button', { name: 'Delete remote' });
    expect(button).toHaveAttribute('data-variant', 'soft');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it('is a toggle only when pressed is given', () => {
    const { rerender } = render(<Ghost />);
    const button = screen.getByRole('button');
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(button).not.toHaveAttribute('data-pressed');

    rerender(<Ghost pressed={false} />);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveAttribute('data-pressed');

    rerender(<Ghost pressed />);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-pressed');
  });

  it("keeps a caller's own aria-pressed, unless pressed is given", () => {
    const { rerender } = render(<Ghost aria-pressed="true" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    // The selected state follows `pressed` alone.
    expect(button).not.toHaveAttribute('data-pressed');

    rerender(<Ghost aria-pressed="true" pressed={false} />);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('shows a badge hidden from assistive technology', () => {
    render(<Ghost badge={3} />);
    const badge = screen.getByText('3');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Delete remote' })).toBeInTheDocument();
  });

  it('shows no badge for zero or undefined, 99 as itself, and caps it at 99+', () => {
    const { container, rerender } = render(<Ghost badge={0} />);
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();

    rerender(<Ghost badge={undefined} />);
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();

    rerender(<Ghost badge={99} />);
    expect(screen.getByText('99')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByText('99+')).not.toBeInTheDocument();

    rerender(<Ghost badge={120} />);
    expect(screen.getByText('99+')).toHaveAttribute('aria-hidden', 'true');
  });

  it('leaves the toggle, the badge and the loading DOM unchanged', () => {
    const { container, unmount } = render(<PressedAndBadge />);
    expect(container.innerHTML).toBe(PRESSED_AND_BADGE_HTML);
    unmount();
    const loading = render(<Loading />);
    expect(loading.container.innerHTML).toBe(LOADING_HTML);
  });
});
