import { useEffect, useRef } from 'react';
import { useLatest } from './useLatest';

export interface UseLoadMoreOptions {
  /** False outside server mode, and while a pending query rules. */
  enabled: boolean;
  /** A first load or a reload: the rows start again, so nothing is asked and what was is forgotten. */
  loading: boolean;
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
 * Auto-loading pauses while there is a load error. A failed load does not count as asked, and
 * neither does anything asked before a reload, so the grid asks again once the error clears.
 */
export function useLoadMore({
  enabled,
  loading,
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
  const requestRef = useLatest(request);

  const failed = loadError !== undefined;
  // Declared before the request below, so that it forgets first when both run in one commit.
  useEffect(() => {
    if (failed || loading) requestedCountRef.current = null;
  }, [failed, loading]);

  const nearEnd = loadedCount - 1 - lastRenderedIndex <= threshold;
  useEffect(() => {
    if (!enabled || loading || !hasMore || loadingMore || failed || !nearEnd) return;
    if (requestedCountRef.current === loadedCount) return;
    requestRef.current();
  }, [enabled, loading, hasMore, loadingMore, failed, nearEnd, loadedCount, requestRef]);

  return {
    retry: request,
    reset: () => {
      requestedCountRef.current = null;
    },
  };
}
