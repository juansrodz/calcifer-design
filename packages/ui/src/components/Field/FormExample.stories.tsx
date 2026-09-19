import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { RadioGroup } from '../RadioGroup/RadioGroup';
import { Select } from '../Select/Select';
import { Switch } from '../Switch/Switch';
import { TextInput } from '../TextInput/TextInput';
import { Field } from './Field';

/**
 * The shape TanStack Form's `<form.Field>` render prop hands its child. Declared here rather
 * than imported: `@calcifer-design/ui` takes no dependency on a form library, and this is a
 * structural type, so the real `FieldApi` satisfies it without either side knowing.
 */
interface FormFieldApi<Value> {
  name: string;
  state: { value: Value; meta: { errors: string[]; isTouched: boolean } };
  handleChange: (value: Value) => void;
  handleBlur: () => void;
}

/**
 * The adapter, in full. This is the claim Decision 7 rests on: because `error` is a string and
 * the controls report their value directly, connecting a form library to a Tier 3 field is a
 * projection with no state of its own.
 *
 * An error is shown only once the field has been touched, which is a form-library convention
 * rather than a library one — `Field` shows whatever `error` it is given.
 */
function adaptFormField<Value>(fieldApi: FormFieldApi<Value>) {
  const firstError = fieldApi.state.meta.isTouched ? fieldApi.state.meta.errors[0] : undefined;
  return {
    fieldProps: { name: fieldApi.name, error: firstError },
    controlProps: {
      value: fieldApi.state.value,
      onValueChange: fieldApi.handleChange,
      onBlur: fieldApi.handleBlur,
    },
  };
}

type ExampleValues = {
  email: string;
  category: string;
  portion: string;
  notes: string;
  bringing: boolean;
  notify: boolean;
};

const initialValues: ExampleValues = {
  email: '',
  category: '',
  portion: 'medium',
  notes: '',
  bringing: false,
  notify: true,
};

/** Stands in for `useForm` + a Zod resolver. Twenty lines, and no dependency. */
function useExampleForm() {
  const [values, setValues] = useState<ExampleValues>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errorsFor = (name: keyof ExampleValues): string[] => {
    if (name === 'email' && !values.email.includes('@')) {
      return ['Enter an email address.'];
    }
    if (name === 'category' && values.category === '') {
      return ['Choose a category.'];
    }
    return [];
  };

  function field<Name extends keyof ExampleValues>(name: Name): FormFieldApi<ExampleValues[Name]> {
    return {
      name,
      state: {
        value: values[name],
        meta: { errors: errorsFor(name), isTouched: touched[name] === true },
      },
      handleChange: (value) => setValues((current) => ({ ...current, [name]: value })),
      handleBlur: () => setTouched((current) => ({ ...current, [name]: true })),
    };
  }

  const markAllTouched = () =>
    setTouched(Object.fromEntries(Object.keys(initialValues).map((name) => [name, true])));

  return {
    values,
    field,
    markAllTouched,
    hasErrors: () => errorsFor('email').length + errorsFor('category').length > 0,
  };
}

interface ExampleFormProps {
  /** Called with the collected values when the form validates. */
  onSubmitValues?: (values: ExampleValues) => void;
}

function ExampleForm({ onSubmitValues }: ExampleFormProps) {
  const form = useExampleForm();
  const email = adaptFormField(form.field('email'));
  const category = adaptFormField(form.field('category'));
  const portion = adaptFormField(form.field('portion'));
  const notes = adaptFormField(form.field('notes'));

  return (
    // `noValidate`, because `required` on a control also arms the browser's own validation
    // bubble and the form library owns validation here. Every form driven by a form library
    // wants this, which is why `Field`'s `required` prop documents it.
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.markAllTouched();
        if (!form.hasErrors()) {
          onSubmitValues?.(form.values);
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '28rem' }}
    >
      <Field label="Email" required {...email.fieldProps}>
        <TextInput type="email" placeholder="you@example.com" {...email.controlProps} />
      </Field>

      <Select
        label="Category"
        required
        placeholder="Pick one"
        options={[
          { value: 'mains', label: 'Mains' },
          { value: 'sides', label: 'Sides' },
          { value: 'desserts', label: 'Desserts' },
        ]}
        {...category.fieldProps}
        value={category.controlProps.value}
        onValueChange={(value) => form.field('category').handleChange(value ?? '')}
      />

      <RadioGroup
        label="Portion size"
        orientation="horizontal"
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
        {...portion.fieldProps}
        value={portion.controlProps.value}
        onValueChange={(value) => form.field('portion').handleChange(value)}
      />

      <Field label="Notes" {...notes.fieldProps}>
        <TextInput render={<textarea rows={3} />} {...notes.controlProps} />
      </Field>

      <Checkbox
        label="I am bringing a dish"
        name="bringing"
        checked={form.values.bringing}
        onCheckedChange={(checked) => form.field('bringing').handleChange(checked)}
      />

      <Switch
        label="Email me when someone joins"
        name="notify"
        description="One message per event, never a digest."
        checked={form.values.notify}
        onCheckedChange={(checked) => form.field('notify').handleChange(checked)}
      />

      <Button type="submit">Save</Button>
    </form>
  );
}

const meta = {
  title: 'Forms/A whole form',
  component: ExampleForm,
  args: { onSubmitValues: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ExampleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dark: Story = { globals: { theme: 'dark' } };
