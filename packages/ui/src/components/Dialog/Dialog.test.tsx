import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import a11yStyles from '../../styles/a11y.module.css';
import * as stories from './Dialog.stories';

const {
  Default,
  OpenOnLoad,
  Sheet,
  SideSheet,
  Persistent,
  HeaderSlots,
  HiddenHeading,
  SheetWithFooter,
  SideSheetWithFooter,
  HiddenClose,
  HeadingHooks,
} = composeStories(stories);

describe('Dialog', () => {
  it.each([
    ['Default', Default],
    ['OpenOnLoad', OpenOnLoad],
    ['Sheet', Sheet],
    ['SideSheet', SideSheet],
    ['Persistent', Persistent],
    ['HeaderSlots', HeaderSlots],
    ['HiddenHeading', HiddenHeading],
    ['SheetWithFooter', SheetWithFooter],
    ['SideSheetWithFooter', SideSheetWithFooter],
    ['HeadingHooks', HeadingHooks],
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

  // The scrim carries the same two attributes as the viewport so `popup.module.css` can give the
  // bottom sheet's backdrop its own colour. The backdrop is found by its class: the viewport also
  // carries `data-variant` and `data-side`, so an attribute query would match both. The tests'
  // `classNameStrategy: 'non-scoped'` keeps `popupStyles.scrim` as `scrim`.
  it('marks the bottom sheet’s scrim with the variant and the side', async () => {
    render(<Sheet />);
    await screen.findByRole('dialog');
    const scrim = document.querySelector('.scrim');
    expect(scrim).not.toBeNull();
    expect(scrim).toHaveAttribute('data-variant', 'sheet');
    expect(scrim).toHaveAttribute('data-side', 'bottom');
  });

  it('marks the end drawer’s scrim with the end side', async () => {
    render(<SideSheet />);
    await screen.findByRole('dialog');
    const scrim = document.querySelector('.scrim');
    expect(scrim).toHaveAttribute('data-variant', 'sheet');
    expect(scrim).toHaveAttribute('data-side', 'end');
  });

  it('marks the centred dialog’s scrim with the variant and no side', async () => {
    render(<OpenOnLoad />);
    await screen.findByRole('dialog');
    const scrim = document.querySelector('.scrim');
    expect(scrim).not.toBeNull();
    expect(scrim).toHaveAttribute('data-variant', 'center');
    expect(scrim).not.toHaveAttribute('data-side');
  });

  it('has no axe violations when the hidden-close sheet is open', async () => {
    render(<HiddenClose />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove remote' }));
    await screen.findByRole('dialog');
    expect(await axeDocument()).toHaveNoViolations();
  });

  describe('the close control', () => {
    // L2-21 / O-33: the close is drawn at the `--size-close` circle through Dialog's own class, so
    // it is `sm` in both variants, never `md`, and its 44 px hit area is the stylesheet's.
    it('is a ghost control carrying the close class by default', async () => {
      render(<OpenOnLoad />);
      const close = within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Close',
      });
      expect(close).toHaveAttribute('data-variant', 'ghost');
      expect(close).toHaveAttribute('data-size', 'sm');
      expect(close).toHaveClass('close');
    });

    it('is soft and still the close circle with closeVariant="soft"', async () => {
      render(<HeaderSlots />);
      const close = within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Close',
      });
      expect(close).toHaveAttribute('data-variant', 'soft');
      expect(close).toHaveAttribute('data-size', 'sm');
      expect(close).toHaveClass('close');
    });
  });

  describe('the header slots', () => {
    it('lays out the start slot, the heading, then the end group holding the controls and the close', async () => {
      render(<HeaderSlots />);
      const popup = await screen.findByRole('dialog');
      const heading = within(popup).getByRole('heading', { name: 'Pasta night' });
      const header = heading.parentElement as HTMLElement;
      const [start, title, end] = Array.from(header.children);
      expect(start).toHaveTextContent('Draft');
      expect(title).toBe(heading);
      expect(end).toHaveClass('headerEnd');
      expect(header.children).toHaveLength(3);
      const [more, close] = Array.from((end as HTMLElement).children);
      expect(more).toBe(within(popup).getByRole('button', { name: 'More' }));
      expect(close).toBe(within(popup).getByRole('button', { name: 'Close' }));
    });

    // Review Focus 5: a slot button must never take the opening focus.
    it('opens with focus on Close, not on the end slot’s button, and Escape returns it to the trigger', async () => {
      render(<HeaderSlots defaultOpen={false} />);
      const trigger = screen.getByRole('button', { name: 'Remove remote' });
      await userEvent.click(trigger);
      const popup = await screen.findByRole('dialog');
      await waitFor(() =>
        expect(within(popup).getByRole('button', { name: 'Close' })).toHaveFocus(),
      );
      expect(within(popup).getByRole('button', { name: 'More' })).not.toHaveFocus();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    });

    it('keeps the end slot and draws no close with closeHidden', async () => {
      render(<HeaderSlots closeHidden />);
      const popup = await screen.findByRole('dialog');
      expect(within(popup).getByRole('button', { name: 'More' })).toBeInTheDocument();
      expect(within(popup).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });

    it('gives a plain dialog a header of the heading and an end group holding only the close', async () => {
      render(<OpenOnLoad />);
      const popup = await screen.findByRole('dialog');
      const heading = within(popup).getByRole('heading');
      const header = heading.parentElement as HTMLElement;
      const [first, end] = Array.from(header.children);
      expect(header.children).toHaveLength(2);
      expect(first).toBe(heading);
      expect(Array.from((end as HTMLElement).children)).toEqual([
        within(popup).getByRole('button', { name: 'Close' }),
      ]);
    });

    it('draws no end group at all with closeHidden and no end slot', async () => {
      render(<OpenOnLoad closeHidden />);
      const heading = await screen.findByRole('heading');
      expect(heading.parentElement?.children).toHaveLength(1);
    });
  });

  describe('the hidden heading', () => {
    it('stays the dialog’s name while carrying the visually-hidden class', async () => {
      render(<HiddenHeading />);
      const popup = await screen.findByRole('dialog', { name: 'Remove the showcase remote?' });
      const heading = within(popup).getByRole('heading', { name: 'Remove the showcase remote?' });
      expect(heading).toHaveClass(a11yStyles.visuallyHidden);
    });

    it('does not hide the heading unless asked', async () => {
      render(<OpenOnLoad />);
      const heading = await screen.findByRole('heading', { name: 'Remove the showcase remote?' });
      expect(heading).not.toHaveClass(a11yStyles.visuallyHidden);
    });
  });

  describe('the touch rule for the opening focus', () => {
    it('focuses the popup itself, not Close, when a sheet is opened by touch', async () => {
      render(<Sheet defaultOpen={false} />);
      const trigger = screen.getByRole('button', { name: 'Remove remote' });
      await userEvent.pointer({ keys: '[TouchA]', target: trigger });
      const popup = await screen.findByRole('dialog');
      await waitFor(() => expect(popup).toHaveFocus());
      expect(within(popup).getByRole('button', { name: 'Close' })).not.toHaveFocus();
    });
  });

  describe('the grab handle', () => {
    it.each([
      ['Sheet', Sheet],
      ['SheetWithFooter', SheetWithFooter],
    ])('is the first child of the bottom sheet in %s', async (_name, Story) => {
      render(<Story />);
      const popup = await screen.findByRole('dialog');
      const handle = popup.firstElementChild;
      expect(handle).toHaveAttribute('aria-hidden', 'true');
      expect(handle).toHaveClass('handle');
    });

    it.each([
      ['SideSheet', SideSheet],
      ['SideSheetWithFooter', SideSheetWithFooter],
      ['OpenOnLoad', OpenOnLoad],
    ])('is absent from %s', async (_name, Story) => {
      render(<Story />);
      const popup = await screen.findByRole('dialog');
      expect(popup.querySelector('.handle')).toBeNull();
      expect(popup.firstElementChild).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('the sheet footer', () => {
    it.each([
      ['SheetWithFooter', SheetWithFooter],
      ['SideSheetWithFooter', SideSheetWithFooter],
    ])('keeps the footer after the scrolling body in %s', async (_name, Story) => {
      render(<Story />);
      const popup = await screen.findByRole('dialog');
      const footer = within(popup).getByRole('button', { name: 'Register the remote' })
        .parentElement as HTMLElement;
      expect(footer).toHaveClass('footer');
      expect(footer.previousElementSibling).toHaveClass('body');
      expect(footer.nextElementSibling).toBeNull();
    });
  });

  describe('without a header close', () => {
    async function openByKeyboard() {
      render(<HiddenClose />);
      const trigger = screen.getByRole('button', { name: 'Remove remote' });
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      const popup = await screen.findByRole('dialog', { name: 'Rename the remote' });
      return { trigger, popup };
    }

    it('draws no Close and opens with focus on the text field', async () => {
      const { popup } = await openByKeyboard();
      expect(within(popup).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
      await waitFor(() =>
        expect(within(popup).getByRole('textbox', { name: 'Name' })).toHaveFocus(),
      );
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const { trigger } = await openByKeyboard();
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    });

    it('closes from the footer’s Cancel', async () => {
      const { popup } = await openByKeyboard();
      await userEvent.click(within(popup).getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });

  describe('the heading hooks', () => {
    it('are set by the story stylesheet on the sheet popup', async () => {
      render(<HeadingHooks />);
      await screen.findByRole('dialog');
      const css = Array.from(document.querySelectorAll('style'))
        .map((sheet) => sheet.textContent)
        .join('\n');
      for (const hook of [
        '--dialog-heading-size',
        '--dialog-heading-tracking',
        '--dialog-heading-leading',
        '--sheet-handle-width',
        '--sheet-handle-height',
      ]) {
        expect(css).toContain(hook);
      }
    });
  });
});
