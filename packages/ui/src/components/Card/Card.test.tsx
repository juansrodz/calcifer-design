import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './Card.stories';

const { Default, WithFooter, AsArticle } = composeStories(stories);

describe('Card', () => {
  it.each([['Default', Default], ['WithFooter', WithFooter], ['AsArticle', AsArticle]])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the heading at the requested level', () => {
    render(<Default />);
    expect(screen.getByRole('heading', { level: 3, name: 'Federation Showcase' })).toBeInTheDocument();
  });

  it('renders as an article when asked', () => {
    render(<AsArticle />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
