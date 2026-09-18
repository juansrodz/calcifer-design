import { Toast as BaseToast } from '@base-ui/react/toast';
import type { ToastManager as BaseToastManager } from '@base-ui/react/toast';
import popupStyles from '../../styles/popup.module.css';
import styles from './ToastRegion.module.css';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /**
   * The manager's data payload, spread into Base UI's `add()`, which expects
   * `title`/`description`; kept as `title` rather than the library's `heading` convention
   * because the cross-repository Bridge contract carries the same `title: string`.
   */
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds before the toast dismisses itself. `0` keeps it until it is closed. */
  timeout?: number;
  /** `high` also mirrors the toast into a hidden `role="alert"` region, so it interrupts. */
  priority?: 'low' | 'high';
  /** Reusing an id updates that toast in place and restarts its dismiss timer. */
  id?: string;
  action?: ToastAction;
}

/**
 * The object a host hands to a remote so the remote can raise a toast in the host's single
 * viewport. Deliberately narrower than Base UI's own manager: `title` and `description` are
 * `string`, not `ReactNode`, because an element authored in a remote would render inside the
 * host's React root and under the host's CSS.
 */
export interface ToastManager {
  add: (options: ToastOptions) => string;
  /**
   * Closes one toast by id. Omitting `toastId` closes every toast in the store (Base UI's
   * `closeAll` path) — a caller that wants a no-op must pass an id.
   */
  close: (toastId?: string) => void;
  update: (toastId: string, options: Omit<Partial<ToastOptions>, 'id'>) => void;
  /**
   * The Base UI manager `ToastRegion` subscribes to. Not part of the surface a remote is given —
   * the Bridge contract declares only `add`, `close` and `update`.
   */
  readonly baseManager: BaseToastManager;
}

function toBaseOptions(options: Partial<ToastOptions>) {
  const { tone, action, ...rest } = options;
  return {
    ...rest,
    ...(tone === undefined ? {} : { type: tone }),
    ...(action === undefined
      ? {}
      : { actionProps: { children: action.label, onClick: action.onClick } }),
  };
}

/**
 * Creates a toast manager outside React. It is a plain object over a listener set: no context,
 * no hooks, no module-identity requirement — which is exactly why it survives the trip across
 * the Bridge into a remote's separate React root, where a provider's context could not.
 *
 * A call made while no `ToastRegion` is mounted is dropped: `add` still returns an id, and the
 * toast is never shown.
 */
export function createToastManager(): ToastManager {
  const baseManager = BaseToast.createToastManager();
  return {
    baseManager,
    add: (options) => baseManager.add(toBaseOptions(options)),
    close: (toastId) => {
      baseManager.close(toastId);
    },
    update: (toastId, options) => {
      baseManager.update(toastId, toBaseOptions(options));
    },
  };
}

export interface ToastRegionProps {
  /** The manager this region renders. One region per manager, and one manager per page. */
  manager: ToastManager;
  /** The landmark's accessible name. */
  label?: string;
  /** How many toasts are on screen at once; the rest wait, marked `data-limited`. */
  limit?: number;
  /** Default milliseconds before a toast dismisses itself. `0` keeps every toast until closed. */
  timeout?: number;
  /** The accessible name of each toast's close control. */
  closeLabel?: string;
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m4.5 4.5 7 7" />
      <path d="m11.5 4.5-7 7" />
    </svg>
  );
}

/**
 * `Toast.Title`, `Toast.Description` and `Toast.Action` each render `null` when the toast
 * carries no such field, so all four parts are rendered unconditionally and the manager's
 * options decide what appears.
 */
function ToastList({ closeLabel }: { closeLabel: string }) {
  const { toasts } = BaseToast.useToastManager();
  return toasts.map((toastObject) => (
    <BaseToast.Root key={toastObject.id} toast={toastObject} className={styles.toast}>
      <BaseToast.Content className={styles.content}>
        <BaseToast.Title className={styles.heading} />
        <BaseToast.Description className={styles.description} />
      </BaseToast.Content>
      <BaseToast.Action className={styles.action} />
      <BaseToast.Close className={styles.close} aria-label={closeLabel}>
        <CloseIcon />
      </BaseToast.Close>
    </BaseToast.Root>
  ));
}

/**
 * The whole toast apparatus as one component: provider, portal and viewport together, so no
 * consumer can mount a second viewport by accident. That matters because it is the viewport —
 * not the provider — that renders the `role="region"` landmark, the hidden `role="alert"` mirror
 * for high-priority toasts, and four window-level listeners. Two of them overlap in the same
 * screen corner, and the last-committed one silently wins.
 */
export function ToastRegion({
  manager,
  label = 'Notifications',
  limit = 3,
  timeout = 5000,
  closeLabel = 'Close',
}: ToastRegionProps) {
  return (
    <BaseToast.Provider toastManager={manager.baseManager} limit={limit} timeout={timeout}>
      <BaseToast.Portal>
        <BaseToast.Viewport
          className={[popupStyles.toastLayer, styles.viewport].join(' ')}
          aria-label={label}
        >
          <ToastList closeLabel={closeLabel} />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
