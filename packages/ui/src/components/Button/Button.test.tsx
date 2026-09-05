import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { Button } from './Button';
import * as stories from './Button.stories';

const { Primary, Secondary, Ghost, Disabled, Loading, Small } = composeStories(stories);

describe('Button', () => {
  it.each([
    ['Primary', Primary],
    ['Secondary', Secondary],
    ['Ghost', Ghost],
    ['Disabled', Disabled],
    ['Loading', Loading],
    ['Small', Small],
  ])('%s story renders and has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
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
});
