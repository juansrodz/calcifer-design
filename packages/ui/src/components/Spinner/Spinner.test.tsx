import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import * as stories from './Spinner.stories';

const { Medium, Small, Large, Announced } = composeStories(stories);

describe('Spinner', () => {
  it.each([
    ['Medium', Medium],
    ['Small', Small],
    ['Large', Large],
    ['Announced', Announced],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is decorative when it has no label, so a busy control announces on its own behalf', () => {
    render(<Medium />);
    expect(screen.getByTestId('spinner')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('announces through a status region when given a label', () => {
    render(<Announced />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading projects');
  });

  it('carries the size as a data attribute', () => {
    render(<Small />);
    expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'sm');
  });
});
