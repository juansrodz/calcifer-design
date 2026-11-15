import { composeStories } from '@storybook/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Field } from '../Field/Field';
import { TimePicker } from './TimePicker';
import * as stories from './TimePicker.stories';

const {
  Default,
  Prefilled,
  Bounded,
  Described,
  Required,
  Disabled,
  WithError,
  WithStartIcon,
  Dark,
} = composeStories(stories);

function timeInput(): HTMLInputElement {
  return screen.getByLabelText<HTMLInputElement>('Arrival');
}

describe('TimePicker', () => {
  it.each([
    ['Default', Default],
    ['Prefilled', Prefilled],
    ['Bounded', Bounded],
    ['Described', Described],
    ['Required', Required],
    ['Disabled', Disabled],
    ['WithError', WithError],
    ['WithStartIcon', WithStartIcon],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a native time input, named by the Field around it', () => {
    render(<Default />);
    expect(timeInput()).toHaveAttribute('type', 'time');
    expect(timeInput()).toHaveAttribute('name', 'arrival');
  });

  it('passes min, max and step straight to the native control', () => {
    render(<Bounded />);
    expect(timeInput()).toHaveAttribute('min', '09:00');
    expect(timeInput()).toHaveAttribute('max', '17:00');
    expect(timeInput()).toHaveAttribute('step', '900');
  });

  it('reports the value as HH:mm in one argument', () => {
    const onValueChange = vi.fn();
    render(
      <Field label="Arrival">
        <TimePicker onValueChange={onValueChange} />
      </Field>,
    );
    fireEvent.change(timeInput(), { target: { value: '18:30' } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('18:30');
  });

  it('follows a controlled value, and an empty one, with no warning', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Controlled() {
      const [time, setTime] = useState('08:15');
      return (
        <>
          <Field label="Arrival">
            <TimePicker value={time} onValueChange={setTime} />
          </Field>
          <button type="button" onClick={() => setTime('')}>
            Empty
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(timeInput()).toHaveValue('08:15');
    fireEvent.change(timeInput(), { target: { value: '09:45' } });
    expect(timeInput()).toHaveValue('09:45');
    fireEvent.click(screen.getByRole('button', { name: 'Empty' }));
    expect(timeInput()).toHaveValue('');
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('shows a time it cannot read as empty, and does not throw', () => {
    render(
      <Field label="Arrival">
        <TimePicker defaultValue="25:99" />
      </Field>,
    );
    expect(timeInput()).toHaveValue('');
  });

  it('reads required from the Field and disabled through it', () => {
    const { unmount } = render(<Required />);
    expect(timeInput()).toBeRequired();
    unmount();
    render(<Disabled />);
    expect(timeInput()).toBeDisabled();
  });

  it('is described by the error and marked invalid', () => {
    render(<WithError />);
    expect(timeInput()).toHaveAttribute('aria-invalid', 'true');
    expect(timeInput()).toHaveAccessibleDescription('Arrive before the doors close.');
  });

  describe('with a leading icon', () => {
    it('keeps the native time input and its label, inside a pill after a decorative icon', () => {
      render(<WithStartIcon />);
      expect(timeInput()).toHaveAttribute('type', 'time');
      expect(timeInput()).toHaveClass('affixInput');
      expect(timeInput()).not.toHaveClass('control');
      const pill = timeInput().parentElement;
      expect(pill).toHaveClass('control', 'affix');
      const icon = timeInput().previousElementSibling;
      expect(icon).toBe(pill?.firstElementChild);
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon?.querySelector('svg')).not.toBeNull();
    });

    it('is a bare input wearing the skin when there is no icon, with no wrapper', () => {
      render(<Default />);
      expect(timeInput()).toHaveClass('control');
      expect(timeInput()).not.toHaveClass('affixInput');
      expect(timeInput().closest('.affix')).toBeNull();
    });

    it('keeps the field wiring on the input, the error as it does without an icon', () => {
      render(
        <Field label="Arrival" error="Arrive before the doors close.">
          <TimePicker startIcon={<svg />} />
        </Field>,
      );
      expect(timeInput()).toHaveAttribute('aria-invalid', 'true');
      expect(timeInput()).toHaveAttribute('data-invalid');
      expect(timeInput()).toHaveAccessibleDescription('Arrive before the doors close.');
    });

    it('focuses the input from a press on the icon, the same pill behaviour as TextInput', () => {
      render(<WithStartIcon />);
      const icon = timeInput().previousElementSibling;
      if (icon === null) throw new Error('the pill has no icon');
      expect(fireEvent.mouseDown(icon)).toBe(false);
      expect(timeInput()).toHaveFocus();
    });

    it('reports the value as it does without an icon', () => {
      const onValueChange = vi.fn();
      render(
        <Field label="Arrival">
          <TimePicker startIcon={<svg />} onValueChange={onValueChange} />
        </Field>,
      );
      fireEvent.change(timeInput(), { target: { value: '18:30' } });
      expect(onValueChange).toHaveBeenCalledWith('18:30');
    });
  });
});
