import { checkThemeContrast } from '@calcifer-design/tokens';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import { Avatar } from './Avatar';
import * as stories from './Avatar.stories';
import { avatarColorsTheme } from './fixtures';

const {
  Initials,
  Small,
  Large,
  Square,
  SingleName,
  WithImage,
  ColorFromSeed,
  Sizes,
  ExactSize,
  Dark,
} = composeStories(stories);

describe('Avatar', () => {
  it.each([
    ['Initials', Initials],
    ['Small', Small],
    ['Large', Large],
    ['Square', Square],
    ['SingleName', SingleName],
    ['WithImage', WithImage],
    ['ColorFromSeed', ColorFromSeed],
    ['Sizes', Sizes],
    ['ExactSize', ExactSize],
    ['Dark', Dark],
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

  it('skips what leads a word before its first letter or digit', () => {
    const { unmount } = render(<Avatar name="Dad (Pablo)" />);
    expect(screen.getByText('DP')).toBeInTheDocument();
    unmount();
    render(<Avatar name="(Pablo)" />);
    expect(screen.getByText('PA')).toBeInTheDocument();
  });

  it('skips a word that is punctuation alone', () => {
    const { unmount } = render(<Avatar name="Juan –" />);
    expect(screen.getByText('J')).toBeInTheDocument();
    unmount();
    const { unmount: unmountSecond } = render(<Avatar name="Dad (Pablo )" />);
    expect(screen.getByText('DP')).toBeInTheDocument();
    unmountSecond();
    // Only punctuation is skipped: an emoji word still gives the first initial.
    render(<Avatar name="🎉 Party" />);
    expect(screen.getByText('🎉P')).toBeInTheDocument();
  });

  it.each([
    ['?', '?'],
    ['- -', '--'],
    ['Dad (Pablo)', 'DP'],
    ['¿Ñoño? Pérez', 'ÑP'],
    ['42nd Street', '4S'],
  ])('reads %s as %s', (name, initials) => {
    // The decorative span is read, since for "?" the initials equal the name.
    const { container } = render(<Avatar name={name} />);
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(initials);
  });

  it('keeps the first code point of a word with no letter or digit, as before', () => {
    const { unmount } = render(<Avatar name="🎉 Party" />);
    expect(screen.getByText('🎉P')).toBeInTheDocument();
    unmount();
    // The initials equal the name here, so the decorative span is read rather than the text.
    const { container } = render(<Avatar name="🎉🎊" />);
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe('🎉🎊');
  });

  it('leaves plain names as they were', () => {
    const { unmount } = render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
    unmount();
    render(<Avatar name="Cher" />);
    expect(screen.getByText('CH')).toBeInTheDocument();
  });

  it('uses the first and last word, ignoring the ones between', () => {
    render(<Avatar name="Ada King Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('colours the root from the seed: uid-1 is colour 2', () => {
    render(<ColorFromSeed />);
    const roots = screen.getAllByTestId('avatar');
    expect(roots).toHaveLength(6);
    expect(roots[0]).toHaveAttribute('data-color', '2');
    // uid-2 hashes to colour 1, so the six seeds are not all one colour.
    expect(roots[1]).toHaveAttribute('data-color', '1');
  });

  it('carries no data-color without a seed, so today’s look stays', () => {
    render(<Initials />);
    expect(screen.getByTestId('avatar')).not.toHaveAttribute('data-color');
  });

  it('keeps data-color on the root while an image is on its way', () => {
    render(<Avatar name="GitHub" src="https://example.test/avatar.png" colorSeed="uid-1" />);
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-color', '2');
  });

  it('renders the five sizes as data-size, xs to xl', () => {
    render(<Sizes />);
    const sizes = screen.getAllByTestId('avatar').map((root) => root.getAttribute('data-size'));
    expect(sizes).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
  });

  it('joins a consumer class to the root beside its own', () => {
    render(<Avatar name="Ada Lovelace" className="ring" />);
    expect(screen.getByTestId('avatar')).toHaveClass('root', 'ring');
  });

  it.each([
    ['ColorFromSeed', ColorFromSeed],
    ['Dark', Dark],
  ])('%s sits in the six-colour theme, whose sheet is on the page', (_name, Story) => {
    const { container } = render(<Story />);
    const scope = container.querySelector(`.${avatarColorsTheme.className}`);
    expect(scope).not.toBeNull();
    expect(scope?.querySelectorAll('[data-testid="avatar"]')).toHaveLength(6);
    const sheet = container.querySelector('style')?.textContent ?? '';
    expect(sheet).toContain('--color-avatar-fill-1: #BFDBFE');
    expect(sheet).toContain('--color-avatar-fill-1: #1E40AF');
  });

  // The stories' colours only show because this theme gives the six pairs six distinct values;
  // a pair under 4.5:1 would make the story it dresses a contrast failure.
  it('gives the story theme six pairs that all pass the contrast check', () => {
    expect(checkThemeContrast(avatarColorsTheme)).toEqual([]);
  });
});
