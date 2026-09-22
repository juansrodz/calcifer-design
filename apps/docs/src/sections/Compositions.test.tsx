import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from '../../test/axe';
import { Compositions } from './Compositions';

describe('Compositions', () => {
  it('opens the dialog from its trigger and closes it on Escape', async () => {
    const user = userEvent.setup();
    render(<Compositions />);
    await user.click(screen.getByRole('button', { name: 'Edit the entry' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Edit the entry' })).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a popover from inside the open dialog, which is the layering claim the page makes', async () => {
    const user = userEvent.setup();
    render(<Compositions />);
    await user.click(screen.getByRole('button', { name: 'Edit the entry' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'What is a slug?' }));
    expect(await screen.findByRole('heading', { name: 'Slugs' })).toBeVisible();
    // Both surfaces are on the page at once: the popover did not replace the dialog. Base UI
    // gives Popover's popup `role="dialog"` too (same as Dialog's), so a fresh `getByRole`
    // query is ambiguous once both are open — reusing the reference captured before the
    // popover existed proves it's the same element, still on screen, not a fresh match.
    expect(dialog).toBeVisible();
  });

  it('opens the menu and runs the item that was chosen', async () => {
    const user = userEvent.setup();
    render(<Compositions />);
    await user.click(screen.getByRole('button', { name: 'Entry actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Duplicate' }));
    expect(screen.getByTestId('last-action')).toHaveTextContent('Duplicate');
  });

  it('catches a component that throws and lets the boundary reset it', async () => {
    const user = userEvent.setup();
    render(<Compositions />);
    await user.click(screen.getByRole('button', { name: 'Break the preview' }));
    expect(await screen.findByRole('heading', { name: 'This preview crashed' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByTestId('preview')).toHaveTextContent('Nothing is wrong here');
  });

  it('has no axe violations with everything closed', async () => {
    const { container } = render(<Compositions />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
