import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { Collapsible } from './Collapsible';
import styles from './Collapsible.module.css';
import * as stories from './Collapsible.stories';

const { Default, OpenOnArrival, WithAside, Controlled, Disabled, HeadingSize, Dark } =
  composeStories(stories);

describe('Collapsible', () => {
  it.each([
    ['Default', Default],
    ['OpenOnArrival', OpenOnArrival],
    ['WithAside', WithAside],
    ['Controlled', Controlled],
    ['Disabled', Disabled],
    ['HeadingSize', HeadingSize],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('puts a button named by the label and the aside inside an h3, wired to the panel', () => {
    render(<WithAside />);
    const heading = screen.getByRole('heading', { level: 3 });
    const trigger = screen.getByRole('button', { name: 'Mains 2' });
    expect(heading).toContainElement(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Base UI writes `aria-controls` only while open; the panel is always mounted, so the
    // component names it in both states.
    const panelId = trigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId ?? '')).toHaveTextContent('Lasagna for six');
  });

  it('keeps the closed panel in the page, hidden', () => {
    render(<Default />);
    const content = screen.getByText(/Lasagna for six/);
    expect(content).toBeInTheDocument();
    expect(content).not.toBeVisible();
    expect(content.parentElement).toHaveAttribute('hidden');
  });

  it('opens on arrival with defaultOpen, and shows the content', () => {
    render(<OpenOnArrival />);
    expect(screen.getByRole('button', { name: 'Mains' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Lasagna for six/)).toBeVisible();
  });

  it('toggles with a click and then with Enter, reporting each change with one argument', async () => {
    const onOpenChange = vi.fn();
    render(<Default onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Mains' });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
    expect(screen.getByText(/Lasagna for six/)).toBeVisible();
    await userEvent.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange.mock.calls.every((call) => call.length === 1)).toBe(true);
  });

  it('toggles with Space as well', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Mains' });
    trigger.focus();
    await userEvent.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders the heading at the level asked for', () => {
    render(<Default headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Mains' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('renders an h6 at the deepest level, and an h3 for a level outside two to six', () => {
    const { rerender } = render(<Default headingLevel={6} />);
    expect(screen.getByRole('heading', { level: 6 })).toBeInTheDocument();
    // A JavaScript caller is not held to the union: an unknown level must not resolve to an
    // undefined element type and throw.
    rerender(<Default headingLevel={9 as 3} />);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('stays open when controlled open, while still reporting the click', async () => {
    const onOpenChange = vi.fn();
    render(<Controlled onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Mains' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Lasagna for six/)).toBeVisible();
  });

  it('does nothing when disabled, yet stays in the tab order', async () => {
    const onOpenChange = vi.fn();
    render(<Disabled onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Mains' });
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    expect(trigger).toHaveAttribute('data-disabled');
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(trigger);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('wraps a plain-text aside in an element of its own, so a disabled row dims it too', () => {
    render(
      <Collapsible heading="Mains" headingAside="2 dishes" disabled>
        Lasagna for six
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Mains 2 dishes' });
    // The dimming rule is `.trigger[data-disabled] > *`, which a bare text node escapes.
    expect(screen.getByText('2 dishes').parentElement).toBe(trigger);
    expect(screen.getByText('2 dishes').tagName).toBe('SPAN');
  });

  it('carries data-open on the root only while open', async () => {
    const { container } = render(<Default />);
    const root = container.querySelector('section');
    expect(root).not.toBeNull();
    expect(root).not.toHaveAttribute('data-open');
    await userEvent.click(screen.getByRole('button', { name: 'Mains' }));
    expect(root).toHaveAttribute('data-open');
    await userEvent.click(screen.getByRole('button', { name: 'Mains' }));
    expect(root).not.toHaveAttribute('data-open');
  });

  it('joins a class from the caller to the root after its own', () => {
    const { container } = render(<Default className="from-the-app" />);
    const root = container.querySelector('section');
    // The component's class first and the caller's last, so the caller's wins a tie.
    expect(root?.className.split(' ')).toEqual([styles.root, 'from-the-app']);
  });

  it('hides the chevron, wrapper and icon alike, from assistive technology', () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Mains' });
    const icon = trigger.querySelector('svg');
    expect(icon).not.toBeNull();
    // The wrapper is what the stylesheet turns; the icon's own `aria-hidden` is the icon's, so
    // each is asserted on its own.
    expect(icon?.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  /**
   * jsdom draws nothing, so these prove the marks the stylesheet turns the chevron by; the turns
   * themselves are pinned in `token-reads.test.ts` and seen in the `ChevronEndDown` story.
   */
  describe('the chevron', () => {
    const chevronOf = (name: string) =>
      screen.getByRole('button', { name }).querySelector('svg')?.parentElement;

    it('is marked down-up by default: down while closed and up while open, as before', () => {
      render(<Default />);
      expect(chevronOf('Mains')).toHaveAttribute('data-chevron', 'down-up');
    });

    it('is marked end-down when asked, with the reading direction it turns by', () => {
      render(<Default chevron="end-down" />);
      const chevron = chevronOf('Mains');
      expect(chevron).toHaveAttribute('data-chevron', 'end-down');
      expect(chevron).toHaveAttribute('data-direction', 'ltr');
    });

    it('marks the direction it is read in, from a dir attribute', () => {
      render(
        <div dir="rtl">
          <Collapsible heading="Mains" chevron="end-down">
            Lasagna for six
          </Collapsible>
        </div>,
      );
      expect(chevronOf('Mains')).toHaveAttribute('data-direction', 'rtl');
    });

    it('marks the computed direction, with no dir attribute at all', () => {
      document.documentElement.style.direction = 'rtl';
      try {
        render(<Default chevron="end-down" />);
        expect(chevronOf('Mains')).toHaveAttribute('data-direction', 'rtl');
      } finally {
        document.documentElement.style.removeProperty('direction');
      }
    });
  });
});
