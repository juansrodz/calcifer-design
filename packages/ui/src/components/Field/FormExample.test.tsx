import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fn } from 'storybook/test';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import * as stories from './FormExample.stories';

const { Default } = composeStories(stories);

describe('a whole Tier 3 form', () => {
  it('has no axe violations', async () => {
    render(<Default />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('puts every Tier 3 component on one form', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Portion size' })).toBeInTheDocument();
    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
    expect(screen.getByRole('checkbox', { name: 'I am bringing a dish' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Email me when someone joins' })).toBeInTheDocument();
  });

  it('shows nothing as invalid before the field has been touched', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Enter an email address.')).not.toBeInTheDocument();
  });

  it('surfaces the adapter error on the field once the form is submitted', async () => {
    const onSubmitValues = fn();
    render(<Default onSubmitValues={onSubmitValues} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const email = screen.getByLabelText('Email');
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    expect(email).toHaveAccessibleDescription('Enter an email address.');
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(onSubmitValues).not.toHaveBeenCalled();
    // The state most likely to break: two describers, `aria-invalid` on a `Field` and a
    // `Select` at once, and a required mark on both. Axe'd in composition, not per component.
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('clears the error as the value becomes valid, with no work from the caller', async () => {
    render(<Default />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const email = screen.getByLabelText('Email');
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    await userEvent.type(email, 'sebastian@example.com');
    await waitFor(() => expect(email).not.toHaveAttribute('aria-invalid'));
  });

  it('collects every control into one value object when the form validates', async () => {
    const onSubmitValues = fn();
    render(<Default onSubmitValues={onSubmitValues} />);
    await userEvent.type(screen.getByLabelText('Email'), 'sebastian@example.com');
    await userEvent.click(screen.getByRole('combobox', { name: 'Category' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Sides' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Large' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'I am bringing a dish' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Email me when someone joins' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onSubmitValues).toHaveBeenCalledWith({
        email: 'sebastian@example.com',
        category: 'sides',
        portion: 'large',
        notes: '',
        bringing: true,
        notify: false,
      }),
    );
  });
});
