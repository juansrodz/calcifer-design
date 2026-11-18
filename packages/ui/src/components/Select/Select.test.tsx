import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import fieldStyles from '../../styles/field.module.css';
import { Avatar } from '../Avatar/Avatar';
import { Select, type SelectProps } from './Select';
import styles from './Select.module.css';
import * as stories from './Select.stories';

const {
  Default,
  Chosen,
  Described,
  Required,
  WithError,
  Disabled,
  WithStartIcon,
  WithStartIconDark,
  WithStartIconLongValue,
  WithStartIconRightToLeft,
} = composeStories(stories);

const options = [
  { value: 'mains', label: 'Mains' },
  { value: 'sides', label: 'Sides' },
  { value: 'desserts', label: 'Desserts' },
];

describe('Select', () => {
  it.each([
    ['Default', Default],
    ['Chosen', Chosen],
    ['Described', Described],
    ['Required', Required],
    ['WithError', WithError],
    ['Disabled', Disabled],
    ['WithStartIcon', WithStartIcon],
    ['WithStartIconDark', WithStartIconDark],
    ['WithStartIconLongValue', WithStartIconLongValue],
    ['WithStartIconRightToLeft', WithStartIconRightToLeft],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('associates its label with the trigger even though the trigger is a button', () => {
    render(<Default />);
    expect(screen.getByLabelText('Category')).toHaveAttribute('role', 'combobox');
  });

  it('names the trigger from a plain span, never a native label pointing at a button', () => {
    render(<Default />);
    // Guards `nativeLabel={false} render={<span />}`: without them Base UI renders a
    // `<label for>`, which makes a click on the label open the select.
    expect(screen.getByText('Category').tagName).toBe('SPAN');
  });

  it('shows the placeholder until something is chosen, then the option label', () => {
    const { rerender } = render(<Default />);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Select…');
    rerender(<Chosen />);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Sides');
  });

  it('marks the trigger as a listbox owner and keeps the options out of the document until it opens', async () => {
    render(<Default />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(await screen.findByRole('option', { name: 'Mains' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('picks an option with the keyboard and reports its value', async () => {
    const onValueChange = vi.fn();
    render(
      <Select label="Category" name="category" options={options} onValueChange={onValueChange} />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const mains = await screen.findByRole('option', { name: 'Mains' });
    // The highlight lands a frame after the listbox mounts; pressing Enter before it does sends
    // the key back to the trigger, which closes the popup and selects nothing.
    await waitFor(() => expect(mains).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('sides'));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('reports the focus leaving the trigger, so a form library can mark the field touched', async () => {
    const onBlur = vi.fn();
    render(<Select label="Category" name="category" options={options} onBlur={onBlur} />);
    screen.getByRole('combobox', { name: 'Category' }).focus();
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('jumps to an option by typing its first letters', async () => {
    render(<Select label="Category" name="category" options={options} />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('option', { name: 'Mains' });
    await userEvent.keyboard('des');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Desserts' })).toHaveFocus());
  });

  it('moves the highlight to the first and the last option with Home and End', async () => {
    // The local options, all enabled: measured, Base UI's End highlights the last option even
    // when that option is disabled, so the story's `Drinks` would make "last" ambiguous. A
    // disabled option still cannot be chosen — the test below asserts that.
    render(<Select label="Category" name="category" options={options} />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Mains' })).toHaveFocus());
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Desserts' })).toHaveFocus());
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Mains' })).toHaveFocus());
  });

  it('closes on Escape and gives the focus back to the trigger', async () => {
    render(<Default />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('marks a disabled option in the accessibility tree and does not choose it', async () => {
    const onValueChange = vi.fn();
    render(
      <Select
        label="Category"
        name="category"
        options={[...options, { value: 'drinks', label: 'Drinks', disabled: true }]}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Category' }));
    const drinks = await screen.findByRole('option', { name: 'Drinks' });
    expect(drinks).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(drinks);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('marks the trigger required in the accessibility tree and draws the required mark', () => {
    const { container: requiredContainer } = render(<Required />);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveAttribute(
      'aria-required',
      'true',
    );
    const requiredMark = requiredContainer.querySelector(`.${fieldStyles.required}`);
    expect(requiredMark).toBeInTheDocument();
    expect(requiredMark).toHaveAttribute('aria-hidden', 'true');

    const { container: defaultContainer } = render(<Default />);
    expect(defaultContainer.querySelector(`.${fieldStyles.required}`)).not.toBeInTheDocument();
  });

  it('marks the trigger invalid and describes it with the error', () => {
    render(<WithError />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    // Base UI 1.8.0 puts both of these on the trigger from `Field.Root invalid`; what this
    // asserts is our own `error` → `invalid` plumbing, which is the only thing between the
    // `error` prop and the attribute. Setting `invalid={false}` on `Field.Root` fails it.
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('data-invalid');
    expect(trigger).toHaveAccessibleDescription('Choose a category.');
  });

  it('leaves aria-invalid off when there is no error', () => {
    render(<Described />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toHaveAccessibleDescription('Where the item shows up on the list.');
  });

  it('disables the trigger and keeps it out of the tab order', () => {
    render(<Disabled />);
    expect(screen.getByRole('combobox', { name: 'Category' })).toBeDisabled();
  });

  it('marks the popup so the shared Tier 2 skin can style it', async () => {
    render(<Default />);
    await userEvent.click(screen.getByRole('combobox', { name: 'Category' }));
    const listbox = await screen.findByRole('listbox');
    // The listbox is `Select.List`; the surface that wears the skin is its parent, `Select.Popup`.
    expect(listbox.parentElement).toHaveAttribute('data-popup', 'select');
  });

  describe('startIcon', () => {
    const avatar = <Avatar name="Ada Lovelace" size="xs" />;

    /** The "Category" select with the shared options, and its trigger. */
    function renderCategory(props: Partial<SelectProps> = {}): HTMLElement {
      render(<Select label="Category" name="category" options={options} {...props} />);
      return screen.getByRole('combobox', { name: 'Category' });
    }

    function comesBefore(first: Node, second: Node): boolean {
      return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
    }

    function triggerParts(trigger: HTMLElement) {
      const value = trigger.querySelector(`.${styles.value}`);
      const chevron = trigger.querySelector(`.${styles.icon}`);
      const slot = trigger.querySelector(`.${fieldStyles.affixIcon}`);
      if (!(value instanceof HTMLElement) || !(chevron instanceof HTMLElement)) {
        throw new Error('the trigger has lost its value or its chevron');
      }
      return { value, chevron, slot };
    }

    it('draws the start icon inside the trigger, before the value and the chevron', () => {
      render(<WithStartIcon />);
      const trigger = screen.getByRole('combobox', { name: 'Who is bringing' });
      const { value, chevron, slot } = triggerParts(trigger);
      if (slot === null) {
        throw new Error('no slot');
      }
      expect(slot).toContainElement(within(trigger).getByTestId('avatar'));
      expect(comesBefore(slot, value)).toBe(true);
      expect(comesBefore(value, chevron)).toBe(true);
      expect(value).toHaveTextContent('Sebastian');
    });

    it('hides the start icon from assistive technology, so it adds nothing to the trigger', () => {
      render(<WithStartIcon />);
      const trigger = screen.getByRole('combobox', { name: 'Who is bringing' });
      const { slot } = triggerParts(trigger);
      expect(slot).toHaveAttribute('aria-hidden', 'true');
    });

    it('lets the label still name the trigger, with nothing from the slot in its tree', () => {
      const trigger = renderCategory({
        defaultValue: 'sides',
        description: 'Where the item shows up on the list.',
        startIcon: avatar,
      });
      expect(trigger).toHaveAccessibleName('Category');
      expect(trigger).toHaveAccessibleDescription('Where the item shows up on the list.');
      expect(screen.getByLabelText('Category')).toBe(trigger);
      // The avatar's image role (and any role it gains later) stays out of the tree.
      expect(within(trigger).queryByRole('img')).toBeNull();
    });

    it('still shows the placeholder before the value is chosen', () => {
      const trigger = renderCategory({ startIcon: avatar });
      const { value, slot } = triggerParts(trigger);
      expect(slot).not.toBeNull();
      expect(value).toHaveAttribute('data-placeholder');
      expect(value).toHaveTextContent('Select…');
    });

    it.each([
      ['left out', undefined],
      ['null', null],
      ['false', false],
      ['an empty string', ''],
    ])('draws no slot when it is %s', (_name, startIcon) => {
      const trigger = renderCategory({ startIcon });
      const { value, slot } = triggerParts(trigger);
      expect(slot).toBeNull();
      expect(trigger.querySelector(`.${styles.lead}`)).toBeNull();
      // Without a slot the value is the trigger's own child, as it was before the prop existed.
      expect(value.parentElement).toBe(trigger);
    });

    it('keeps the disabled state on the trigger, with the slot still drawn', () => {
      const trigger = renderCategory({ startIcon: avatar, disabled: true });
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveAttribute('data-disabled');
      expect(triggerParts(trigger).slot).not.toBeNull();
    });

    it('keeps the invalid state and the error on the trigger, with the slot still drawn', () => {
      const trigger = renderCategory({ startIcon: avatar, error: 'Choose a category.' });
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      expect(trigger).toHaveAttribute('data-invalid');
      expect(trigger).toHaveAccessibleDescription('Choose a category.');
      expect(triggerParts(trigger).slot).not.toBeNull();
    });

    it('picks an option with the keyboard as it does without one', async () => {
      const onValueChange = vi.fn();
      const trigger = renderCategory({ startIcon: avatar, onValueChange });
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      const mains = await screen.findByRole('option', { name: 'Mains' });
      await waitFor(() => expect(mains).toHaveFocus());
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('sides'));
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
      expect(trigger).toHaveFocus();
    });

    it('opens from a press on the start icon, which is part of the trigger', async () => {
      render(<WithStartIcon />);
      const trigger = screen.getByRole('combobox', { name: 'Who is bringing' });
      await userEvent.click(within(trigger).getByTestId('avatar'));
      expect(await screen.findByRole('listbox')).toBeInTheDocument();
    });

    it('follows the chosen value in the story, as an app would', async () => {
      render(<WithStartIcon />);
      const trigger = screen.getByRole('combobox', { name: 'Who is bringing' });
      await userEvent.click(trigger);
      await userEvent.click(await screen.findByRole('option', { name: 'Christian' }));
      await waitFor(() => expect(triggerParts(trigger).value).toHaveTextContent('Christian'));
      expect(within(trigger).getByTestId('avatar')).toHaveTextContent('CH');
    });
  });
});
