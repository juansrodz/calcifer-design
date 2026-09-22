import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { HostToastManager } from '../../host/toast';
import { FormComposition } from './FormComposition';

function stubHostToast(): HostToastManager {
  return { add: vi.fn(() => 'toast-1'), close: vi.fn(), update: vi.fn() };
}

describe('FormComposition', () => {
  it('names the slot Tier 3 fills, so replacing it is a test failure and not a memory', () => {
    render(<FormComposition />);
    expect(screen.getByTestId('tier-3-slot')).toHaveTextContent(/Tier 3/);
    expect(screen.getByTestId('tier-3-slot')).toHaveTextContent(/Plan C/);
  });

  it('labels every field, which is the part a native form still has to get right', () => {
    render(<FormComposition />);
    expect(screen.getByLabelText('Component name')).toBeVisible();
    expect(screen.getByLabelText('Tier')).toBeVisible();
    expect(screen.getByLabelText('Why it is needed')).toBeVisible();
  });

  it('raises a toast through the host manager when there is one', async () => {
    const hostToast = stubHostToast();
    const user = userEvent.setup();
    render(<FormComposition hostToast={hostToast} />);
    await user.type(screen.getByLabelText('Component name'), 'Breadcrumb');
    await user.click(screen.getByRole('button', { name: 'File the request' }));
    expect(hostToast.add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Request filed', tone: 'success' }),
    );
    expect(screen.queryByTestId('alert')).toBeNull();
  });

  it('falls back to an inline alert when no manager reached this remote', async () => {
    const user = userEvent.setup();
    render(<FormComposition />);
    await user.type(screen.getByLabelText('Component name'), 'Breadcrumb');
    await user.click(screen.getByRole('button', { name: 'File the request' }));
    // `role="status"`, not `role="alert"`: Alert derives its politeness from its tone, and only
    // `danger` is assertive (Alert.tsx:99). A success receipt does not interrupt.
    const receipt = await screen.findByRole('status');
    expect(receipt).toHaveTextContent('Breadcrumb');
  });
});
