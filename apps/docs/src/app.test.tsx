import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { axe } from '../test/axe';
import { DocsApp } from './app';
import type { HostToastManager } from './host/toast';

function stubHostToast(): HostToastManager {
  return { add: () => 'toast-1', close: () => undefined, update: () => undefined };
}

// Base UI's Tabs schedules a real `requestAnimationFrame` on mount, to clear the active panel's
// initial transition-status attribute (`useTransitionStatus` inside `@base-ui/react`). Axe's scan
// below is slow enough over this page's DOM for that frame to land mid-test and outside any
// `act()`, which would otherwise print a spurious "not wrapped in act(...)" warning. Flushing one
// frame ourselves, inside `act()`, settles it before that scan runs.
async function settleInitialTabTransition(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  });
}

describe('DocsApp', () => {
  it('renders the overview without a host', async () => {
    const { container } = render(<DocsApp />);
    await settleInitialTabTransition();
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
