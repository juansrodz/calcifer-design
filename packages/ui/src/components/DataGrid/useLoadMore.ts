import { useEffect, useEffectEvent, useRef } from 'react';

export interface UseLoadMoreOptions {
  /** False outside server mode, and while something else (a first load, a pending query) rules. */
  enabled: boolean;
  /** The rows loaded so far. */
  loadedCount: number;
  /** The row at the end of what the user can see, as a place in the loaded rows; -1 if none. */
  lastRenderedIndex: number;
  /** How many rows from the end of the loaded rows counts as near it. */
  threshold: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadError: string | undefined;
  onLoadMore: (() => void) | undefined;
}

export interface LoadMore {
  /** The retry button: asks again at once, though the guard has already asked at this count. */
  retry: () => void;
  /** Forgets what was asked, for rows that start again from the first page. */
  reset: () => void;
}

/**
 * Asks for the next page when the user is near the end of the loaded rows, or when the loaded rows
 * do not fill the view. It asks once per loaded count: a load that adds nothing is not asked for
 * again until the count changes or the user retries, so an empty answer cannot make a loop.
 * Auto-loading pauses while there is a load error.
 */
export function useLoadMore({
  enabled,
  loadedCount,
  lastRenderedIndex,
  threshold,
  hasMore,
  loadingMore,
  loadError,
  onLoadMore,
}: UseLoadMoreOptions): LoadMore {
  // The loaded count at the last request.
  const requestedCountRef = useRef<number | null>(null);
  const request = () => {
    requestedCountRef.current = loadedCount;
    onLoadMore?.();
  };
  const requestFromEffect = useEffectEvent(request);

  const nearEnd = loadedCount - 1 - lastRenderedIndex <= threshold;
  useEffect(() => {
    if (!enabled || !hasMore || loadingMore || loadError !== undefined || !nearEnd) return;
    if (requestedCountRef.current === loadedCount) return;
    requestFromEffect();
  }, [enabled, hasMore, loadingMore, loadError, nearEnd, loadedCount]);

  return {
    retry: request,
    reset: () => {
      requestedCountRef.current = null;
    },
  };
}
