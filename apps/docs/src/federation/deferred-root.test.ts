import { createElement } from 'react';
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDeferredRoot } from './deferred-root';

describe('createDeferredRoot', () => {
  it('renders into its container like a normal root', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createDeferredRoot(container);
    act(() => root.render(createElement('p', null, 'mounted')));
    expect(container.textContent).toBe('mounted');
    root.unmount();
  });

  it('defers unmount past the current task, so it never lands inside a host commit', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createDeferredRoot(container);
    act(() => root.render(createElement('p', null, 'mounted')));

    root.unmount();
    // Still mounted: the real unmount is queued as a microtask, which is what keeps React from
    // logging "Attempted to synchronously unmount a root while React was already rendering."
    expect(container.textContent).toBe('mounted');

    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toBe('');
  });
});
