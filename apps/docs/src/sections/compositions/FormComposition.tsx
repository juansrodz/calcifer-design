import { Alert, Button } from '@calcifer-design/ui';
import { useId, useState, type FormEvent } from 'react';
import type { HostToastManager } from '../../host/toast';
import styles from '../../styles/docs.module.css';

export interface FormCompositionProps {
  hostToast?: HostToastManager;
}

const tiers = ['Tier 1 — foundations', 'Tier 2 — floating surfaces', 'Tier 4 — page furniture'];

export function FormComposition({ hostToast }: FormCompositionProps) {
  const nameId = useId();
  const tierId = useId();
  const reasonId = useId();
  const [receipt, setReceipt] = useState<string | undefined>(undefined);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const componentName =
      String(fields.get('componentName') ?? '').trim() || 'an unnamed component';
    const message = `${componentName} was filed against the backlog.`;
    if (hostToast) {
      // The host owns the region this lands in; this remote only calls the manager (spec §5.3).
      hostToast.add({ title: 'Request filed', description: message, tone: 'success' });
      setReceipt(undefined);
      return;
    }
    // No manager reached this remote — standalone against an old shell, or a host that passes
    // none. An inline alert is the honest fallback; a second toast region is not.
    setReceipt(message);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.note} data-testid="tier-3-slot">
        The three fields below are this page’s own markup, not library components. Tier 3 — Plan C’s
        Field, TextInput, Select, Checkbox, RadioGroup and Switch — is in the library, and this slot
        is where they land.
      </p>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={nameId}>
          Component name
        </label>
        <input className={styles.input} id={nameId} name="componentName" type="text" />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={tierId}>
          Tier
        </label>
        <select className={styles.input} id={tierId} name="tier" defaultValue={tiers[0]}>
          {tiers.map((tier) => (
            <option key={tier} value={tier}>
              {tier}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={reasonId}>
          Why it is needed
        </label>
        <textarea className={styles.input} id={reasonId} name="reason" rows={3} />
      </div>
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
