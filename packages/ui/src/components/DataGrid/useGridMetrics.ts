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

/**
 * The scroll area's inner width, what the body shows of a table that can be wider. Set on the
 * scroll area itself once measured, and read by the state and error rows' content in the
 * stylesheet, so a width-only resize re-renders nothing.
 */
const viewInlineSizeProperty = '--data-grid-view-inline-size';

const initialMetrics: GridMetrics = {
  viewportHeight: 0,
  headerHeight: 0,
  rightToLeft: false,
};

/**
 * The scroll area's height and the header band's height, kept current as either resizes, and the
 * scroll area's width, kept current in `viewInlineSizeProperty`.
 */
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
      const viewportWidth = scrollElement.clientWidth;
      const headerHeight = head.offsetHeight;
      const rightToLeft = getComputedStyle(scrollElement).direction === 'rtl';
      // Unmeasured (0), the property stays unset and the content has no maximum.
      if (viewportWidth > 0) {
        scrollElement.style.setProperty(viewInlineSizeProperty, `${viewportWidth}px`);
      } else {
        scrollElement.style.removeProperty(viewInlineSizeProperty);
      }
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
