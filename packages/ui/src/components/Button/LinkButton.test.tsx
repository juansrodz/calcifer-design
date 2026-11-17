import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { LinkButton } from './LinkButton';
import * as stories from './LinkButton.stories';

// Today's DOM for a default link button, captured before the row variant and the end icon
// existed. Never edited: it guards "every default leaves today's DOM unchanged".
const DEFAULT_LINK_BUTTON_HTML =
  '<a href="/projects" class="root" data-variant="primary" data-size="md" data-tone="accent"><span class="label">Open projects</span></a>';

const { Primary, Secondary, Ghost, Small, Inverse, Large, Row } = composeStories(stories);

describe('LinkButton', () => {
  it.each([
    ['Primary', Primary],
    ['Secondary', Secondary],
    ['Ghost', Ghost],
    ['Small', Small],
    ['Inverse', Inverse],
    ['Large', Large],
    ['Row', Row],
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

  it('writes the tone beside the variant on the anchor and wears the button class', () => {
    render(<Inverse />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-tone', 'inverse');
    expect(link).toHaveAttribute('data-variant', 'primary');
    expect(link).toHaveClass('root');
  });

  it('defaults to the accent tone', () => {
    render(<Primary />);
    expect(screen.getByRole('link')).toHaveAttribute('data-tone', 'accent');
  });

  it('takes the large size', () => {
    render(<Large />);
    expect(screen.getByRole('link')).toHaveAttribute('data-size', 'lg');
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

  it('leaves the default anchor unchanged by the row variant and the end icon', () => {
    render(<LinkButton href="/projects">Open projects</LinkButton>);
    expect(screen.getByRole('link').outerHTML).toBe(DEFAULT_LINK_BUTTON_HTML);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['false', false],
    ['true', true],
    ['an empty string', ''],
  ])('renders no end icon slot when the end icon is %s', (_name, endIcon) => {
    render(
      <LinkButton href="/projects" endIcon={endIcon}>
        Open projects
      </LinkButton>,
    );
    expect(screen.getByRole('link').outerHTML).toBe(DEFAULT_LINK_BUTTON_HTML);
  });

  it('renders a row link with its decorative end icon last, outside the name', () => {
    render(<Row />);
    const link = screen.getByRole('link', { name: 'Change password' });
    expect(link).toHaveAttribute('data-variant', 'row');
    expect(link).toHaveClass('root');
    expect(Array.from(link.children).map((child) => child.className)).toEqual(['label', 'endIcon']);
    expect(link.lastElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(link.lastElementChild?.querySelector('svg')).not.toBeNull();
  });
});
