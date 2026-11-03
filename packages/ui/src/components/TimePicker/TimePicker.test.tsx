import { composeStories } from '@storybook/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Field } from '../Field/Field';
import { TimePicker } from './TimePicker';
import * as stories from './TimePicker.stories';

const { Default, Prefilled, Bounded, Described, Required, Disabled, WithError, Dark } =
  composeStories(stories);

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
});
