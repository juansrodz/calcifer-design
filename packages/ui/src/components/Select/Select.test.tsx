import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import fieldStyles from '../../styles/field.module.css';
import { Select } from './Select';
import * as stories from './Select.stories';

const { Default, Chosen, Described, Required, WithError, Disabled } = composeStories(stories);

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
});
