import { composeStories } from '@storybook/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Checkbox } from '../Checkbox/Checkbox';
import { Field } from '../Field/Field';
import { RadioGroup } from '../RadioGroup/RadioGroup';
import { Select } from '../Select/Select';
import { Switch } from '../Switch/Switch';
import { TextArea } from '../TextArea/TextArea';
import { TextInput } from '../TextInput/TextInput';
import { TimePicker } from '../TimePicker/TimePicker';
import { Form } from './Form';
import * as stories from './Form.stories';

const { Default, WithErrors, Dark } = composeStories(stories);

const noop = () => undefined;
const categories = [
  { value: 'mains', label: 'Mains' },
  { value: 'sides', label: 'Sides' },
];
const portions = [
  { value: 'small', label: 'Small' },
  { value: 'large', label: 'Large' },
];

/** Every control `errors` must reach, each with the role and name a test can find it by. */
const controls: {
  name: string;
  control: ReactElement;
  explicit: ReactElement;
  find: () => HTMLElement;
}[] = [
  {
    name: 'Field with TextInput',
    control: (
      <Field label="Target" name="target">
        <TextInput />
      </Field>
    ),
    explicit: (
      <Field label="Target" name="target" error="Explicit.">
        <TextInput />
      </Field>
    ),
    find: () => screen.getByRole('textbox', { name: 'Target' }),
  },
  {
    name: 'Field with TextArea',
    control: (
      <Field label="Target" name="target">
        <TextArea />
      </Field>
    ),
    explicit: (
      <Field label="Target" name="target" error="Explicit.">
        <TextArea />
      </Field>
    ),
    find: () => screen.getByRole('textbox', { name: 'Target' }),
  },
  {
    name: 'Field with TimePicker',
    control: (
      <Field label="Target" name="target">
        <TimePicker />
      </Field>
    ),
    explicit: (
      <Field label="Target" name="target" error="Explicit.">
        <TimePicker />
      </Field>
    ),
    find: () => screen.getByLabelText('Target'),
  },
  {
    name: 'Select',
    control: <Select label="Target" name="target" options={categories} />,
    explicit: <Select label="Target" name="target" options={categories} error="Explicit." />,
    find: () => screen.getByRole('combobox', { name: 'Target' }),
  },
  {
    name: 'Checkbox',
    control: <Checkbox label="Target" name="target" />,
    explicit: <Checkbox label="Target" name="target" error="Explicit." />,
    find: () => screen.getByRole('checkbox', { name: 'Target' }),
  },
  {
    name: 'Switch',
    control: <Switch label="Target" name="target" />,
    explicit: <Switch label="Target" name="target" error="Explicit." />,
    find: () => screen.getByRole('switch', { name: 'Target' }),
  },
];

