import { useLayoutEffect, useState, type RefObject } from 'react';

export interface GridMetrics {
  viewportHeight: number;
  /** The sticky header band, which covers the top of the scroll area. */
  headerHeight: number;
  /**
   * The computed direction is right to left, whether a `dir` attribute or a stylesheet set it. Read
   * when the grid mounts and when it resizes, not on every render.
   */
  rightToLeft: boolean;
}

const initialMetrics: GridMetrics = { viewportHeight: 0, headerHeight: 0, rightToLeft: false };

/** The scroll area's height and the header band's, kept current as either resizes. */
export function useGridMetrics(
  scrollRef: RefObject<HTMLElement | null>,
  headRef: RefObject<HTMLElement | null>,
): GridMetrics {
  const [metrics, setMetrics] = useState<GridMetrics>(initialMetrics);
  useLayoutEffect(() => {
    const scrollElement = scrollRef.current;
    const head = headRef.current;
    if (scrollElement === null || head === null) return;
    const measure = () => {
      const viewportHeight = scrollElement.clientHeight;
      const headerHeight = head.offsetHeight;
      const rightToLeft = getComputedStyle(scrollElement).direction === 'rtl';
      setMetrics((current) =>
        current.viewportHeight === viewportHeight &&
        current.headerHeight === headerHeight &&
        current.rightToLeft === rightToLeft
          ? current
          : { viewportHeight, headerHeight, rightToLeft },
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
