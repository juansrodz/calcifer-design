import { createToastManager } from '@calcifer-design/ui';
import { describe, expect, it } from 'vitest';
import type { HostToastManager } from './toast';

describe('HostToastManager', () => {
  it('is satisfied by the manager the library creates', () => {
    // A compile-time assertion first and a runtime one second: if the library's manager ever
    // stops being assignable to the contract's shape, `bun run typecheck` fails here — which
    // is the only signal this repository can get about a type it deliberately does not import.
    const manager: HostToastManager = createToastManager();
    expect(typeof manager.add).toBe('function');
    expect(typeof manager.close).toBe('function');
    expect(typeof manager.update).toBe('function');
  });

  it('raises a toast through the manager and gets an id back', () => {
    const manager: HostToastManager = createToastManager();
    const toastId = manager.add({ title: 'Saved', tone: 'success' });
    expect(typeof toastId).toBe('string');
    expect(toastId.length).toBeGreaterThan(0);
  });
});
