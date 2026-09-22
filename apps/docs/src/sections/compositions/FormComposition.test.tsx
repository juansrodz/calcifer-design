import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from '../../../test/axe';
import { stubHostToast } from '../../../test/host-toast';
import { FormComposition } from './FormComposition';

async function fileRequest(user: UserEvent, componentName: string) {
  await user.type(screen.getByRole('textbox', { name: /component name/i }), componentName);
  await user.click(screen.getByRole('button', { name: /file the request/i }));
}

describe('FormComposition', () => {
  it('composes the form from the library’s Tier 3 components and says so', () => {
    render(<FormComposition />);
    expect(screen.getByRole('textbox', { name: /component name/i })).toBeVisible();
    expect(screen.getByRole('combobox', { name: /tier/i })).toBeVisible();
    expect(screen.getByRole('radiogroup', { name: /priority/i })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /why it is needed/i })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: /notify me/i })).toBeVisible();
    expect(screen.getByRole('switch', { name: /blocker/i })).toBeVisible();
    expect(screen.getByTestId('form-note')).toHaveTextContent(/Tier 3/);
  });

  it('refuses to file an unnamed component and says why', async () => {
    const user = userEvent.setup();
    const hostToast = stubHostToast();
    render(<FormComposition hostToast={hostToast} />);
    await user.click(screen.getByRole('button', { name: /file the request/i }));
    expect(screen.getByText('Name the component.')).toBeVisible();
    expect(hostToast.add).not.toHaveBeenCalled();
    expect(screen.queryByTestId('alert')).toBeNull();
  });

  it('files through the host toast manager when one is present', async () => {
    const user = userEvent.setup();
    const hostToast = stubHostToast();
    render(<FormComposition hostToast={hostToast} />);
    await fileRequest(user, 'Combobox');
    expect(hostToast.add).toHaveBeenCalledWith({
      title: 'Request filed',
      description: 'Combobox was filed against the backlog.',
      tone: 'success',
    });
    expect(screen.queryByTestId('alert')).toBeNull();
  });

  it('carries the blocker switch into the message the host is handed', async () => {
    const user = userEvent.setup();
    const hostToast = stubHostToast();
    render(<FormComposition hostToast={hostToast} />);
    await user.click(screen.getByRole('switch', { name: /blocker/i }));
    await fileRequest(user, 'Combobox');
    expect(hostToast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Combobox was filed against the backlog as a blocker.',
      }),
    );
  });

  it('shows the receipt inline when no host is listening', async () => {
    const user = userEvent.setup();
    render(<FormComposition />);
    await fileRequest(user, 'Combobox');
    expect(screen.getByTestId('alert')).toHaveTextContent(
      'Combobox was filed against the backlog.',
    );
    // `role="status"`, not `role="alert"`: Alert derives its politeness from its tone, and only
    // `danger` is assertive. A success receipt is announced without interrupting.
    expect(screen.getByRole('status')).toBeVisible();
  });

  it('has no axe violations at rest', async () => {
    const { container } = render(<FormComposition />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
