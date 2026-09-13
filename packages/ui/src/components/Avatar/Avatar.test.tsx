import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import { Avatar } from './Avatar';
import * as stories from './Avatar.stories';

const { Initials, Small, Large, Square, SingleName, WithImage } = composeStories(stories);

describe('Avatar', () => {
  it.each([
    ['Initials', Initials],
    ['Small', Small],
    ['Large', Large],
    ['Square', Square],
    ['SingleName', SingleName],
    ['WithImage', WithImage],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the first and last initial of a multi-word name', () => {
    render(<Initials />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('shows a single initial for a one-word name', () => {
    render(<SingleName />);
    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('reads out the full name, not the initials', () => {
    render(<Initials />);
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('renders the fallback rather than an image in jsdom, where images never load', () => {
    render(<WithImage />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('GI')).toBeInTheDocument();
  });

  it('carries the size and shape as data attributes', () => {
    render(<Square />);
    const root = screen.getByTestId('avatar');
    expect(root).toHaveAttribute('data-shape', 'square');
    expect(root).toHaveAttribute('data-size', 'md');
  });

  it('renders nothing readable for an empty name rather than crashing', () => {
    render(<Avatar name="" />);
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });
});
