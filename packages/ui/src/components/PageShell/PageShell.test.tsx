import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './PageShell.stories';

const { Default, WithSidebar, ContentOnly, CustomTarget, Dark } = composeStories(stories);

describe('PageShell', () => {
  // `axe`, not `axeDocument`: `region` is the rule a shell exists to satisfy, so it stays on.
  it.each([
    ['Default', Default],
    ['WithSidebar', WithSidebar],
    ['ContentOnly', ContentOnly],
    ['CustomTarget', CustomTarget],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the skip link, then header, aside, main and footer, in that order', () => {
    const { container } = render(<WithSidebar />);
    const order = [...(container.firstElementChild?.children ?? [])].map(
      (element) => element.tagName,
    );
    expect(order).toEqual(['A', 'HEADER', 'ASIDE', 'MAIN', 'FOOTER']);
  });

  it('exposes each landmark, and names the sidebar', () => {
    render(<WithSidebar />);
    expect(screen.getByRole('banner')).toHaveTextContent('Calcifer');
    expect(screen.getByRole('complementary', { name: 'Project sections' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent("The page's own content.");
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Built in the open.');
  });

  it('renders no landmark for a slot it was not given', () => {
    render(<ContentOnly />);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('says whether there is a sidebar, for the skin', () => {
    const { container: withContainer } = render(<WithSidebar />);
    expect(withContainer.firstElementChild).toHaveAttribute('data-has-sidebar');
    const { container: withoutContainer } = render(<Default />);
    expect(withoutContainer.firstElementChild).not.toHaveAttribute('data-has-sidebar');
  });

  it('is the first stop for the keyboard, and the skip link lands focus on main', async () => {
    render(<WithSidebar />);
    await userEvent.tab();
    const skipLink = screen.getByRole('link', { name: 'Skip to content' });
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveAttribute('href', '#main');
    await userEvent.keyboard('{Enter}');
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main).toHaveFocus();
  });

  it('takes its own target id and its own link text', async () => {
    render(<CustomTarget />);
    await userEvent.click(screen.getByRole('link', { name: 'Jump to the page' }));
    expect(screen.getByRole('main')).toHaveAttribute('id', 'page-content');
    expect(screen.getByRole('main')).toHaveFocus();
  });
});
