import { Field as BaseField } from '@base-ui/react/field';
import { createContext, useContext, type ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';

/**
 * Carries `required` from the frame to the control inside it.
 *
 * Base UI's `Field.Root` propagates `name` and `disabled` to whatever control is beneath it but
 * has no `required` of its own, so without this the prop would have to be written twice — once
 * on `Field` for the visible mark and once on the control for the attribute — which is two
 * places to say one thing and one place to get it silently wrong. Internal: neither this
 * context nor the hook below is exported from `src/index.ts`, exactly as `icons/CloseIcon` is
 * internal, so neither is part of the published surface.
 */
const FieldRequiredContext = createContext(false);

/** Internal. Read by `TextInput`; not exported from the barrel. */
export function useFieldRequired(): boolean {
  return useContext(FieldRequiredContext);
}

export interface FieldMessagesProps {
  /** Sits under the control and joins the control's `aria-describedby`. */
  description: ReactNode;
  /**
   * The description node's own id. Left `undefined` lets Base UI generate one; a later
   * component's own frame passes an id of its own when something else needs to point at the
   * same node.
   */
  descriptionId?: string;
  /** The validation message. Its presence — not its content — is the error state. */
  error: string | undefined;
  /** The error node's own id, on the same terms as `descriptionId`. */
  errorId?: string;
}

/**
 * The description/error block every Tier 3 field frame renders: a description that shows
 * whenever one is given, and an error that only shows once one is given. Exported, but
 * deliberately absent from `src/index.ts` — not part of the barrel, exactly as
 * `useFieldRequired` above and `icons/CloseIcon` are reachable across modules without being
 * published. `Field` is the first of six components that render this exact pair; `Select`,
 * `Checkbox`, `RadioGroup` and `Switch` import it from here in later tasks, each supplying its
 * own frame's `description` and `error` and, where its frame does not already sit inside a
 * `Field.Root` whose context wires `aria-describedby` on its own, the ids that frame needs the
 * nodes to carry.
 */
export function FieldMessages({ description, descriptionId, error, errorId }: FieldMessagesProps) {
  // `ReactNode` includes `null` and `false`, and `description={isTouched && 'text'}` is the
  // commonest conditional-render idiom in React. Testing for `undefined` alone rendered an
  // empty description node for both and joined it to the control's `aria-describedby`.
  const hasDescription = description !== undefined && description !== null && description !== false;
  return (
    <>
      {hasDescription ? (
        <BaseField.Description id={descriptionId} className={fieldStyles.description}>
          {description}
        </BaseField.Description>
      ) : null}
      {/* Conditional, and it has to be. `Field.Error match` means "always show", so a version
          of this that rendered it unconditionally would put an empty error node in every
          field's `aria-describedby`. Measured. */}
      {error === undefined ? null : (
        <BaseField.Error id={errorId} className={fieldStyles.error} match>
          {error}
        </BaseField.Error>
      )}
    </>
  );
}

/*
 * No control in Tier 3 takes a `ref`. §8 bars `forwardRef`, and React 19 would let a plain
 * `ref` prop ride through `TextInput`'s rest spread without one — but `TextInput` is the only
 * one of the six with a rest spread, so adding it there alone would trade one inconsistency
 * for another, and adding it to all six is a design decision rather than a cleanup. Recorded
 * here so the next reader knows it was decided, not missed.
 */
export interface FieldProps {
  /** The visible label, and the control's accessible name. */
  label: string;
  /**
   * Identifies the field when a form is submitted. It takes precedence over any `name` the
   * control carries, which is why no control in this tier has one.
   */
  name?: string;
  /** Sits under the control and joins the control's `aria-describedby`. */
  description?: ReactNode;
  /**
   * The validation message. Its presence — not its content — is the error state: the frame
   * becomes `invalid`, the control gets `aria-invalid="true"` and the message joins the
   * control's `aria-describedby`. Validation itself belongs to the consuming app; the library
   * owns only how an error looks and how it is announced.
   */
  error?: string;
  /**
   * Draws the required mark and puts `required` on the control. Note that a native `required`
   * also arms the browser's own validation bubble on submit; a form driven by TanStack Form or
   * any other library should carry `noValidate` on the `<form>`, as such forms normally do.
   */
  required?: boolean;
  disabled?: boolean;
  /**
   * The control. `TextInput` is the one this tier ships for it; anything else Base UI's field
   * context reaches works too, and `TextInput`'s `render` prop is how a caller's own element —
   * a `<textarea>`, an `<input type="file">` — gets the same wiring and the same skin.
   *
   * `Select`, `Checkbox`, `RadioGroup` and `Switch` are **not** composed in here: each owns its
   * own field frame, because a `<label for>` above a control is not the anatomy any of them has.
   */
  children: ReactNode;
}

export function Field({
  label,
  name,
  description,
  error,
  required = false,
  disabled = false,
  children,
}: FieldProps) {
  return (
    <BaseField.Root
      className={fieldStyles.frame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      <BaseField.Label className={fieldStyles.label}>
        {label}
        {required ? <span className={fieldStyles.required} aria-hidden="true" /> : null}
      </BaseField.Label>
      <FieldRequiredContext.Provider value={required}>{children}</FieldRequiredContext.Provider>
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}

export interface InlineFieldProps {
  /** The text beside the control, and the control's accessible name. */
  label: string;
  /** Identifies the field when a form is submitted. */
  name?: string;
  /** Sits under the row and joins the control's `aria-describedby`. */
  description?: ReactNode;
  /** The validation message. Its presence — not its content — is the error state. */
  error?: string;
  /** Draws the required mark. The control itself still takes its own `required`. */
  required?: boolean;
  disabled?: boolean;
  /** The control that sits at the head of the row: a `Checkbox.Root`, a `Switch.Root`. */
  children: ReactNode;
}

/**
 * The frame `Checkbox` and `Switch` share: a row whose label wraps the control and the text,
 * with the description and the error beneath it. That is the whole difference between this
 * frame and `Field`'s — the label sits beside the control rather than above it — and it is why
 * neither of those two is composed inside `Field`. Exported, but deliberately absent from
 * `src/index.ts`, on the same terms as `FieldMessages` and `useFieldRequired` above: a
 * consumer composes a `Checkbox` or a `Switch`, not the frame under them.
 */
export function InlineField({
  label,
  name,
  description,
  error,
  required = false,
  disabled = false,
  children,
}: InlineFieldProps) {
  return (
    <BaseField.Root
      className={fieldStyles.inlineFrame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      <BaseField.Label className={fieldStyles.optionLabel}>
        {children}
        {label}
        {required ? <span className={fieldStyles.required} aria-hidden="true" /> : null}
      </BaseField.Label>
      <FieldMessages description={description} error={error} />
    </BaseField.Root>
  );
}
