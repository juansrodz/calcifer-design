import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './StatusDot.stories';

const { Registered, Loading, Loaded, Failed } = composeStories(stories);

describe('StatusDot', () => {
  it.each([
    ['Registered', Registered],
    ['Loading', Loading],
    ['Loaded', Loaded],
    ['Failed', Failed],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('exposes the status as text, not colour alone', () => {
    render(<Failed />);
    expect(screen.getByText('showcase')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('sets the status attribute for styling', () => {
    render(<Loaded />);
    expect(screen.getByTestId('status-dot')).toHaveAttribute('data-status', 'loaded');
  });
});
