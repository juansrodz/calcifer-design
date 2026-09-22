import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '../../../test/axe';
import { FormComposition } from './FormComposition';

function stubHostToast() {
  return { add: vi.fn(() => 'toast-1'), close: vi.fn(), update: vi.fn() };
}

function fileRequest(componentName: string) {
  fireEvent.change(screen.getByRole('textbox', { name: /component name/i }), {
    target: { value: componentName },
  });
  fireEvent.click(screen.getByRole('button', { name: /file the request/i }));
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
    expect(screen.getByTestId('tier-3-slot')).toHaveTextContent(/Tier 3/);
    expect(screen.getByTestId('tier-3-slot')).toHaveTextContent(/Plan C/);
  });

  it('refuses to file an unnamed component and says why', () => {
    const hostToast = stubHostToast();
    render(<FormComposition hostToast={hostToast} />);
    fireEvent.click(screen.getByRole('button', { name: /file the request/i }));
    expect(screen.getByText('Name the component.')).toBeVisible();
    expect(hostToast.add).not.toHaveBeenCalled();
    expect(screen.queryByTestId('alert')).toBeNull();
  });

  it('files through the host toast manager when one is present', () => {
    const hostToast = stubHostToast();
    render(<FormComposition hostToast={hostToast} />);
    fileRequest('Combobox');
    expect(hostToast.add).toHaveBeenCalledWith({
      title: 'Request filed',
      description: 'Combobox was filed against the backlog.',
      tone: 'success',
    });
    expect(screen.queryByTestId('alert')).toBeNull();
  });

  it('shows the receipt inline when no host is listening', () => {
    render(<FormComposition />);
    fileRequest('Combobox');
    expect(screen.getByTestId('alert')).toHaveTextContent(
      'Combobox was filed against the backlog.',
    );
    expect(screen.getByRole('status')).toBeVisible();
  });

  it('has no axe violations at rest', async () => {
    const { container } = render(<FormComposition />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
