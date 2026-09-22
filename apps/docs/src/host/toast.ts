/**
 * The host's toast manager, exactly as the Bridge props contract declares it in
 * `@calcifer-design/contract` (portfolio-mfe, `packages/contract/src/remote-app.ts`), mirrored
 * here because this repository installs only from npmjs and that package is on CodeArtifact
 * (spec §4, and the plan's Decision 1). `src/host/toast.test.ts` assigns a real
 * `createToastManager()` result to it, so the compiler is what keeps the mirror honest.
 *
 * Three methods and no more. The contract is the promise the *live* shell keeps: a remote
 * deploys on its own clock and may call these against a shell built months earlier, with no
 * compilation shared between them. `title` and `description` are `string` because a
 * `ReactNode` authored here would render inside the host's React root, under the host's CSS.
 */
export interface HostToastOptions {
  title: string;
  description?: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  timeout?: number;
  priority?: 'low' | 'high';
  id?: string;
}

export interface HostToastManager {
  add: (options: HostToastOptions) => string;
  /**
   * Closes one toast. The id is **required** here although the library's own manager makes it
   * optional: Base UI reads `toastId === undefined` as "close every toast in the store", which
   * would wipe toasts the shell and other remotes raised. Ids are global to the host's store.
   */
  close: (toastId: string) => void;
  /**
   * `id` is excluded on purpose: Base UI's store merges an `update` payload into the existing
   * toast, so a new `id` in that payload would re-key the toast in place. Its dismiss timer was
   * scheduled against the original id, and the caller's own later `close(originalId)` was too, so
   * both would then match nothing and the toast would be stranded in the host's single region.
   * The shipped `@calcifer-design/ui` manager excludes `id` from its own `update` for the same
   * reason (contract's `HostToastManager.update`, `packages/contract/src/remote-app.ts`).
   */
  update: (toastId: string, options: Omit<Partial<HostToastOptions>, 'id'>) => void;
}
