import { beforeEach, vi } from 'vitest';

/**
 * Replaces `requestAnimationFrame` and `cancelAnimationFrame` before each test in the calling
 * file or `describe` block with a queue the test advances by hand, so the test decides when a
 * frame passes. Call it where a `beforeEach` could go; the spies are restored by the file's own
 * `vi.restoreAllMocks()`.
 */
export function installManualAnimationFrames() {
  const queuedFrames = new Map<number, FrameRequestCallback>();
  let nextFrameHandle = 1;

  beforeEach(() => {
    queuedFrames.clear();
    nextFrameHandle = 1;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const handle = nextFrameHandle++;
      queuedFrames.set(handle, callback);
      return handle;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle) => {
      queuedFrames.delete(handle);
    });
  });

  /** Runs the frames queued so far; a frame they request waits for the next call. */
  function runOneFrame(): void {
    const callbacks = [...queuedFrames.values()];
    queuedFrames.clear();
    for (const callback of callbacks) callback(performance.now());
  }

  return { queuedFrames, runOneFrame };
}