describe('Form', () => {
  it.each([
    ['Default', Default],
    ['WithErrors', WithErrors],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a form, named when asked, and not validated by the browser unless told to', () => {
    const { rerender } = render(
      <Form aria-label="Dish" onSubmit={noop}>
        <span />
      </Form>,
    );
    expect(screen.getByRole('form', { name: 'Dish' })).toHaveAttribute('novalidate');
    rerender(
      <Form aria-label="Dish" onSubmit={noop} noValidate={false}>
        <span />
      </Form>,
    );
    expect(screen.getByRole('form', { name: 'Dish' })).not.toHaveAttribute('novalidate');
  });

  describe('an entry in errors', () => {
    it.each(controls)('shows on $name and marks it invalid', ({ control, find }) => {
      render(
        <Form onSubmit={noop} errors={{ target: 'From the server.' }}>
          {control}
        </Form>,
      );
      expect(screen.getByText('From the server.')).toBeVisible();
      expect(find()).toHaveAccessibleDescription('From the server.');
      expect(find()).toHaveAttribute('aria-invalid', 'true');
    });

    it.each(controls)('loses to an explicit error on $name', ({ explicit, find }) => {
      render(
        <Form onSubmit={noop} errors={{ target: 'From the server.' }}>
          {explicit}
        </Form>,
      );
      expect(screen.getByText('Explicit.')).toBeVisible();
      expect(screen.queryByText('From the server.')).toBeNull();
      expect(find()).toHaveAccessibleDescription('Explicit.');
    });

    it.each(controls)('takes focus on submit on $name', async ({ control, find }) => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit} errors={{ target: 'From the server.' }}>
          {control}
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(find()).toHaveFocus();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it.each(controls)('leaves nothing describing $name when there is none', ({ control, find }) => {
      render(
        <Form onSubmit={noop} errors={{ other: 'Elsewhere.' }}>
          {control}
        </Form>,
      );
      expect(find()).not.toHaveAttribute('aria-describedby');
      expect(find()).not.toHaveAttribute('aria-invalid');
    });

    it('shows on a RadioGroup and marks its options invalid', () => {
      render(
        <Form onSubmit={noop} errors={{ target: 'From the server.' }}>
          <RadioGroup label="Target" name="target" options={portions} />
        </Form>,
      );
      expect(screen.getByText('From the server.')).toBeVisible();
      expect(screen.getByRole('radiogroup', { name: 'Target' })).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(screen.getByRole('radiogroup', { name: 'Target' })).toHaveAccessibleDescription(
        'From the server.',
      );
    });

    it('moves focus into a RadioGroup on submit', async () => {
      render(
        <Form onSubmit={noop} errors={{ target: 'From the server.' }}>
          <RadioGroup label="Target" name="target" options={portions} />
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByRole('radio', { name: 'Small' })).toHaveFocus();
    });

    it('loses to an explicit error on a RadioGroup', () => {
      render(
        <Form onSubmit={noop} errors={{ target: 'From the server.' }}>
          <RadioGroup label="Target" name="target" options={portions} error="Explicit." />
        </Form>,
      );
      expect(screen.getByText('Explicit.')).toBeVisible();
      expect(screen.queryByText('From the server.')).toBeNull();
    });
  });

  describe('clearing', () => {
    it('clears the entry on a TextInput as its value changes, and submits afterwards', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit} errors={{ email: 'Taken.' }}>
          <Field label="Email" name="email">
            <TextInput />
          </Field>
          <button type="submit">Save</button>
        </Form>,
      );
      const email = screen.getByRole('textbox', { name: 'Email' });
      await userEvent.type(email, 'a');
      expect(screen.queryByText('Taken.')).toBeNull();
      expect(email).not.toHaveAttribute('aria-invalid');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ email: 'a' });
    });

    it('clears a controlled TextArea entry too', async () => {
      function Controlled() {
        const [notes, setNotes] = useState('');
        return (
          <Form onSubmit={noop} errors={{ notes: 'Too short.' }}>
            <Field label="Notes" name="notes">
              <TextArea value={notes} onValueChange={setNotes} />
            </Field>
          </Form>
        );
      }
      render(<Controlled />);
      await userEvent.type(screen.getByRole('textbox', { name: 'Notes' }), 'a');
      expect(screen.queryByText('Too short.')).toBeNull();
    });

    it('clears the entry on a Select when an option is chosen', async () => {
      render(
        <Form onSubmit={noop} errors={{ category: 'Closed.' }}>
          <Select label="Category" name="category" options={categories} />
        </Form>,
      );
      await userEvent.click(screen.getByRole('combobox', { name: 'Category' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Sides' }));
      await waitFor(() => expect(screen.queryByText('Closed.')).toBeNull());
    });

    it.each([
      ['Checkbox', <Checkbox key="box" label="Agree" name="agree" />, 'checkbox'],
      ['Switch', <Switch key="switch" label="Agree" name="agree" />, 'switch'],
    ])('clears the entry on a %s when it toggles', async (_name, control, role) => {
      render(
        <Form onSubmit={noop} errors={{ agree: 'Needed.' }}>
          {control}
        </Form>,
      );
      await userEvent.click(screen.getByRole(role, { name: 'Agree' }));
      expect(screen.queryByText('Needed.')).toBeNull();
    });

    it('clears the entry on a RadioGroup when an option is chosen', async () => {
      render(
        <Form onSubmit={noop} errors={{ portion: 'Gone.' }}>
          <RadioGroup label="Portion" name="portion" options={portions} />
        </Form>,
      );
      await userEvent.click(screen.getByRole('radio', { name: 'Large' }));
      expect(screen.queryByText('Gone.')).toBeNull();
    });

    it('does not let an inline literal restore a message on the next render', async () => {
      function Controlled() {
        const [email, setEmail] = useState('');
        return (
          <Form onSubmit={noop} errors={{ email: 'Taken.' }}>
            <Field label="Email" name="email">
              <TextInput value={email} onValueChange={setEmail} />
            </Field>
          </Form>
        );
      }
      render(<Controlled />);
      await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'ab');
      expect(screen.queryByText('Taken.')).toBeNull();
    });

    it('shows a new message from the parent', async () => {
      function Parent() {
        const [errors, setErrors] = useState({ email: 'Taken.' });
        return (
          <Form onSubmit={noop} errors={errors}>
            <Field label="Email" name="email">
              <TextInput />
            </Field>
            <button type="button" onClick={() => setErrors({ email: 'Banned.' })}>
              Answer
            </button>
          </Form>
        );
      }
      render(<Parent />);
      await userEvent.click(screen.getByRole('button', { name: 'Answer' }));
      expect(screen.getByText('Banned.')).toBeVisible();
    });

    it('shows the same message again when a second submit is refused the same way', async () => {
      function Parent() {
        const [errors, setErrors] = useState<Record<string, string>>({});
        return (
          <Form onSubmit={() => setErrors({ email: 'Taken.' })} errors={errors}>
            <Field label="Email" name="email">
              <TextInput />
            </Field>
            <button type="submit">Save</button>
          </Form>
        );
      }
      render(<Parent />);
      const email = screen.getByRole('textbox', { name: 'Email' });
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText('Taken.')).toBeVisible();
      await userEvent.type(email, 'a');
      expect(screen.queryByText('Taken.')).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByText('Taken.')).toBeVisible();
    });

    it('moves focus to the field a server refuses, once the answer arrives', async () => {
      function Parent() {
        const [errors, setErrors] = useState<Record<string, string>>({});
        return (
          <Form onSubmit={() => setErrors({ second: 'Taken.' })} errors={errors}>
            <Field label="First" name="first">
              <TextInput />
            </Field>
            <Field label="Second" name="second">
              <TextInput />
            </Field>
            <button type="submit">Save</button>
          </Form>
        );
      }
      render(<Parent />);
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByRole('textbox', { name: 'Second' })).toHaveFocus();
    });
  });

  describe('focus on submit', () => {
    it('goes to the first invalid control in document order', async () => {
      render(
        <Form onSubmit={noop} errors={{ third: 'No.', second: 'No.' }}>
          <Field label="First" name="first">
            <TextInput />
          </Field>
          <Field label="Second" name="second">
            <TextInput />
          </Field>
          <Select label="Third" name="third" options={categories} />
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByRole('textbox', { name: 'Second' })).toHaveFocus();
    });

    it('goes to a required control left empty, and does not submit', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <Field label="Optional" name="optional">
            <TextInput />
          </Field>
          <Field label="Needed" name="needed" required>
            <TextInput />
          </Field>
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByRole('textbox', { name: 'Needed' })).toHaveFocus();
      expect(screen.getByRole('textbox', { name: 'Needed' })).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it.each([
      [
        'Select',
        <Select key="select" label="Needed" name="needed" required options={categories} />,
        'combobox',
      ],
      ['Checkbox', <Checkbox key="box" label="Needed" name="needed" required />, 'checkbox'],
      ['Switch', <Switch key="switch" label="Needed" name="needed" required />, 'switch'],
    ])('blocks visibly on a required %s, with no silent stop', async (_name, control, role) => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          {control}
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByRole(role, { name: 'Needed' })).toHaveFocus();
      expect(screen.getByRole(role, { name: 'Needed' })).toHaveAttribute('aria-invalid', 'true');
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('blocks a required RadioGroup and focuses its first option', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <RadioGroup label="Needed" name="needed" required options={portions} />
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByRole('radio', { name: 'Small' })).toHaveFocus();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('treats an explicit error as invalid too, so the form does not submit past it', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <Field label="Email" name="email" error="Not that one.">
            <TextInput />
          </Field>
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit', () => {
    it('gets a plain object holding each kind of value', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <Field label="Email" name="email">
            <TextInput defaultValue="a@b.co" />
          </Field>
          <Field label="Notes" name="notes">
            <TextArea defaultValue={'one\ntwo'} />
          </Field>
          <Field label="Arrival" name="arrival">
            <TimePicker defaultValue="18:30" />
          </Field>
          <Select label="Category" name="category" defaultValue="sides" options={categories} />
          <Select label="Course" name="course" options={categories} />
          <RadioGroup label="Portion" name="portion" defaultValue="large" options={portions} />
          <RadioGroup label="Spice" name="spice" options={portions} />
          <Checkbox label="Bringing" name="bringing" defaultChecked />
          <Checkbox label="Vegan" name="vegan" />
          <Switch label="Notify" name="notify" defaultChecked />
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit.mock.calls[0]).toEqual([
        {
          email: 'a@b.co',
          notes: 'one\ntwo',
          arrival: '18:30',
          category: 'sides',
          course: '',
          portion: 'large',
          spice: null,
          bringing: true,
          vegan: false,
          notify: true,
        },
      ]);
      expect(Object.getPrototypeOf(onSubmit.mock.calls[0]?.[0])).toBe(Object.prototype);
    });

    it('leaves a disabled control out, as a browser would', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <Field label="Email" name="email" disabled>
            <TextInput defaultValue="a@b.co" />
          </Field>
          <Field label="Notes" name="notes">
            <TextInput defaultValue="kept" />
          </Field>
          <button type="submit">Save</button>
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ notes: 'kept' });
    });

    it('never lets the browser navigate', () => {
      render(
        <Form aria-label="Dish" onSubmit={noop}>
          <button type="submit">Save</button>
        </Form>,
      );
      const notPrevented = fireEvent.submit(screen.getByRole('form', { name: 'Dish' }));
      expect(notPrevented).toBe(false);
    });
  });

  it('leaves a plain form as it was: no message from Base UI appears outside a Form', async () => {
    render(
      <form noValidate>
        <Field label="Needed" name="needed" required>
          <TextInput defaultValue="" />
        </Field>
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Needed' });
    await userEvent.type(input, 'a{Backspace}{Enter}');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});
