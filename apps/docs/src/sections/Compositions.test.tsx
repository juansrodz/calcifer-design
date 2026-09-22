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
    const slugsHeading = await screen.findByRole('heading', { name: 'Slugs' });
    expect(slugsHeading).toBeVisible();
    // Both surfaces are on the page at once: the popover did not replace the dialog. Base UI
    // gives Popover's popup `role="dialog"` too (same as Dialog's), so a fresh `getByRole`
    // query is ambiguous once both are open — reusing the reference captured before the
    // popover existed proves it's the same element, still on screen, not a fresh match.
    expect(dialog).toBeVisible();
    // The page's actual claim is about paint order, not just coexistence: both popups share
    // `z-index: 50` (packages/ui/src/styles/popup.module.css), so whichever one is later in
    // document order paints on top. `compareDocumentPosition` is the DOM's own way to ask
    // that; `DOCUMENT_POSITION_FOLLOWING` set on the result means the popover's popup comes
    // after the dialog's in the document, which is what makes it paint above rather than
    // behind.
    const popoverPopup = slugsHeading.closest('[data-popup="popover"]');
    if (popoverPopup === null) {
      throw new Error(
        "Expected the 'Slugs' heading to sit inside the popover's own popup surface.",
      );
    }
    const dialogToPopoverPosition = dialog.compareDocumentPosition(popoverPopup);
    expect(dialogToPopoverPosition & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
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

  it('disables "Break the preview" while the fallback is showing, so a second press cannot arm another crash', async () => {
    const user = userEvent.setup();
    render(<Compositions />);
    const breakPreviewButton = screen.getByRole('button', { name: 'Break the preview' });
    await user.click(breakPreviewButton);
    expect(await screen.findByRole('heading', { name: 'This preview crashed' })).toBeVisible();
    expect(breakPreviewButton).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByTestId('preview')).toHaveTextContent('Nothing is wrong here');
    expect(breakPreviewButton).toBeEnabled();
  });

  it('has no axe violations with everything closed', async () => {
    const { container } = render(<Compositions />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
