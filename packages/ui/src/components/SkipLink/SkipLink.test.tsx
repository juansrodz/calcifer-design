import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './SkipLink.stories';

const { Default } = composeStories(stories);

describe('SkipLink', () => {
  it('has no axe violations', async () => {
    const { container } = render(<Default />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('links to the target id', () => {
    render(<Default />);
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });
});
