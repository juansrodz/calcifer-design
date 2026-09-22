import { vi } from 'vitest';
import type { HostToastManager } from '../src/host/toast';

/**
 * A host's toast manager, for the tests that need one. Annotated `HostToastManager` — the mirror
 * of the Bridge props contract in `src/host/toast.ts` — so a stub that drifts from the contract
 * fails `typecheck` rather than passing a test against a shape no live shell supplies; built
 * from `vi.fn()`s so a caller can assert what this remote asked the host to do.
 */
export function stubHostToast(): HostToastManager {
  return { add: vi.fn(() => 'toast-1'), close: vi.fn(), update: vi.fn() };
}
