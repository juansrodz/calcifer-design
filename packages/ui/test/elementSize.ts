interface ElementSizeOptions {
  viewportHeight: number;
  rowHeight: number;
}

const viewportWidth = 800;

function isGridScroll(element: Element): boolean {
  return element.hasAttribute('data-grid-scroll');
}

function isGridRow(element: Element): boolean {
  return element.tagName === 'TR';
}

/**
 * jsdom does no layout, so a virtualiser measures nothing and renders no rows. This stubs the
 * measurements it reads: `[data-grid-scroll]` is `viewportHeight` tall and every `tr` is
 * `rowHeight` tall. Returns a function that puts everything back.
 */
export function installElementSize({ viewportHeight, rowHeight }: ElementSizeOptions): () => void {
  const elementPrototype = HTMLElement.prototype;
  const originals = {
    clientHeight: Object.getOwnPropertyDescriptor(elementPrototype, 'clientHeight'),
    clientWidth: Object.getOwnPropertyDescriptor(elementPrototype, 'clientWidth'),
    offsetHeight: Object.getOwnPropertyDescriptor(elementPrototype, 'offsetHeight'),
    getBoundingClientRect: elementPrototype.getBoundingClientRect,
  };

  function heightOf(element: Element): number {
    if (isGridScroll(element)) return viewportHeight;
    if (isGridRow(element)) return rowHeight;
    return 0;
  }

  Object.defineProperty(elementPrototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isGridScroll(this) ? viewportHeight : 0;
    },
  });
  Object.defineProperty(elementPrototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return isGridScroll(this) ? viewportWidth : 0;
    },
  });
  Object.defineProperty(elementPrototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return heightOf(this);
    },
  });
  elementPrototype.getBoundingClientRect = function getBoundingClientRect(this: HTMLElement) {
    const height = heightOf(this);
    const width = isGridScroll(this) ? viewportWidth : 0;
    return {
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => ({}),
    } as DOMRect;
  };

  const hadResizeObserver = 'ResizeObserver' in globalThis;
  if (!hadResizeObserver) {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = ResizeObserverStub;
  }

  return function restore() {
    for (const property of ['clientHeight', 'clientWidth', 'offsetHeight'] as const) {
      const original = originals[property];
      if (original) Object.defineProperty(elementPrototype, property, original);
      else delete (elementPrototype as unknown as Record<string, unknown>)[property];
    }
    elementPrototype.getBoundingClientRect = originals.getBoundingClientRect;
    if (!hadResizeObserver) delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  };
}
