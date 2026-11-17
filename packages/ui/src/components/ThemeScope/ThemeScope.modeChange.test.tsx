import { composeStories } from '@storybook/react';
import { act, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useLayoutEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { installMatchMedia } from '../../../test/matchMedia';
import { THEME_CHANGING_ATTRIBUTE } from '../../utils/suppressTransitions';
import { demoTheme } from './fixtures';
import { ThemeScope, type ThemeMode } from './ThemeScope';
import * as stories from './ThemeScope.stories';

const { ModeSwitch } = composeStories(stories);

// The frame of a mode change: text that transitions `color` (NavMenu's links, Segmented, the icon
// buttons) would fade over `--motion-duration-1` while the surface behind it flips at once, a
// window of low contrast. jsdom runs no transitions, so this pins that the scope marks itself for
// that frame and that its sheet holds every transition beneath the mark still; the browser check
// in the release report measures a NavMenu link's colour in the first frame.

let queuedFrames: FrameRequestCallback[];

function runOneFrame(): void {
  const callbacks = queuedFrames;
  queuedFrames = [];
  for (const callback of callbacks) callback(performance.now());
}

beforeEach(() => {
  queuedFrames = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    queuedFrames.push(callback);
    return queuedFrames.length;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** The scope's wrapper: the element that carries the theme class and `data-theme`. */
function wrapperOf(container: HTMLElement): HTMLElement {
  const wrapper = container.querySelector<HTMLElement>('.theme-demo');
  if (wrapper === null) throw new Error('no scope wrapper rendered');
  return wrapper;
}

describe('ThemeScope across a mode change', () => {
  it('the ModeSwitch story has no axe violations', async () => {
    // NavMenu asks for the desktop width, so its links render inline.
    installMatchMedia(true);
    render(<ModeSwitch />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('marks nothing on its first render', () => {
    const { container } = render(
      <ThemeScope theme={demoTheme} mode="light">
        <a href="/">Home</a>
      </ThemeScope>,
    );
    expect(wrapperOf(container)).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it.each<[ThemeMode | undefined, ThemeMode | undefined]>([
    ['light', 'dark'],
    ['dark', 'light'],
    ['dark', undefined],
    [undefined, 'light'],
  ])('holds transitions still for the frame of %s to %s', (fromMode, toMode) => {
    const { container, rerender } = render(
      <ThemeScope theme={demoTheme} mode={fromMode}>
        <a href="/">Home</a>
      </ThemeScope>,
    );
    rerender(
      <ThemeScope theme={demoTheme} mode={toMode}>
        <a href="/">Home</a>
      </ThemeScope>,
    );
    const wrapper = wrapperOf(container);
    expect(wrapper).toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
    act(runOneFrame);
    expect(wrapper).toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
    act(runOneFrame);
    expect(wrapper).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it('marks the wrapper in a layout effect, before the browser can paint the new mode', () => {
    // A parent's layout effect runs after the scope's own and before any passive effect. A mark
    // set in a passive effect would be missing here, and on a default-lane update (an appearance
    // read from storage, a transition) the browser could paint the new `data-theme` without it.
    const seenByParent: { theme: string | null; marked: boolean }[] = [];
    function Parent({ mode }: { mode: ThemeMode }) {
      const probeRef = useRef<HTMLSpanElement>(null);
      useLayoutEffect(() => {
        const wrapper = probeRef.current?.closest('.theme-demo');
        seenByParent.push({
          theme: wrapper?.getAttribute('data-theme') ?? null,
          marked: wrapper?.hasAttribute(THEME_CHANGING_ATTRIBUTE) ?? false,
        });
      });
      return (
        <ThemeScope theme={demoTheme} mode={mode}>
          <span ref={probeRef} />
        </ThemeScope>
      );
    }
    const { rerender } = render(<Parent mode="light" />);
    rerender(<Parent mode="dark" />);
    expect(seenByParent).toEqual([
      { theme: 'light', marked: false },
      { theme: 'dark', marked: true },
    ]);
  });

  it('marks nothing when it re-renders in the same mode', () => {
    const { container, rerender } = render(
      <ThemeScope theme={demoTheme} mode="dark">
        <a href="/">Home</a>
      </ThemeScope>,
    );
    rerender(
      <ThemeScope theme={demoTheme} mode="dark" className="layout">
        <a href="/">Home</a>
      </ThemeScope>,
    );
    expect(wrapperOf(container)).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it('drops the mark if it unmounts inside the frame', () => {
    const { container, rerender, unmount } = render(
      <ThemeScope theme={demoTheme} mode="light">
        <a href="/">Home</a>
      </ThemeScope>,
    );
    rerender(
      <ThemeScope theme={demoTheme} mode="dark">
        <a href="/">Home</a>
      </ThemeScope>,
    );
    const wrapper = wrapperOf(container);
    unmount();
    expect(wrapper).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });
});

describe('the sheet under the mark', () => {
  const stylesheet = readFileSync(join(import.meta.dirname, 'ThemeScope.module.css'), 'utf-8');

  it('turns every transition in the scope off, its pseudo-elements and portals included', () => {
    // `:where()` keeps the attribute out of the class the CSS Modules build hashes: with
    // `.root[data-theme-changing]` the build left `:local(.root)` unhashed in the `@scope` prelude.
    const rule = stylesheet.match(
      /^@scope \(\.root:where\(\[data-theme-changing\]\)\) to \(\.root\) \{\n {2}:scope,\n {2}\*,\n {2}\*::before,\n {2}\*::after \{([^}]*)\}\n\}/m,
    );
    expect(rule?.[1]?.trim()).toBe('transition: none !important;');
  });

  it('stops at a nested scope, whose mode never follows this one', () => {
    // A nested scope sets its whole colour set from its own pin, `<html>` or the OS, so a parent's
    // change moves nothing in it, and its in-flight transitions should run on. The `to (.root)`
    // limit above leaves it out; no rule may reach every descendant of the mark.
    expect(stylesheet).not.toMatch(/\.root\[data-theme-changing\] \*/);
  });
});
