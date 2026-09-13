import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './IconButton.stories';

const { Ghost, Secondary, Primary, Small, Disabled, Loading } = composeStories(stories);

describe('IconButton', () => {
  it.each([
    ['Ghost', Ghost],
    ['Secondary', Secondary],
    ['Primary', Primary],
    ['Small', Small],
    ['Disabled', Disabled],
    ['Loading', Loading],
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
});
