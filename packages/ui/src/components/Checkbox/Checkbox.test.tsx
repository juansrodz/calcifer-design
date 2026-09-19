import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import fieldStyles from '../../styles/field.module.css';
import { Checkbox } from './Checkbox';
import * as stories from './Checkbox.stories';

const { Default, Checked, Indeterminate, Described, Required, WithError, Disabled } =
  composeStories(stories);

describe('Checkbox', () => {
  it.each([
    ['Default', Default],
    ['Checked', Checked],
    ['Indeterminate', Indeterminate],
    ['Described', Described],
    ['Required', Required],
    ['WithError', WithError],
    ['Disabled', Disabled],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is named by its label, on the same row', () => {
    render(<Default />);
    expect(screen.getByRole('checkbox', { name: 'Bring a dish' })).toBeInTheDocument();
  });

  it('reports a mixed state as mixed, not as unchecked', () => {
    render(<Indeterminate />);
    expect(screen.getByRole('checkbox', { name: 'Select all items' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  });

  it('ticks with the space key and reports the new state', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Bring a dish" name="bringing" onCheckedChange={onCheckedChange} />);
    const checkboxElement = screen.getByRole('checkbox', { name: 'Bring a dish' });
    checkboxElement.focus();
    await userEvent.keyboard(' ');
    expect(checkboxElement).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('ticks by clicking the label text, because the whole row is the label', async () => {
    render(<Default />);
    await userEvent.click(screen.getByText('Bring a dish'));
    expect(screen.getByRole('checkbox', { name: 'Bring a dish' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('marks itself required in the accessibility tree', () => {
    render(<Required />);
    expect(screen.getByRole('checkbox', { name: 'Accept the house rules' })).toHaveAttribute(
      'aria-required',
      'true',
    );
  });

  it('shows the required mark when required', () => {
    const { container: requiredContainer } = render(<Required />);
    const requiredMark = requiredContainer.querySelector(`.${fieldStyles.required}`);
    expect(requiredMark).toBeInTheDocument();
    expect(requiredMark).toHaveAttribute('aria-hidden', 'true');

    const { container: defaultContainer } = render(<Default />);
    expect(defaultContainer.querySelector(`.${fieldStyles.required}`)).not.toBeInTheDocument();
  });

  it('marks itself invalid and is described by the error', () => {
    render(<WithError />);
    const checkboxElement = screen.getByRole('checkbox', { name: 'Accept the house rules' });
    expect(checkboxElement).toHaveAttribute('aria-invalid', 'true');
    expect(checkboxElement).toHaveAccessibleDescription('You must accept to join.');
    expect(checkboxElement).toHaveAttribute('data-invalid');
  });

  it('renders no error node and marks nothing invalid when no error is given', () => {
    render(<Described />);
    const checkboxElement = screen.getByRole('checkbox', { name: 'Bring a dish' });
    expect(checkboxElement).not.toHaveAttribute('aria-invalid');
    expect(checkboxElement).toHaveAccessibleDescription(
      'We will list you next to the dish on the event page.',
    );
    expect(screen.queryByText('You must accept to join.')).not.toBeInTheDocument();
  });

  it('refuses the keyboard and the pointer when disabled', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox label="Bring a dish" name="bringing" disabled onCheckedChange={onCheckedChange} />,
    );
    const checkboxElement = screen.getByRole('checkbox', { name: 'Bring a dish' });
    expect(checkboxElement).toHaveAttribute('data-disabled');
    await userEvent.click(checkboxElement);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
