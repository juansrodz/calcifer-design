import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './LiveRegion.stories';

const { Polite, Assertive } = composeStories(stories);

describe('LiveRegion', () => {
  it('has no axe violations', async () => {
    const { container } = render(<Polite />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is a polite status region by default', () => {
    render(<Polite />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Loading Federation Showcase');
  });

  it('can be assertive', () => {
    render(<Assertive />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });
});
