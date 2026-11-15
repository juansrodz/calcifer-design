import { composeStories } from '@storybook/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fn } from 'storybook/test';
import { describe, expect, it, vi } from 'vitest';
import { tokens } from '@calcifer-design/tokens';
import { axe, axeDocument } from '../../../test/axe';
import a11yStyles from '../../styles/a11y.module.css';
import fieldStyles from '../../styles/field.module.css';
import styles from './SearchField.module.css';
import * as stories from './SearchField.stories';

const {
  Default,
  WithValue,
  HiddenLabel,
  Small,
  Disabled,
  Controlled,
  InDialog,
  CountsChanges,
  Dark,
} = composeStories(stories);

function searchbox(): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>('searchbox', { name: 'Search people' });
}

/** The pill: the element wearing the field skin, which holds the icon, the input and the clear. */
function pill(): HTMLElement {
  const box = searchbox().parentElement;
  if (box === null) throw new Error('the input has no pill around it');
  return box;
}

describe('SearchField', () => {
  it.each([
    ['Default', Default],
    ['WithValue', WithValue],
    ['HiddenLabel', HiddenLabel],
    ['Small', Small],
    ['Disabled', Disabled],
    ['Controlled', Controlled],
    ['CountsChanges', CountsChanges],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    const { container } = render(<Story />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('InDialog has no axe violations', async () => {
    render(<InDialog />);
    await screen.findByRole('dialog');
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a search landmark holding a searchbox named by its label', () => {
    render(<Default />);
    const landmark = screen.getByRole('search');
    expect(within(landmark).getByRole('searchbox', { name: 'Search people' })).toBe(searchbox());
    expect(searchbox()).toHaveAttribute('type', 'search');
  });

  it('reports each keystroke and submits the current value on Enter', async () => {
    const onValueChange = fn();
    const onSubmit = fn();
    render(<Default onValueChange={onValueChange} onSubmit={onSubmit} />);
    await userEvent.type(searchbox(), 'Ad');
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenNthCalledWith(1, 'A');
    expect(onValueChange).toHaveBeenNthCalledWith(2, 'Ad');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('Ad');
  });

  it('also submits an enclosing form, because Enter is left alone', async () => {
    const onSubmit = fn();
    const onFormSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={onFormSubmit}>
        <Default onSubmit={onSubmit} />
      </form>,
    );
    await userEvent.type(searchbox(), 'Ad{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('Ad');
    expect(onFormSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows a clear control only while there is a value', async () => {
    const { unmount } = render(<Default />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    await userEvent.type(searchbox(), 'A');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    unmount();
    render(<WithValue />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('clears from the control: both callbacks once, the input empty, the focus kept', async () => {
    const onValueChange = fn();
    const onSubmit = fn();
    render(<WithValue onValueChange={onValueChange} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('');
    expect(searchbox()).toHaveValue('');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(searchbox()).toHaveFocus();
  });

  it('clears on Escape with a value exactly as the control does', async () => {
    const onValueChange = fn();
    const onSubmit = fn();
    render(<WithValue onValueChange={onValueChange} onSubmit={onSubmit} />);
    searchbox().focus();
    await userEvent.keyboard('{Escape}');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('');
    expect(searchbox()).toHaveValue('');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(searchbox()).toHaveFocus();
  });

  it('does nothing on Escape in an empty field', async () => {
    const onValueChange = fn();
    const onSubmit = fn();
    render(<Default onValueChange={onValueChange} onSubmit={onSubmit} />);
    searchbox().focus();
    await userEvent.keyboard('{Escape}');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps an enclosing dialog open for the clearing Escape and lets the next one close it', async () => {
    const onValueChange = fn();
    render(<InDialog onValueChange={onValueChange} />);
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByRole<HTMLInputElement>('searchbox', {
      name: 'Search people',
    });
    expect(input).toHaveValue('Ada');
    input.focus();
    await userEvent.keyboard('{Escape}');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('');
    expect(input).toHaveValue('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  // An IME's committing Enter and its cancelling Escape belong to the composition, not to the
  // field: Chromium reports `isComposing`, and Safari fires `compositionend` before the committing
  // Enter, so only the legacy `keyCode` 229 gives that one away.
  describe('leaves the keys of an IME composition alone', () => {
    const compositionKeys = [
      ['isComposing', { isComposing: true }],
      ['keyCode 229', { keyCode: 229 }],
    ] as const;

    it.each(compositionKeys)('does not submit on Enter with %s', (_name, init) => {
      const onSubmit = fn();
      render(<Default onSubmit={onSubmit} defaultValue="Ad" />);
      fireEvent.keyDown(searchbox(), { key: 'Enter', ...init });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it.each(compositionKeys)('does not clear on Escape with %s', (_name, init) => {
      const onValueChange = fn();
      const onSubmit = fn();
      render(<WithValue onValueChange={onValueChange} onSubmit={onSubmit} />);
      // `fireEvent` returns false when the event was cancelled: the IME's own Escape must survive.
      expect(fireEvent.keyDown(searchbox(), { key: 'Escape', ...init })).toBe(true);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(searchbox()).toHaveValue('Ada');
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    });
  });

  it('counts one change for one Escape', async () => {
    render(<CountsChanges />);
    expect(screen.getByText('Changes: 0')).toBeInTheDocument();
    searchbox().focus();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText('Changes: 1')).toBeInTheDocument();
  });

  // The input is one line tall inside a taller pill, so a press on the glyph or above and below
  // the text would focus nothing without this.
  describe('focuses the input from a press anywhere on the pill', () => {
    it('on the glyph, so the caret lands in the input', async () => {
      render(<WithValue />);
      const glyph = pill().firstElementChild;
      if (glyph === null) throw new Error('the pill has no glyph');
      await userEvent.click(glyph);
      expect(searchbox()).toHaveFocus();
    });

    it('on the pill itself, cancelling the press so the focus is not taken back', () => {
      render(<Default />);
      expect(fireEvent.mouseDown(pill())).toBe(false);
      expect(searchbox()).toHaveFocus();
    });

    it('but never from the input or the clear control, whose presses are their own', () => {
      render(<WithValue />);
      expect(fireEvent.mouseDown(searchbox())).toBe(true);
      const clear = screen.getByRole('button', { name: 'Clear search' });
      expect(fireEvent.mouseDown(clear)).toBe(true);
      const clearGlyph = clear.querySelector('svg');
      if (clearGlyph === null) throw new Error('the clear control has no glyph');
      expect(fireEvent.mouseDown(clearGlyph)).toBe(true);
      expect(searchbox()).not.toHaveFocus();
    });
  });

  it('names the search landmark by the label, so two fields are two distinct landmarks', () => {
    render(
      <>
        <Default />
        <Default label="Search groups" />
      </>,
    );
    expect(screen.getAllByRole('search')).toHaveLength(2);
    expect(screen.getByRole('search', { name: 'Search people' })).toBeInTheDocument();
    expect(screen.getByRole('search', { name: 'Search groups' })).toBeInTheDocument();
  });

  it('points the landmark at a label id built from the input id', () => {
    render(<Default id="q" />);
    expect(screen.getByText('Search people')).toHaveAttribute('id', 'q-label');
    expect(screen.getByRole('search')).toHaveAttribute('aria-labelledby', 'q-label');
  });

  it('puts an id on the input and keeps the label naming it', () => {
    render(<Default id="q" />);
    // The landmark is labelled by the same label, so `getByLabelText` finds it too: ask for the input.
    const input = screen.getByLabelText('Search people', { selector: 'input' });
    expect(input).toBe(searchbox());
    expect(input).toHaveAttribute('id', 'q');
  });

  it('gives each field an id of its own when none is passed', () => {
    render(
      <>
        <Default />
        <Default label="Search groups" />
      </>,
    );
    const first = screen.getByLabelText('Search people', { selector: 'input' });
    const second = screen.getByLabelText('Search groups', { selector: 'input' });
    expect(first.id).not.toBe('');
    expect(first.id).not.toBe(second.id);
  });

  it('disables the input, dims the pill and draws no clear control', () => {
    render(<Disabled />);
    expect(searchbox()).toBeDisabled();
    expect(pill()).toHaveAttribute('data-disabled');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is controlled when given a value: the shown value is the prop, the change is still heard', async () => {
    const onValueChange = fn();
    render(<Controlled onValueChange={onValueChange} />);
    expect(searchbox()).toHaveValue('Ada');
    await userEvent.type(searchbox(), 'x');
    expect(onValueChange).toHaveBeenCalledWith('Adax');
    expect(searchbox()).toHaveValue('Ada');
  });

  it('renames the clear control from clearLabel', () => {
    render(<WithValue clearLabel="Clear" />);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('keeps the name when the label is hidden, and hides it from the eye alone', () => {
    render(<HiddenLabel />);
    expect(searchbox()).toBeInTheDocument();
    expect(screen.getByText('Search people')).toHaveClass(a11yStyles.visuallyHidden);
  });

  it('passes the placeholder and the other input attributes through', () => {
    render(<Default placeholder="Find a guest" autoComplete="off" />);
    expect(searchbox()).toHaveAttribute('placeholder', 'Find a guest');
    expect(searchbox()).toHaveAttribute('autocomplete', 'off');
  });

  it('writes its size on the landmark', () => {
    const { unmount } = render(<Default />);
    expect(screen.getByRole('search')).toHaveAttribute('data-size', 'md');
    unmount();
    render(<Small />);
    expect(screen.getByRole('search')).toHaveAttribute('data-size', 'sm');
  });

  // PF-8: the pill is as high with a clear control as without. jsdom has no layout, so the
  // structure that guarantees it is pinned here and the rules in token-reads.test.ts; Task 14
  // measures the heights in a browser.
  describe('the pill keeps its height when the clear control appears', () => {
    it('is one element before and after typing, wearing the affix skin and its own box class', async () => {
      render(<Default />);
      const box = pill();
      const input = searchbox();
      const classesBefore = box.className;
      expect(box).toHaveClass(fieldStyles.control, fieldStyles.affix, styles.box);
      await userEvent.type(input, 'A');
      expect(pill()).toBe(box);
      expect(searchbox()).toBe(input);
      expect(box.className).toBe(classesBefore);
      expect(box).toContainElement(screen.getByRole('button', { name: 'Clear search' }));
    });

    it('draws the clear control through the rule that sets its size, as a child of the pill', () => {
      render(<WithValue />);
      const clear = screen.getByRole('button', { name: 'Clear search' });
      expect(clear.parentElement).toBe(pill());
      expect(clear).toHaveClass(styles.clear);
      expect(clear).toHaveAttribute('data-size');
    });

    it('fits the clear circle and the pill borders inside the small pill', () => {
      // `.root .clear[data-size]` reads `--size-close`; `.root[data-size='sm'] .box` reads
      // `--size-control-sm`; `.control` draws a 1px border each side.
      const toPixels = (length: string) =>
        length.endsWith('rem') ? Number.parseFloat(length) * 16 : Number.parseFloat(length);
      const { close, controlSm, control } = tokens.shared.size;
      expect(toPixels(close) + 2).toBeLessThanOrEqual(toPixels(controlSm));
      expect(toPixels(close) + 2).toBeLessThanOrEqual(toPixels(control));
    });
  });
});
