import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './PageHeading.stories';

const { Default, WithEyebrow, FocusOnMount } = composeStories(stories);

describe('PageHeading', () => {
  it.each([
    ['Default', Default],
    ['WithEyebrow', WithEyebrow],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders an h1 by default', () => {
    render(<Default />);
    expect(screen.getByRole('heading', { level: 1, name: 'Projects' })).toBeInTheDocument();
  });

  it('does not steal focus by default', () => {
    render(<Default />);
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus();
  });

  it('focuses itself on mount when asked', () => {
    render(<FocusOnMount />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });
});
