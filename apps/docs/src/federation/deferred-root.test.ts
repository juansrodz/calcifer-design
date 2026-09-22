import { createElement } from 'react';
import { act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createDeferredRoot } from './deferred-root';

// These containers are appended by hand rather than by `render()`, so Testing Library's own
// cleanup never sees them; without this they accumulate in `document.body` across the file.
const containers: HTMLElement[] = [];

function mountedContainer(): HTMLElement {
  const container = document.createElement('div');
  document.body.append(container);
  containers.push(container);
  return container;
}

afterEach(() => {
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

describe('createDeferredRoot', () => {
  it('renders into its container like a normal root', async () => {
    const container = mountedContainer();
    const root = createDeferredRoot(container);
    act(() => root.render(createElement('p', null, 'mounted')));
    expect(container.textContent).toBe('mounted');

    // The queued unmount is a real React update. Awaiting it inside `act()` is what keeps it
    // from running after this test body has returned, where React reports it as an update "not
    // wrapped in act(...)" — a warning printed on every run, attributed to whatever test the
    // microtask happened to land in.
    await act(async () => {
      root.unmount();
      await Promise.resolve();
    });
  });

  it('defers unmount past the current task, so it never lands inside a host commit', async () => {
    const container = mountedContainer();
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
