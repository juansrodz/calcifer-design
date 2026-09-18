import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import * as stories from './Popover.stories';

const { Default, Above, AlignedToTheStart, Modal, OpenOnLoad } = composeStories(stories);

describe('Popover', () => {
  it.each([
    ['Default', Default],
    ['Above', Above],
    ['AlignedToTheStart', AlignedToTheStart],
    ['Modal', Modal],
    ['OpenOnLoad', OpenOnLoad],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('keeps the popup out of the document until the trigger is pressed', async () => {
    render(<Default />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remote details' }));
    expect(await screen.findByRole('dialog', { name: 'Showcase remote' })).toBeInTheDocument();
  });

  it('names the popup with the heading and describes it with the description', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog', { name: 'Showcase remote' });
    expect(popup).toHaveAccessibleDescription(
      'Loaded from the registry entry at /projects/showcase.',
    );
  });

  it('renders the heading at the requested level', async () => {
    render(<OpenOnLoad headingLevel={2} />);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Showcase remote' }),
    ).toBeInTheDocument();
  });

  it('marks the trigger as the popup owner, so the state is in the accessibility tree', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Remote details' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves focus into the popup when it opens and back to the trigger when it closes', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Remote details' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const popup = await screen.findByRole('dialog');
    // `waitFor`, not a bare expect: Base UI moves focus a frame after the popup mounts, and
    // `findByRole` resolves as soon as the node exists. Measured — the same assertion without
    // this wrapper passes or fails depending on what ran earlier in the file.
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('renders no close control when it is not modal, so the popup holds only its own content', async () => {
    render(<OpenOnLoad />);
    await screen.findByRole('dialog');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('renders a visually-hidden close control when modal', async () => {
    render(<Modal defaultOpen />);
    const popup = await screen.findByRole('dialog');
    const close = screen.getByRole('button', { name: 'Close' });
    expect(popup).toContainElement(close);
    expect(close).toHaveClass('visuallyHidden');
    expect(await axeDocument()).toHaveNoViolations();
    expect(document.querySelector('.scrim')).not.toBeNull();
  });

  it('renders no scrim when modal is "trap-focus"', async () => {
    render(<Default modal="trap-focus" defaultOpen />);
    await screen.findByRole('dialog');
    expect(document.querySelector('.scrim')).toBeNull();
  });

  it('closes from that control', async () => {
    render(<Modal defaultOpen />);
    await screen.findByRole('dialog');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('reports every open and close through onOpenChange', async () => {
    const onOpenChange = vi.fn();
    render(<Default onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remote details' }));
    await screen.findByRole('dialog');
    expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything()));
  });

  it('marks the popup so the shared skin can style it', async () => {
    render(<OpenOnLoad />);
    expect(await screen.findByRole('dialog')).toHaveAttribute('data-popup', 'popover');
  });
});
