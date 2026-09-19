import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { TextInput } from '../TextInput/TextInput';
import { Field } from './Field';
import * as stories from './Field.stories';

// `Dark` is deliberately not composed: the preview decorator writes
// `document.documentElement.dataset.theme` and the mutation outlives the test that caused it.
const { Default, Described, Required, WithError, Disabled, RenderedTextarea } =
  composeStories(stories);

describe('Field', () => {
  it.each([
    ['Default', Default],
    ['Described', Described],
    ['Required', Required],
    ['WithError', WithError],
    ['Disabled', Disabled],
    ['RenderedTextarea', RenderedTextarea],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('associates the label with the control, so a caller can find it by its label', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('describes the control with the description', () => {
    render(<Described />);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'We only use it to sign you in.',
    );
  });

  it('renders no error node and marks nothing invalid when no error is given', () => {
    render(<Described />);
    const control = screen.getByLabelText('Email');
    expect(control).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Enter an email address.')).not.toBeInTheDocument();
  });

  it('marks the control invalid and describes it with the error and the description together', () => {
    render(<WithError />);
    const control = screen.getByLabelText('Email');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    // Base UI joins every registered describer into one `aria-describedby`, in DOM order.
    expect(control).toHaveAccessibleDescription(
      'We only use it to sign you in. Enter an email address.',
    );
  });

  it('marks the control required without putting an asterisk in its accessible name', () => {
    render(<Required />);
    const control = screen.getByLabelText('Email');
    expect(control).toBeRequired();
    expect(control).toHaveAccessibleName('Email');
  });

  it('disables the control and says so on the frame, so the skin can dim it', () => {
    render(<Disabled />);
    const control = screen.getByLabelText('Email');
    expect(control).toBeDisabled();
    expect(control).toHaveAttribute('data-disabled');
  });

  it('wires a caller-rendered element exactly as it wires its own input', () => {
    render(<RenderedTextarea />);
    const control = screen.getByLabelText('Notes');
    expect(control.tagName).toBe('TEXTAREA');
    expect(control).toHaveClass('control');
    expect(control).toHaveAccessibleDescription('Anything the host should know.');
  });

  it('takes a name for form submission', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
  });

  it('reaches the control with the keyboard and refuses a disabled one', async () => {
    render(
      <>
        <Field label="Email" name="email">
          <TextInput type="email" />
        </Field>
        <Field label="Locked" name="locked" disabled>
          <TextInput />
        </Field>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    // A disabled control is not in the tab order at all, so the next tab leaves the form.
    await userEvent.tab();
    expect(screen.getByLabelText('Locked')).not.toHaveFocus();
  });
});
