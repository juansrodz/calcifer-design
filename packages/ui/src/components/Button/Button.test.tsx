import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './Button.stories';

const { Primary, Secondary, Ghost, Disabled, Loading, Small } = composeStories(stories);

describe('Button', () => {
  it.each([
    ['Primary', Primary], ['Secondary', Secondary], ['Ghost', Ghost],
    ['Disabled', Disabled], ['Loading', Loading], ['Small', Small],
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
});
