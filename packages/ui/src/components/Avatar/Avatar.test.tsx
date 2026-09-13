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

  it('renders no initials at all for an empty name', () => {
    const { container } = render(<Avatar name="" />);
    // Asserting the decorative span is genuinely empty, not merely that the root exists: an
    // avatar that rendered the string "undefined" would satisfy the latter.
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe('');
  });

  it('takes whole code points, so a name starting with an emoji is not split in half', () => {
    render(<Avatar name="😀 Lovelace" />);
    const initials = screen.getByText('😀L');
    expect(initials).toBeInTheDocument();
    // A lone surrogate renders as a broken glyph; this is the regression that guards against it.
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(initials.textContent ?? '')).toBe(false);
  });

  it('uses the first and last word, ignoring the ones between', () => {
    render(<Avatar name="Ada King Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });
});
