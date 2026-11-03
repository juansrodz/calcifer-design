import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { DatePicker } from '../DatePicker/DatePicker';
import { Field } from '../Field/Field';
import { RadioGroup } from '../RadioGroup/RadioGroup';
import { Select } from '../Select/Select';
import { Switch } from '../Switch/Switch';
import { TextArea } from '../TextArea/TextArea';
import { TextInput } from '../TextInput/TextInput';
import { TimePicker } from '../TimePicker/TimePicker';
import { Upload } from '../Upload/Upload';
import { Form, type FormProps } from './Form';

function ExampleForm(props: Omit<FormProps, 'children'>) {
  return (
    <div style={{ maxWidth: '28rem' }}>
      <Form aria-label="Dish" {...props}>
        <Field label="Email" name="email" required>
          <TextInput type="email" placeholder="you@example.com" />
        </Field>
        <Field label="Notes" name="notes">
          <TextArea rows={3} />
        </Field>
        <Field label="Arrival" name="arrival">
          <TimePicker />
        </Field>
        <DatePicker label="Event date" name="eventDate" required clearable />
        <Upload label="Menu" name="menu" accept=".pdf,image/*" multiple />
        <Select
          label="Category"
          name="category"
          options={[
            { value: 'mains', label: 'Mains' },
            { value: 'sides', label: 'Sides' },
          ]}
        />
        <RadioGroup
          label="Portion"
          name="portion"
          defaultValue="medium"
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
          ]}
        />
        <Checkbox label="I am bringing a dish" name="bringing" />
        <Switch label="Email me when someone joins" name="notify" />
        <div>
          <Button type="submit">Save</Button>
        </div>
      </Form>
    </div>
  );
}

const meta = {
  title: 'Forms/Form',
  component: ExampleForm,
  args: { onSubmit: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ExampleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** What a server's answer looks like: each entry lands on the control with that `name`. */
export const WithErrors: Story = {
  args: {
    errors: {
      email: 'That address is already taken.',
      notes: 'Keep it under 200 characters.',
      arrival: 'The doors close at nine.',
      eventDate: 'Nobody is free that day.',
      menu: 'Attach the menu as a PDF.',
      category: 'Choose a category that is still open.',
      portion: 'Small portions have run out.',
      bringing: 'Someone has to bring something.',
      notify: 'Turn this on to be told about changes.',
    },
  },
};
export const Dark: Story = { globals: { theme: 'dark' } };
