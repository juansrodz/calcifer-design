import {
  Alert,
  Button,
  Checkbox,
  Field,
  RadioGroup,
  Select,
  Switch,
  TextInput,
} from '@calcifer-design/ui';
import { useState, type FormEvent } from 'react';
import type { HostToastManager } from '../../host/toast';
import styles from '../../styles/docs.module.css';

export interface FormCompositionProps {
  hostToast?: HostToastManager;
}

const tiers = [
  { value: 'tier-1', label: 'Tier 1 — foundations' },
  { value: 'tier-2', label: 'Tier 2 — floating surfaces' },
  { value: 'tier-3', label: 'Tier 3 — forms' },
  { value: 'tier-4', label: 'Tier 4 — page furniture' },
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

export function FormComposition({ hostToast }: FormCompositionProps) {
  const [componentName, setComponentName] = useState('');
  const [tier, setTier] = useState<string | null>(tiers[0]?.value ?? null);
  const [priority, setPriority] = useState('normal');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const [blocker, setBlocker] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [receipt, setReceipt] = useState<string | undefined>(undefined);

  const trimmedName = componentName.trim();
  const nameError = attempted && trimmedName === '' ? 'Name the component.' : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (trimmedName === '') {
      return;
    }
    const message = `${trimmedName} was filed against the backlog${blocker ? ' as a blocker' : ''}.`;
    if (hostToast) {
      // The host owns the region this lands in; this remote only calls the manager (spec §5.3).
      hostToast.add({ title: 'Request filed', description: message, tone: 'success' });
      setReceipt(undefined);
      return;
    }
    // No manager reached this remote — standalone against an old shell, or a host that passes
    // none. An inline alert is the honest fallback; a second toast region is not. It announces
    // as `role="status"`, not `role="alert"`: Alert derives its politeness from its tone and
    // only `danger` is assertive (packages/ui/src/components/Alert/Alert.tsx), so a success
    // receipt is read out without interrupting whatever the visitor was doing.
    setReceipt(message);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <p className={styles.note} data-testid="form-note">
        Every field below is the library&rsquo;s Tier 3 — <code className={styles.code}>Field</code>
        , <code className={styles.code}>TextInput</code>,{' '}
        <code className={styles.code}>Select</code>, <code className={styles.code}>RadioGroup</code>
        , <code className={styles.code}>Checkbox</code> and{' '}
        <code className={styles.code}>Switch</code> — composed with the button, the alert and the
        toast the page already used.
      </p>
      <Field label="Component name" name="componentName" required error={nameError}>
        <TextInput value={componentName} onValueChange={setComponentName} placeholder="Combobox" />
      </Field>
      <Select label="Tier" name="tier" options={tiers} value={tier} onValueChange={setTier} />
      <RadioGroup
        label="Priority"
        name="priority"
        orientation="horizontal"
        options={priorities}
        value={priority}
        onValueChange={setPriority}
      />
      <Field
        label="Why it is needed"
        name="reason"
        description="One sentence is enough; the backlog links back to the request."
      >
        <TextInput value={reason} onValueChange={setReason} />
      </Field>
      <Checkbox
        label="Notify me when it ships"
        name="notify"
        checked={notify}
        onCheckedChange={setNotify}
      />
      <Switch
        label="File it as a blocker"
        name="blocker"
        description="Blockers go to the top of the backlog."
        checked={blocker}
        onCheckedChange={setBlocker}
      />
      <div>
        <Button type="submit">File the request</Button>
      </div>
      {receipt === undefined ? null : (
        <Alert tone="success" announce onDismiss={() => setReceipt(undefined)}>
          {receipt}
        </Alert>
      )}
    </form>
  );
}
