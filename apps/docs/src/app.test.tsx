import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../test/axe';
import { stubHostToast } from '../test/host-toast';
import { DocsApp } from './app';

describe('DocsApp', () => {
  it('renders the overview without a host', async () => {
    const { container } = render(<DocsApp />);
    expect(
      screen.getByRole('heading', { name: 'A design system with a front door' }),
    ).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('says who owns the toast region, and the answer depends on the manager, not on a flag', () => {
    const { rerender } = render(<DocsApp />);
    expect(screen.getByTestId('toast-owner')).toHaveTextContent('none supplied');
    rerender(<DocsApp hostToast={stubHostToast()} />);
    expect(screen.getByTestId('toast-owner')).toHaveTextContent('the host');
  });

  it('puts each section in its own tab panel, with the overview open first', () => {
    render(<DocsApp />);
    expect(screen.getByRole('tab', { name: 'Overview', selected: true })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Tokens' })).toBeVisible();
  });
});
