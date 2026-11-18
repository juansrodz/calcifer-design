import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import styles from './EmptyState.module.css';
import * as stories from './EmptyState.stories';

// `Dark` is composed for its axe pass only: jsdom loads no CSS, so the theme it asks for changes
// nothing here and the pass proves that both of its cards render and are accessible.
const { Default, WithActions, Selected, HeadingLevel, Dark, Bare } = composeStories(stories);

/** The root is the only element a story's render carries `data-tone` on. */
function rootOf(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[data-tone]');
}

describe('EmptyState', () => {
  it.each([
    ['Default', Default],
    ['WithActions', WithActions],
    ['Selected', Selected],
    ['HeadingLevel', HeadingLevel],
    ['Dark', Dark],
    ['Bare', Bare],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders an h2 with the heading text and the body sentence by default', () => {
    render(<Default />);
    expect(screen.getByRole('heading', { level: 2, name: 'No events yet' })).toBeInTheDocument();
    expect(screen.getByText('When someone invites you, the event shows up here.')).toBeVisible();
  });

  it('lets headingLevel choose the tag', () => {
    render(<HeadingLevel />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'No one else is going yet' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('renders an h4 for level 4 and falls back to an h2 for a level outside the union', () => {
    const { rerender } = render(<Default headingLevel={4} />);
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    // A JavaScript caller is not held to the union; an unknown level must not throw in React.
    rerender(<Default headingLevel={9 as 2} />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('draws the neutral centred card by default', () => {
    const { container } = render(<Default />);
    const root = rootOf(container);
    expect(root).toHaveAttribute('data-tone', 'neutral');
    expect(root).toHaveAttribute('data-align', 'center');
    expect(root).toHaveClass('root');
  });

  it('is a card unless bare: bare writes data-bare, which drops its surface and shadow', () => {
    const { container, rerender } = render(<Default />);
    expect(rootOf(container)).not.toHaveAttribute('data-bare');

    rerender(<Default bare />);
    const root = rootOf(container);
    expect(root).toHaveAttribute('data-bare', '');
    // The tone and the alignment are still written, so the bare box keeps their rules.
    expect(root).toHaveAttribute('data-tone', 'neutral');
    expect(root).toHaveAttribute('data-align', 'center');
  });

  it('makes the actions reachable by Tab', async () => {
    render(<WithActions />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Create an event' })).toHaveFocus();
  });

  it('puts the actions after the body, in their own box', () => {
    const { container } = render(<WithActions />);
    const body = container.querySelector(`.${styles.body}`);
    const actions = container.querySelector(`.${styles.actions}`);
    expect(body).not.toBeNull();
    expect(actions).toContainElement(screen.getByRole('button', { name: 'Create an event' }));
    expect(body?.compareDocumentPosition(actions as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('writes the selected tone and the start alignment on the root of Selected', () => {
    const { container } = render(<Selected />);
    const root = rootOf(container);
    expect(root).toHaveAttribute('data-tone', 'selected');
    expect(root).toHaveAttribute('data-align', 'start');
  });

  it('puts the illustration slot before the heading, hidden from assistive technology', () => {
    const { container } = render(<Selected />);
    const illustration = container.querySelector(`.${styles.illustration}`);
    expect(illustration).not.toBeNull();
    expect(illustration).toHaveAttribute('aria-hidden', 'true');
    expect(illustration?.querySelector('svg')).not.toBeNull();
    const heading = screen.getByRole('heading', { name: 'Nothing to bring yet' });
    expect(illustration?.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    // It is the first child of the root, ahead of everything.
    expect(rootOf(container)?.firstElementChild).toBe(illustration);
  });

  it('draws no illustration, body or actions box when none is given', () => {
    const { container } = render(<HeadingLevel />);
    expect(container.querySelector(`.${styles.illustration}`)).toBeNull();
    expect(container.querySelector(`.${styles.body}`)).toBeNull();
    expect(container.querySelector(`.${styles.actions}`)).toBeNull();
    // The heading is all there is.
    expect(rootOf(container)?.children).toHaveLength(1);
  });

  it('draws no body box for an empty child', () => {
    const { container } = render(<Default>{false}</Default>);
    expect(container.querySelector(`.${styles.body}`)).toBeNull();
  });

  it('is not a landmark', () => {
    render(<Selected />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('joins a class from the caller to the root after its own', () => {
    const { container } = render(<Default className="from-the-app" />);
    const root = rootOf(container);
    expect(root).toHaveClass('root');
    expect(root).toHaveClass('from-the-app');
    expect(root?.className.split(' ')).toHaveLength(2);
  });
});
