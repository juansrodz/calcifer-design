import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../test/axe';
import { DocsApp } from './app';
import type { HostToastManager } from './host/toast';

function stubHostToast(): HostToastManager {
  return { add: () => 'toast-1', close: () => undefined, update: () => undefined };
}

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
});
