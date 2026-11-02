import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Breadcrumb } from './Breadcrumb';
import * as stories from './Breadcrumb.stories';

const { Default, CustomLabel, UnlinkedMiddle, OnlyTheCurrentPage, LongTrail, RouterLinks, Dark } =
  composeStories(stories);

describe('Breadcrumb', () => {
  it.each([
    ['Default', Default],
    ['CustomLabel', CustomLabel],
    ['UnlinkedMiddle', UnlinkedMiddle],
    ['OnlyTheCurrentPage', OnlyTheCurrentPage],
    ['LongTrail', LongTrail],
    ['RouterLinks', RouterLinks],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('renders nav > ol with one item per step, named Breadcrumb by default', () => {
    render(<Default />);
    const navigation = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const list = navigation.firstElementChild as HTMLElement;
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('takes its own landmark name', () => {
    render(<CustomLabel />);
    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument();
  });

  it('links each earlier item', () => {
    render(<Default />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
  });

  it('makes the last item plain text with aria-current="page"', () => {
    render(<Default />);
    const current = screen.getByText('Design system');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('a')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('ignores an href on the last item: it is where the reader already is', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Here', href: '/here' },
        ]}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Here' })).not.toBeInTheDocument();
    expect(screen.getByText('Here')).toHaveAttribute('aria-current', 'page');
  });

  it('leaves an earlier item with no href as text, not as the current page', () => {
    render(<UnlinkedMiddle />);
    const archive = screen.getByText('Archive');
    expect(archive.closest('a')).toBeNull();
    expect(archive).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '2026' })).toBeInTheDocument();
    expect(screen.getByText('November')).toHaveAttribute('aria-current', 'page');
  });

  it('hides its separators from assistive technology, and draws none before the first', () => {
    render(<Default />);
    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]?.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(listItems[1]?.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(listItems[2]?.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('hands renderLink the item and the props, once per linked item', () => {
    const renderLink = vi.fn((item: { href: string }, { children, ...linkProps }) => (
      <a href={item.href} data-router-link="" {...linkProps}>
        {children}
      </a>
    ));
    render(
      <Breadcrumb
        renderLink={renderLink}
        items={[{ label: 'Home', href: '/' }, { label: 'Plain' }, { label: 'Here', href: '/here' }]}
      />,
    );
    expect(renderLink).toHaveBeenCalledTimes(1);
    expect(renderLink.mock.calls[0]?.[0]).toEqual({ label: 'Home', href: '/' });
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('data-router-link');
    expect(link.className).not.toBe('');
  });

  it('renders the router link from the story', () => {
    render(<RouterLinks />);
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '#router/projects',
    );
  });

  it('reaches every link with the tab key, and never the current page', async () => {
    render(<Default />);
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveFocus();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it('renders no landmark for an empty trail', () => {
    render(<Breadcrumb items={[]} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
