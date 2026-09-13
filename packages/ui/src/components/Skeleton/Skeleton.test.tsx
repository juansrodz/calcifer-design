import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import { Skeleton } from './Skeleton';
import * as stories from './Skeleton.stories';

const { TextLines, OneLine, Block, Circle } = composeStories(stories);

describe('Skeleton', () => {
  it.each([
    ['TextLines', TextLines],
    ['OneLine', OneLine],
    ['Block', Block],
    ['Circle', Circle],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is hidden from assistive technology: the wait is announced by a live region, not by a placeholder', () => {
    render(<TextLines />);
    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws one bar per line, three by default', () => {
    const { container } = render(<TextLines />);
    expect(container.querySelectorAll('[data-variant="text"]')).toHaveLength(3);
  });

  it('draws the requested number of lines', () => {
    const { container } = render(<OneLine />);
    expect(container.querySelectorAll('[data-variant="text"]')).toHaveLength(1);
  });

  it('applies the given dimensions to a block', () => {
    render(<Block />);
    // The inline style, not the computed one: jsdom resolves 8rem to 128px, and asserting the
    // resolved pixels would test jsdom's root font size rather than the component's own wiring.
    expect(screen.getByTestId('skeleton').style.height).toBe('8rem');
  });

  it('draws the last line short, so the stack reads as a paragraph', () => {
    const { container } = render(<TextLines />);
    const bars = container.querySelectorAll<HTMLElement>('[data-variant="text"]');
    expect(bars[bars.length - 1]?.style.width).toBe('60%');
    expect(bars[0]?.style.width).not.toBe('60%');
  });

  it('draws nothing for a line count of zero', () => {
    const { container } = render(<Skeleton lines={0} />);
    expect(container.querySelectorAll('[data-variant="text"]')).toHaveLength(0);
  });

  it.each([-3, 2.5, Number.NaN])(
    'clamps an out-of-range line count (%p) instead of throwing',
    (lines) => {
      const { container } = render(<Skeleton lines={lines} />);
      expect(container.querySelectorAll('[data-variant="text"]')).toHaveLength(0);
    },
  );
});
