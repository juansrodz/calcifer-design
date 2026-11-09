import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLatest } from './useLatest';

export interface DebouncedDraft {
  draft: string;
  /** Sets the draft and commits it after the delay. */
  change: (value: string) => void;
  /** Commits a pending change now, cancelling its timer. Does nothing when none is pending. */
  flush: () => void;
  /** Sets the draft and commits it now. */
  commitNow: (value: string) => void;
}

interface PendingCommit {
  value: string;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * A typed value that commits after `delayMs` of quiet. When `committed` changes to something this
 * hook did not commit (the query was reset elsewhere), the pending commit is cancelled and the draft
 * takes the new value. A pending commit is flushed on unmount.
 *
 * What this hook committed may come back changed: the grid's query holds text trimmed, so "hex "
 * comes back as "hex". That echo leaves the draft alone, or the space the user just typed would
 * vanish under their cursor.
 */
export function useDebouncedDraft(
  committed: string,
  commit: (value: string) => void,
  delayMs: number,
): DebouncedDraft {
  const [draft, setDraft] = useState(committed);
  const pendingRef = useRef<PendingCommit | null>(null);
  // The value last committed, by this hook or by the outside, to tell an echo from a reset.
  const lastCommittedRef = useRef(committed);
  const commitRef = useLatest(commit);

  const cancelPending = useCallback(() => {
    if (pendingRef.current) clearTimeout(pendingRef.current.timer);
    pendingRef.current = null;
  }, []);

  const commitValue = useCallback(
    (value: string) => {
      lastCommittedRef.current = value;
      commitRef.current(value);
    },
    [commitRef],
  );

  useLayoutEffect(() => {
    const lastCommitted = lastCommittedRef.current;
    if (committed === lastCommitted || committed === lastCommitted.trim()) return;
    cancelPending();
    lastCommittedRef.current = committed;
    setDraft(committed);
  }, [committed, cancelPending]);

  // Unmounting commits what is still waiting, so closing a field never loses what was typed in it.
  useEffect(
    () => () => {
      const pending = pendingRef.current;
      if (!pending) return;
      clearTimeout(pending.timer);
      pendingRef.current = null;
      commitValue(pending.value);
    },
    [commitValue],
  );

  const change = useCallback(
    (value: string) => {
      setDraft(value);
      cancelPending();
      const timer = setTimeout(() => {
        pendingRef.current = null;
        commitValue(value);
      }, delayMs);
      pendingRef.current = { value, timer };
    },
    [cancelPending, commitValue, delayMs],
  );

  const flush = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    cancelPending();
    commitValue(pending.value);
  }, [cancelPending, commitValue]);

  const commitNow = useCallback(
    (value: string) => {
      setDraft(value);
      cancelPending();
      commitValue(value);
    },
    [cancelPending, commitValue],
  );

  return { draft, change, flush, commitNow };
}
