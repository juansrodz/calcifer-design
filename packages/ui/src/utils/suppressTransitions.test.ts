import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_CHANGING_ATTRIBUTE, suppressTransitionsForAFrame } from './suppressTransitions';

// jsdom runs no transitions, so this pins the mechanism: the mark goes on, a style read happens
// while it is on, and it comes off only once the frame of the change has been drawn. The browser
// check in the release report (and the `ModeSwitch` story's play) shows the effect itself.

/** Frames queued by the code under test, run by hand so the test decides when a frame passes. */
let queuedFrames: Map<number, FrameRequestCallback>;
let nextFrameHandle: number;

function runOneFrame(): void {
  const callbacks = [...queuedFrames.values()];
  queuedFrames.clear();
  for (const callback of callbacks) callback(performance.now());
}

beforeEach(() => {
  queuedFrames = new Map();
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('suppressTransitionsForAFrame', () => {
  it('marks the element at once', () => {
    const element = document.createElement('div');
    suppressTransitionsForAFrame(element);
    expect(element).toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it('reads the element’s computed style while marked, so the new values land with no transition', () => {
    const element = document.createElement('div');
    const markedAtRead: boolean[] = [];
    const originalGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((target, pseudo) => {
      if (target === element) markedAtRead.push(element.hasAttribute(THEME_CHANGING_ATTRIBUTE));
      return originalGetComputedStyle(target, pseudo);
    });
    suppressTransitionsForAFrame(element);
    expect(markedAtRead).toEqual([true]);
  });

  it('keeps the mark through the next frame and drops it in the one after', () => {
    const element = document.createElement('div');
    suppressTransitionsForAFrame(element);
    runOneFrame();
    expect(element).toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
    runOneFrame();
    expect(element).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
    expect(queuedFrames.size).toBe(0);
  });

  it('drops the mark at once when released early, and leaves no frame queued', () => {
    const element = document.createElement('div');
    const release = suppressTransitionsForAFrame(element);
    runOneFrame();
    release();
    expect(element).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
    expect(queuedFrames.size).toBe(0);
  });
});
