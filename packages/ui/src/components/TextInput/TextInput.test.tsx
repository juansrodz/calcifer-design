import { composeStories } from '@storybook/react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { CalendarIcon } from '../../icons/CalendarIcon';
import { Field } from '../Field/Field';
import { TextInput } from './TextInput';
import * as stories from './TextInput.stories';

const {
  Default,
  Email,
  Password,
  Date: DateInput,
  ReadOnly,
  WithStartIcon,
  StartIconWithError,
  StartIconDisabled,
} = composeStories(stories);

describe('TextInput', () => {
  it.each([
    ['Default', Default],
    ['Email', Email],
    ['Password', Password],
    ['Date', DateInput],
    ['ReadOnly', ReadOnly],
    ['WithStartIcon', WithStartIcon],
    ['StartIconWithError', StartIconWithError],
    ['StartIconDisabled', StartIconDisabled],
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

  describe('with a leading icon', () => {
    /** The pill around the input, which wears the skin the bare input wears without an icon. */
    function pill(): HTMLElement {
      const box = screen.getByRole('textbox', { name: 'Location' }).parentElement;
      if (box === null) throw new Error('the input has no pill around it');
      return box;
    }

    it('names the textbox by the Field, as it does without an icon', () => {
      render(<WithStartIcon />);
      expect(screen.getByRole('textbox', { name: 'Location' })).toBeVisible();
    });

    it('puts the skin on a pill and the affix input inside it, after a decorative icon', () => {
      render(<WithStartIcon />);
      const input = screen.getByRole('textbox', { name: 'Location' });
      expect(pill()).toHaveClass('control', 'affix');
      const icon = input.previousElementSibling;
      expect(icon).toBe(pill().firstElementChild);
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveClass('affixIcon');
      expect(icon?.querySelector('svg')).not.toBeNull();
      expect(input).toHaveClass('affixInput');
      expect(input).not.toHaveClass('control');
      // The Field's `name` still reaches the input, which is what a form submits.
      expect(input).toHaveAttribute('name', 'location');
      expect(pill().children).toHaveLength(2);
    });

    it('reports every keystroke, the last being the whole value', async () => {
      const onValueChange = vi.fn();
      render(
        <Field label="Location" name="location">
          <TextInput startIcon={<CalendarIcon />} onValueChange={onValueChange} />
        </Field>,
      );
      await userEvent.type(screen.getByRole('textbox', { name: 'Location' }), 'Pier 39');
      // Base UI passes the change's details after the value, as it does without an icon.
      expect(onValueChange.mock.lastCall?.[0]).toBe('Pier 39');
    });

    it('keeps the field wiring on the input: the error, its message and the description', () => {
      render(
        <Field label="Location" name="location" description="Where it happens." error="Too vague.">
          <TextInput startIcon={<CalendarIcon />} />
        </Field>,
      );
      const input = screen.getByRole('textbox', { name: 'Location' });
      expect(input).toHaveAttribute('data-invalid');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription('Where it happens. Too vague.');
      expect(pill()).not.toHaveAttribute('data-invalid');
    });

    it('takes the disabled state from the field onto the input the pill reads it from', () => {
      render(
        <Field label="Location" name="location" disabled>
          <TextInput startIcon={<CalendarIcon />} />
        </Field>,
      );
      const input = screen.getByRole('textbox', { name: 'Location' });
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('data-disabled');
    });

    it('is a bare input wearing the skin when there is no icon, with no wrapper', () => {
      render(
        <Field label="Location" name="location">
          <TextInput />
        </Field>,
      );
      const input = screen.getByRole('textbox', { name: 'Location' });
      expect(input).toHaveClass('control');
      expect(input).not.toHaveClass('affixInput');
      expect(input.closest('.affix')).toBeNull();
    });

    it('treats an icon that renders nothing as no icon', () => {
      render(
        <Field label="Location" name="location">
          <TextInput startIcon={false} />
        </Field>,
      );
      expect(screen.getByRole('textbox', { name: 'Location' })).toHaveClass('control');
    });

    it('ignores the icon when the caller renders a different element, as it does `type`', () => {
      render(
        <Field label="Notes" name="notes">
          <TextInput startIcon={<CalendarIcon />} render={<textarea />} />
        </Field>,
      );
      const notes = screen.getByLabelText('Notes');
      expect(notes.tagName).toBe('TEXTAREA');
      expect(notes).toHaveClass('control');
      expect(notes.closest('.affix')).toBeNull();
    });

    // The input is one line tall inside a taller pill, so a press on the glyph or in the pill's
    // padding would focus nothing without this.
    describe('focuses the input from a press anywhere on the pill', () => {
      it('on the icon, so the caret lands in the input', async () => {
        render(<WithStartIcon />);
        const icon = pill().firstElementChild;
        if (icon === null) throw new Error('the pill has no icon');
        await userEvent.click(icon);
        expect(screen.getByRole('textbox', { name: 'Location' })).toHaveFocus();
      });

      it('on the pill itself, cancelling the press so the focus is not taken back', () => {
        render(<WithStartIcon />);
        expect(fireEvent.mouseDown(pill())).toBe(false);
        expect(screen.getByRole('textbox', { name: 'Location' })).toHaveFocus();
      });

      it('but never from the input, whose presses are its own', () => {
        render(<WithStartIcon />);
        expect(fireEvent.mouseDown(screen.getByRole('textbox', { name: 'Location' }))).toBe(true);
      });
    });
  });
});
