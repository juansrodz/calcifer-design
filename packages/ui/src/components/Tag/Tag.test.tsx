import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './Tag.stories';

const { Neutral, Accent } = composeStories(stories);

describe('Tag', () => {
  it.each([
    ['Neutral', Neutral],
    ['Accent', Accent],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies the tone attribute', () => {
    render(<Accent />);
    expect(screen.getByText('bridge')).toHaveAttribute('data-tone', 'accent');
  });
});
