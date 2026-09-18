import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Button } from '../Button/Button';
import { Menu } from './Menu';
import * as stories from './Menu.stories';

const { Default, AlignedToTheStart, OpenOnLoad } = composeStories(stories);

describe('Menu', () => {
  it.each([
    ['Default', Default],
    ['AlignedToTheStart', AlignedToTheStart],
    ['OpenOnLoad', OpenOnLoad],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('marks the trigger as a menu owner and keeps the items out of the document until it opens', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Remote actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(await screen.findByRole('menuitem', { name: 'Reload manifest' })).toBeInTheDocument();
  });

  it('selects the highlighted item with Enter and closes', async () => {
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={<Button variant="secondary">Remote actions</Button>}
        items={[{ id: 'reload', label: 'Reload manifest', onSelect }]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Remote actions' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const reload = await screen.findByRole('menuitem', { name: 'Reload manifest' });
    // The highlight lands a frame after the popup mounts. Pressing Enter before it does sends
    // the key to the trigger, which closes the menu and selects nothing — measured, and the
    // reason this wait is here rather than a bare assertion.
    await waitFor(() => expect(reload).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('selects an item with the pointer', async () => {
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={<Button variant="secondary">Remote actions</Button>}
        items={[{ id: 'reload', label: 'Reload manifest', onSelect }]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remote actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Reload manifest' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape and returns focus to the trigger, selecting nothing', async () => {
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={<Button variant="secondary">Remote actions</Button>}
        items={[{ id: 'reload', label: 'Reload manifest', onSelect }]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Remote actions' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('menuitem', { name: 'Reload manifest' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('marks a disabled item in the accessibility tree and does not fire it', async () => {
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={<Button variant="secondary">Remote actions</Button>}
        items={[{ id: 'pin', label: 'Pin version', onSelect, disabled: true }]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remote actions' }));
    const pin = await screen.findByRole('menuitem', { name: 'Pin version' });
    expect(pin).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(pin);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('draws a separator above an item that asks for one, and nowhere else', async () => {
    render(<OpenOnLoad />);
    await screen.findByRole('menuitem', { name: 'Reload manifest' });
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('marks the popup so the shared skin can style it', async () => {
    render(<OpenOnLoad />);
    expect(await screen.findByRole('menu')).toHaveAttribute('data-popup', 'menu');
  });
});
