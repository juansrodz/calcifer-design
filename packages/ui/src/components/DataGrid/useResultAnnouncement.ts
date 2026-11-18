import { useEffect, useRef, useState } from 'react';
import { useLatest } from './useLatest';

/**
 * How long the rows must stay settled after a change to the search or the filters before their
 * count is announced. It runs after the search's and the text filters' own delays, so a burst of
 * typing with pauses long enough to commit each part still ends in one announcement, and so the
 * announcement does not cut into a screen reader still echoing the keys.
 */
export const resultAnnouncementDelayMs = 500;

export interface UseResultAnnouncementOptions {
  /**
   * The rows on screen do not answer the latest change yet: they are loading, the app has not
   * passed them, or a controlled query has not been acted on. The wait starts once this clears.
   */
  waiting: boolean;
  /**
   * The grid shows a state of its own (loading, empty, filtered-empty, a failed first page). The
   * region speaks the state's message instead, so the count is dropped, and a count already
   * announced is cleared, or it would be spoken again when the state goes.
   */
  silenced: boolean;
  /** The announcement for the rows on screen, read when it is made. */
  message: () => string;
}

export interface ResultAnnouncement {
  /** The live region's text, unless a state's message takes its place. */
  text: string;
  /** The search or the filters changed: announce the rows they find, once they settle. */
  announceResults: () => void;
}

/**
 * The count of rows a change to the search or the filters found, for the grid's live region: once
 * per settled change, not on the first render, not for rows the app adds or replaces under the
 * same query (pages loaded as the user scrolls, a refresh) and not for a sort.
 */
export function useResultAnnouncement({
  waiting,
  silenced,
  message,
}: UseResultAnnouncementOptions): ResultAnnouncement {
  const [text, setText] = useState('');
  // Which change is waiting to be announced, if any. Each change has a number of its own, so a
  // new one starts the wait again.
  const [pendingChange, setPendingChange] = useState<number | null>(null);
  const changeCountRef = useRef(0);
  const messageRef = useLatest(message);
  const silencedRef = useLatest(silenced);

  if (silenced && text !== '') setText('');

  useEffect(() => {
    if (pendingChange === null || waiting) return;
    const timer = setTimeout(() => {
      setPendingChange(null);
      // A guard only: the render-time clear above would empty a count set while silenced anyway.
      if (!silencedRef.current) setText(messageRef.current());
    }, resultAnnouncementDelayMs);
    return () => clearTimeout(timer);
  }, [pendingChange, waiting, messageRef, silencedRef]);

  const announceResults = () => {
    changeCountRef.current += 1;
    // Cleared at once: a live region speaks only when its text changes, so the same words for the
    // new rows must follow an empty region to be heard again.
    setText('');
    setPendingChange(changeCountRef.current);
  };

  return { text, announceResults };
}
