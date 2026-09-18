import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import * as stories from './Dialog.stories';

const { Default, OpenOnLoad, Sheet, SideSheet, Persistent } = composeStories(stories);

describe('Dialog', () => {
  it.each([
    ['Default', Default],
    ['OpenOnLoad', OpenOnLoad],
    ['Sheet', Sheet],
    ['SideSheet', SideSheet],
    ['Persistent', Persistent],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('stays closed until the trigger is pressed, then names and describes itself', async () => {
    render(<Default />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove remote' }));
    const popup = await screen.findByRole('dialog', { name: 'Remove the showcase remote?' });
    expect(popup).toHaveAccessibleDescription(
      'It disappears from the registry; the deployment itself is untouched.',
    );
  });

  it('moves focus to the close control, so the first Tab lands inside the dialog', async () => {
    render(<Default />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove remote' }));
    const popup = await screen.findByRole('dialog');
    // Base UI focuses a frame after the popup mounts; `findByRole` returns before that.
    await waitFor(() => expect(within(popup).getByRole('button', { name: 'Close' })).toHaveFocus());
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Remove remote' });
    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('closes from the header control', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog');
    await userEvent.click(within(popup).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes on a press outside it', async () => {
    render(<OpenOnLoad />);
    await screen.findByRole('dialog');
    await userEvent.click(document.body);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps a persistent dialog open on a press outside it', async () => {
    render(<Persistent />);
    await screen.findByRole('dialog');
    await userEvent.click(document.body);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the heading as an h2 by default, and at the level asked for', async () => {
    const { unmount } = render(<OpenOnLoad />);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Remove the showcase remote?' }),
    ).toBeInTheDocument();
    unmount();
    render(<OpenOnLoad headingLevel={3} />);
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Remove the showcase remote?' }),
    ).toBeInTheDocument();
  });

  it('renders the footer inside the dialog', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog');
    expect(within(popup).getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('marks the sheet variant on both the popup and the viewport that docks it', async () => {
    render(<Sheet />);
    const popup = await screen.findByRole('dialog');
    expect(popup).toHaveAttribute('data-popup', 'sheet');
    expect(popup).toHaveAttribute('data-side', 'bottom');
    expect(popup.parentElement).toHaveAttribute('data-variant', 'sheet');
    expect(popup.parentElement).toHaveAttribute('data-side', 'bottom');
  });

  it('docks a side sheet to the end edge, on both the popup and the viewport', async () => {
    render(<SideSheet />);
    const popup = await screen.findByRole('dialog');
    expect(popup).toHaveAttribute('data-popup', 'sheet');
    expect(popup).toHaveAttribute('data-side', 'end');
    expect(popup.parentElement).toHaveAttribute('data-side', 'end');
  });

  it('marks the centred variant too, so the two never share a rule by accident', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog');
    expect(popup).toHaveAttribute('data-popup', 'dialog');
    expect(popup).not.toHaveAttribute('data-side');
    expect(popup.parentElement).not.toHaveAttribute('data-side');
  });
});
