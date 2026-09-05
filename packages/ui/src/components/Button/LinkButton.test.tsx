import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { LinkButton } from './LinkButton';
import * as stories from './LinkButton.stories';

const { Primary, Secondary, Ghost, Small } = composeStories(stories);

describe('LinkButton', () => {
  it.each([
    ['Primary', Primary],
    ['Secondary', Secondary],
    ['Ghost', Ghost],
    ['Small', Small],
  ])('%s story renders a link with no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders an anchor that keeps link semantics and the button styling', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <LinkButton href="/projects" variant="ghost" size="sm">
        View projects
      </LinkButton>,
    );
    const link = screen.getByRole('link', { name: 'View projects' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/projects');
    expect(link).not.toHaveAttribute('role');
    expect(link).toHaveClass('root');
    expect(link).toHaveAttribute('data-variant', 'ghost');
    expect(link).toHaveAttribute('data-size', 'sm');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders the element given to `render` and keeps its own attributes', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Base UI clones this element and injects `LinkButton`'s own children ("Go") into it
    // at runtime, so the anchor is not actually empty despite how it looks here.
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    render(<LinkButton render={<a href="/x" data-custom="kept" />}>Go</LinkButton>);
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/x');
    expect(link).toHaveAttribute('data-custom', 'kept');
    expect(link).not.toHaveAttribute('role');
    expect(link).toHaveClass('root');
    expect(link).toHaveAttribute('data-variant', 'primary');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('has no axe violations', async () => {
    const { container } = render(<LinkButton href="/projects">View projects</LinkButton>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
