import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Field } from '../Field/Field';
import { TextInput } from './TextInput';
import * as stories from './TextInput.stories';

const { Default, Email, Password, Date: DateInput, ReadOnly } = composeStories(stories);

describe('TextInput', () => {
  it.each([
    ['Default', Default],
    ['Email', Email],
    ['Password', Password],
    ['Date', DateInput],
    ['ReadOnly', ReadOnly],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('wears the shared control skin', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).toHaveClass('control');
  });

  it('reports every keystroke as the new value', async () => {
    const onValueChange = vi.fn();
    render(
      <Field label="Email" name="email">
        <TextInput value="" onValueChange={onValueChange} />
      </Field>,
    );
    await userEvent.type(screen.getByLabelText('Email'), 'ab');
    expect(onValueChange.mock.calls.map((call) => call[0])).toEqual(['a', 'b']);
  });

  it('takes its required state from the field, not from a prop of its own', () => {
    render(
      <Field label="Email" name="email" required>
        <TextInput />
      </Field>,
    );
    expect(screen.getByLabelText('Email')).toBeRequired();
  });

  it('is not required outside a field, where there is no frame to ask', () => {
    render(<TextInput aria-label="Loose" />);
    expect(screen.getByLabelText('Loose')).not.toBeRequired();
  });

  it('accepts typing and reports the typed value when uncontrolled', async () => {
    render(
      <Field label="Email" name="email">
        <TextInput defaultValue="" />
      </Field>,
    );
    const control = screen.getByLabelText('Email');
    await userEvent.type(control, 'hello');
    expect(control).toHaveValue('hello');
  });

  it('does not apply its own type when the caller renders a different element', () => {
    render(
      <Field label="Notes" name="notes">
        <TextInput render={<textarea />} />
      </Field>,
    );
    expect(screen.getByLabelText('Notes')).not.toHaveAttribute('type');
  });
});
