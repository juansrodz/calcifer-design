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
      // The Field's `name` still reaches the input, which is what a form submits.
      expect(timeInput()).toHaveAttribute('name', 'arrival');
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

    describe('opens the native picker from a press on the icon', () => {
      function iconOf(input: HTMLInputElement): Element {
        const icon = input.previousElementSibling;
        if (icon === null) throw new Error('the pill has no icon');
        return icon;
      }

      // React reports an error thrown in an event handler on the window, not to `fireEvent`'s
      // caller, so a throw is caught there.
      function windowErrorsDuring(action: () => void): unknown[] {
        const errors: unknown[] = [];
        const record = (event: ErrorEvent) => {
          errors.push(event.error);
          event.preventDefault();
        };
        window.addEventListener('error', record);
        try {
          action();
        } finally {
          window.removeEventListener('error', record);
        }
        return errors;
      }

      it('calls showPicker, hides the browser’s own button, and leaves other presses alone', () => {
        render(<WithStartIcon />);
        const showPicker = vi.fn();
        timeInput().showPicker = showPicker;
        expect(timeInput().parentElement).toHaveAttribute('data-icon-opens-picker');
        fireEvent.mouseDown(timeInput().parentElement as HTMLElement);
        expect(showPicker).not.toHaveBeenCalled();
        fireEvent.mouseDown(iconOf(timeInput()).querySelector('svg') as SVGElement);
        expect(showPicker).toHaveBeenCalledTimes(1);
        expect(timeInput()).toHaveFocus();
      });

      it.each(['NotAllowedError', 'InvalidStateError', 'SecurityError'])(
        'swallows a %s from showPicker and still focuses the input',
        (errorName) => {
          render(<WithStartIcon />);
          timeInput().showPicker = () => {
            throw new DOMException('refused', errorName);
          };
          expect(windowErrorsDuring(() => fireEvent.mouseDown(iconOf(timeInput())))).toEqual([]);
          expect(timeInput()).toHaveFocus();
        },
      );

      it('lets any other error from showPicker through', () => {
        render(<WithStartIcon />);
        timeInput().showPicker = () => {
          throw new DOMException('aborted', 'AbortError');
        };
        const errors = windowErrorsDuring(() => fireEvent.mouseDown(iconOf(timeInput())));
        expect(errors).toHaveLength(1);
        expect((errors[0] as DOMException).name).toBe('AbortError');
      });

      it('does nothing more where the browser has no showPicker', () => {
        render(<WithStartIcon />);
        Object.defineProperty(timeInput(), 'showPicker', { value: undefined });
        expect(windowErrorsDuring(() => fireEvent.mouseDown(iconOf(timeInput())))).toEqual([]);
        expect(timeInput()).toHaveFocus();
      });
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
