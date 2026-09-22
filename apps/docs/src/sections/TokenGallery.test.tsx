import { themes } from '@calcifer-design/tokens';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../test/axe';
import { contrastPairRows } from '../tokens/contrast-table';
import { TokenGallery } from './TokenGallery';

describe('TokenGallery', () => {
  it('renders a contrast row per pair, each one reporting a pass', () => {
    render(<TokenGallery />);
    const table = screen.getByRole('table', { name: /contrast/i });
    // One header row plus one row per pair.
    expect(within(table).getAllByRole('row')).toHaveLength(contrastPairRows().length + 1);
    expect(within(table).getAllByText('Pass')).toHaveLength(contrastPairRows().length);
  });

  it('shows every colour in both themes, so the dark ramp is visible from a light page', () => {
    render(<TokenGallery />);
    const paletteSize = Object.keys(themes.light.color).length;
    expect(screen.getAllByTestId('swatch')).toHaveLength(paletteSize * 2);
  });

  it('lists the type scale and the breakpoints as data, not as prose', () => {
    render(<TokenGallery />);
    expect(screen.getByRole('table', { name: /type scale/i })).toBeVisible();
    expect(screen.getByText('--text-h2-feature')).toBeVisible();
    expect(screen.getByRole('table', { name: /breakpoints/i })).toBeVisible();
    expect(
      within(screen.getByRole('table', { name: /breakpoint/i })).getByText('112.5rem'),
    ).toBeVisible();
  });

  it('has no axe violations', async () => {
    const { container } = render(<TokenGallery />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
