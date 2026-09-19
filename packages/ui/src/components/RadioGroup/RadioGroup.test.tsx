import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import fieldStyles from '../../styles/field.module.css';
import { RadioGroup } from './RadioGroup';
import * as stories from './RadioGroup.stories';

const { Default, Horizontal, Described, Required, WithError, Disabled } = composeStories(stories);

const options = [
  { value: 'public', label: 'Anyone with the address' },
  { value: 'link', label: 'Anyone with the link' },
  { value: 'invited', label: 'Invited people only' },
];

describe('RadioGroup', () => {
  it.each([
    ['Default', Default],
    ['Horizontal', Horizontal],
    ['Described', Described],
    ['Required', Required],
    ['WithError', WithError],
    ['Disabled', Disabled],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('names the group, and names each radio after its own option', () => {
    render(<Default />);
    expect(screen.getByRole('radiogroup', { name: 'Who can see this event' })).toBeInTheDocument();
    // Exactly one each. The composition this replaces named every radio after the group, so
    // all four answered to the first option's name and this length was 4.
    expect(screen.getAllByRole('radio', { name: 'Anyone with the address' })).toHaveLength(1);
    expect(screen.getAllByRole('radio', { name: 'Invited people only' })).toHaveLength(1);
  });

  it('moves the selection with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        label="Who can see this event"
        name="visibility"
        options={options}
        defaultValue="link"
        onValueChange={onValueChange}
      />,
    );
    const chosen = screen.getByRole('radio', { name: 'Anyone with the link' });
    chosen.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Invited people only' })).toBeChecked(),
    );
    expect(onValueChange).toHaveBeenLastCalledWith('invited');
  });

  it('selects by clicking the option text, because each option is its own label', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        label="Who can see this event"
        name="visibility"
        options={options}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByText('Invited people only'));
    expect(onValueChange).toHaveBeenCalledWith('invited');
  });

  it('puts one tab stop on the group, not one per radio', async () => {
    render(<Default />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Anyone with the link' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Anyone with the address' })).not.toHaveFocus();
  });

  it('marks itself required in the accessibility tree and draws the required mark', () => {
    const { container: requiredContainer } = render(<Required />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    const requiredMark = requiredContainer.querySelector(`.${fieldStyles.required}`);
    expect(requiredMark).toBeInTheDocument();
    expect(requiredMark).toHaveAttribute('aria-hidden', 'true');

    const { container: defaultContainer } = render(<Default />);
    expect(defaultContainer.querySelector(`.${fieldStyles.required}`)).not.toBeInTheDocument();
  });

  it('marks the group name disabled, so the skin dims it with every other label', () => {
    const { container } = render(<Disabled />);
    // The name is a hand-rolled span, not a Base UI part, so nothing else would write this.
    expect(container.querySelector(`.${fieldStyles.legend}`)).toHaveAttribute('data-disabled');
  });

  it('marks a disabled option and does not select it', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        label="Who can see this event"
        name="visibility"
        options={[...options, { value: 'archived', label: 'Nobody — archived', disabled: true }]}
        onValueChange={onValueChange}
      />,
    );
    const archived = screen.getByRole('radio', { name: 'Nobody — archived' });
    // Base UI renders `<span role="radio">`, not a native `<input>`, so jest-dom's
    // `toBeDisabled` — which only recognises natively disable-able elements — cannot assert
    // this. `Checkbox.test.tsx` hits the same shape and asserts the same two attributes.
    expect(archived).toHaveAttribute('aria-disabled', 'true');
    expect(archived).toHaveAttribute('data-disabled');
    await userEvent.click(archived);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('describes the group with its description, and with the error when there is one', () => {
    const { rerender } = render(<Described />);
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(
      'You can change this at any time from the event page.',
    );
    rerender(<WithError />);
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(
      'Choose who can see the event.',
    );
  });

  it('renders no error node when no error is given', () => {
    render(<Described />);
    expect(screen.queryByText('Choose who can see the event.')).not.toBeInTheDocument();
  });

  it('lays the options out along the axis it is told to', () => {
    render(<Horizontal />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-orientation', 'horizontal');
  });
});
