import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { ToastRegion, createToastManager } from './ToastRegion';
import * as stories from './ToastRegion.stories';

const { Default, Danger } = composeStories(stories);

describe('ToastRegion', () => {
  it.each([
    ['Default', Default],
    ['Danger', Danger],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('renders exactly one notifications landmark, which is the whole reason it ships as one component', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Remote removed' });
    await screen.findByText('Remote removed');
    expect(screen.getAllByRole('region', { name: 'Notifications' })).toHaveLength(1);
  });

  it('names the toast with its title and describes it with its description', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Remote removed', description: 'showcase is no longer registered.' });
    const region = await screen.findByRole('region', { name: 'Notifications' });
    const toast = within(region).getByRole('dialog');
    expect(toast).toHaveAccessibleName('Remote removed');
    expect(toast).toHaveAccessibleDescription('showcase is no longer registered.');
    // Passes rather than flagging the close control's `aria-hidden` focusable button: axe's
    // `aria-hidden-focus` rule short-circuits while an open `[role=dialog]` is in the document,
    // and a mounted toast is one.
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('carries the tone as a data attribute, for the rail colour', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Saved', tone: 'success' });
    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(within(region).getByRole('dialog')).toHaveAttribute('data-type', 'success');
  });

  it('runs the action and keeps its own label', async () => {
    const manager = createToastManager();
    const onClick = vi.fn();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Remote removed', action: { label: 'Undo', onClick } });
    const region = await screen.findByRole('region', { name: 'Notifications' });
    await userEvent.click(within(region).getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('closes from the close control, which is reachable by its label while the stack is collapsed', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Saved' });
    const region = await screen.findByRole('region', { name: 'Notifications' });
    // `getByRole('button', { name: 'Close' })` cannot find this one: Base UI marks it
    // `aria-hidden` while the stack is collapsed and unfocused, which takes it out of the
    // accessibility tree without taking it out of the tab order. Measured, and deliberate on
    // their side — it comes back when the viewport is hovered or focused.
    const closeControl = within(region).getByLabelText('Close');
    expect(closeControl).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(closeControl);
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument());
  });

  it('closes from the manager', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    const identifier = manager.add({ title: 'Saved' });
    await screen.findByText('Saved');
    manager.close(identifier);
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument());
  });

  it('updates a toast in place rather than stacking a second one', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    const identifier = manager.add({ title: 'Uploading', timeout: 0 });
    expect(await screen.findByText('Uploading')).toBeInTheDocument();
    manager.update(identifier, { title: 'Uploaded' });
    expect(await screen.findByText('Uploaded')).toBeInTheDocument();
    expect(screen.queryByText('Uploading')).not.toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });

  it('drops a toast raised while no region is mounted, and still returns an id', () => {
    const manager = createToastManager();
    const identifier = manager.add({ title: 'Nobody is listening' });
    expect(typeof identifier).toBe('string');
    expect(identifier.length).toBeGreaterThan(0);
    expect(screen.queryByText('Nobody is listening')).not.toBeInTheDocument();
  });
});
