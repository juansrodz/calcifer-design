import { useLayoutEffect, useState, type RefObject } from 'react';

export interface GridMetrics {
  viewportHeight: number;
  /** The sticky header band, which covers the top of the scroll area. */
  headerHeight: number;
}

/** The scroll area's height and the header band's, kept current as either resizes. */
export function useGridMetrics(
  scrollRef: RefObject<HTMLElement | null>,
  headRef: RefObject<HTMLElement | null>,
): GridMetrics {
  const [metrics, setMetrics] = useState<GridMetrics>({ viewportHeight: 0, headerHeight: 0 });
  useLayoutEffect(() => {
    const scrollElement = scrollRef.current;
    const head = headRef.current;
    if (scrollElement === null || head === null) return;
    const measure = () => {
      const viewportHeight = scrollElement.clientHeight;
      const headerHeight = head.offsetHeight;
      setMetrics((current) =>
        current.viewportHeight === viewportHeight && current.headerHeight === headerHeight
          ? current
          : { viewportHeight, headerHeight },
      );
    };
    measure();
    // Without a ResizeObserver (a bare jsdom) the size is read once and never follows.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(scrollElement);
    observer.observe(head);
    return () => observer.disconnect();
  }, [scrollRef, headRef]);
  return metrics;
}
