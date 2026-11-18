import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentPropsWithRef, MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { ChevronRightIcon } from '../../icons/ChevronRightIcon';
import { IconButton } from './IconButton';
import { LinkIconButton } from './LinkIconButton';
import * as stories from './LinkIconButton.stories';

const { Ghost, Secondary, Primary, Small, Soft, WithBadge, MatchesIconButton } =
  composeStories(stories);

interface RouterLinkProps extends Omit<ComponentPropsWithRef<'a'>, 'href'> {
  to: string;
  onNavigate: (to: string) => void;
}

/** A router link as a router draws one: an anchor whose click is a client-side navigation. */
function RouterLink({ to, onNavigate, onClick, ...rest }: RouterLinkProps) {
  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content -- the content arrives through `render`
    <a
      {...rest}
      href={to}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        event.preventDefault();
        onNavigate(to);
      }}
    />
  );
}

function renderRouterLink() {
  const onNavigate = vi.fn();
  render(
    <LinkIconButton
      variant="soft"
      size="sm"
      label="Open events"
      render={<RouterLink to="/events" onNavigate={onNavigate} />}
    >
      <ChevronRightIcon />
    </LinkIconButton>,
  );
  return onNavigate;
}

describe('LinkIconButton', () => {
  it.each([
    ['Ghost', Ghost],
    ['Secondary', Secondary],
    ['Primary', Primary],
    ['Small', Small],
    ['Soft', Soft],
    ['WithBadge', WithBadge],
    ['MatchesIconButton', MatchesIconButton],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is an anchor announced as a link, named by its label', () => {
    render(<Soft />);
    const link = screen.getByRole('link', { name: 'Open events' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '#events');
    expect(link).not.toHaveAttribute('role');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('carries none of the button attributes', () => {
    render(<WithBadge />);
    const link = screen.getByRole('link');
    for (const attribute of ['type', 'aria-pressed', 'aria-busy', 'aria-disabled', 'tabindex']) {
      expect(link).not.toHaveAttribute(attribute);
    }
  });

  it('is announced as a link when a router link is rendered in its place', () => {
    renderRouterLink();
    const link = screen.getByRole('link', { name: 'Open events' });
    expect(link).toHaveAttribute('href', '/events');
    expect(link).not.toHaveAttribute('role');
    expect(link).toHaveAttribute('data-variant', 'soft');
    expect(link).toHaveAttribute('data-size', 'sm');
  });

  it('navigates once on Enter', async () => {
    const onNavigate = renderRouterLink();
    await userEvent.tab();
    expect(screen.getByRole('link')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('/events');
  });

  it('does not activate on Space, as a link does not', async () => {
    const onNavigate = renderRouterLink();
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("navigates once on a click, and runs a caller's onClick", async () => {
    const onClick = vi.fn();
    const onNavigate = vi.fn();
    render(
      <LinkIconButton
        label="Open events"
        onClick={onClick}
        render={<RouterLink to="/events" onNavigate={onNavigate} />}
      >
        <ChevronRightIcon />
      </LinkIconButton>,
    );
    await userEvent.click(screen.getByRole('link'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('is in the tab order with no tabindex of its own', async () => {
    render(<Ghost />);
    await userEvent.tab();
    expect(screen.getByRole('link')).toHaveFocus();
  });

  it('wears the same class, data attributes and content as the IconButton it matches', () => {
    render(
      <>
        <IconButton label="Messages" variant="soft" size="sm" badge={120}>
          <ChevronRightIcon />
        </IconButton>
        <LinkIconButton label="Messages" href="#messages" variant="soft" size="sm" badge={120}>
          <ChevronRightIcon />
        </LinkIconButton>
      </>,
    );
    const button = screen.getByRole('button');
    const link = screen.getByRole('link');
    expect(link.className).toBe(button.className);
    for (const attribute of ['data-variant', 'data-size', 'aria-label']) {
      expect(link.getAttribute(attribute)).toBe(button.getAttribute(attribute));
    }
    expect(link.innerHTML).toBe(button.innerHTML);
  });

  it('takes a className beside its own', () => {
    render(<Ghost className="extra" />);
    expect(screen.getByRole('link')).toHaveClass('root', 'extra');
  });

  it('shows a badge hidden from assistive technology, none for 0, and caps it at 99+', () => {
    const { container, rerender } = render(<Ghost badge={0} />);
    expect(container.querySelector('.badge')).toBeNull();

    rerender(<Ghost badge={4} />);
    expect(screen.getByText('4')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link', { name: 'Open event' })).toBeInTheDocument();

    rerender(<Ghost badge={100} />);
    expect(screen.getByText('99+')).toHaveAttribute('aria-hidden', 'true');
  });
});
