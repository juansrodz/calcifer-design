import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { installMatchMedia } from '../../../test/matchMedia';
import * as stories from './NavMenu.stories';

const { Desktop, Mobile } = composeStories(stories);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NavMenu at desktop width', () => {
  it('renders a nav with links and marks the current page', async () => {
    installMatchMedia(true);
    const { container } = render(<Desktop />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('NavMenu at mobile width', () => {
  it('collapses into a menu button and opens with the keyboard', async () => {
    installMatchMedia(false);
    const { container } = render(<Mobile />);
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('menuitem', { name: 'About' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('closes on Escape', async () => {
    installMatchMedia(false);
    render(<Mobile />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(await screen.findByRole('menuitem', { name: 'About' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menuitem', { name: 'About' })).not.toBeInTheDocument();
  });

  it('closes when the current path changes', async () => {
    installMatchMedia(false);
    const { rerender } = render(<Mobile currentPath="/projects" />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(await screen.findByRole('menuitem', { name: 'About' })).toBeInTheDocument();
    rerender(<Mobile currentPath="/about" />);
    expect(screen.queryByRole('menuitem', { name: 'About' })).not.toBeInTheDocument();
  });
});
