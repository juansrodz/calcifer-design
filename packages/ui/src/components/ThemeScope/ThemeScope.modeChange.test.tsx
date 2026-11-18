import { composeStories } from '@storybook/react';
import { act, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useLayoutEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installManualAnimationFrames } from '../../../test/animationFrames';
import { axeDocument } from '../../../test/axe';
import { installMatchMedia } from '../../../test/matchMedia';
import { THEME_CHANGING_ATTRIBUTE } from '../../utils/suppressTransitions';
import { demoTheme } from './fixtures';
import { ThemeScope, type ThemeMode } from './ThemeScope';
import * as stories from './ThemeScope.stories';

const { ModeSwitch, FollowsThePage } = composeStories(stories);

// The frame of a mode change: text that transitions `color` (NavMenu's links, Segmented, the icon
// buttons) would fade over `--motion-duration-1` while the surface behind it flips at once, a
// window of low contrast. jsdom runs no transitions, so this pins that the scope marks itself for
// that frame and that its sheet holds every transition beneath the mark still; the browser check
// in the release report measures a NavMenu link's colour in the first frame.

const { runOneFrame } = installManualAnimationFrames();

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
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
  it.each([
    ['ModeSwitch', ModeSwitch],
    ['FollowsThePage', FollowsThePage],
  ])('the %s story has no axe violations', async (_name, Story) => {
    // NavMenu asks for the desktop width, so its links render inline.
    installMatchMedia(true);
    render(<Story />);
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

describe('an unpinned ThemeScope across a change of the page’s mode', () => {
  // Unpinned, the scope's mode comes from `<html>`'s `data-theme` and then the OS, which change
  // without any render of the scope: a host page's own toggle, or the OS switching at dusk.

  /** Sets `<html>`'s `data-theme` and lets the mutation observers run. */
  async function setDocumentTheme(theme: ThemeMode): Promise<void> {
    await act(async () => {
      document.documentElement.dataset['theme'] = theme;
      await Promise.resolve();
    });
  }

  function renderUnpinned() {
    return render(
      <ThemeScope theme={demoTheme}>
        <a href="/">Home</a>
      </ThemeScope>,
    );
  }

  it('holds transitions still for the frame in which the OS colour scheme changes', () => {
    const setPrefersDark = installMatchMedia(false);
    const { container } = renderUnpinned();
    const wrapper = wrapperOf(container);
    expect(wrapper).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
    act(() => setPrefersDark(true));
    expect(wrapper).toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
    act(runOneFrame);
    act(runOneFrame);
    expect(wrapper).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it('holds transitions still for the frame in which <html>’s data-theme changes', async () => {
    installMatchMedia(false);
    const { container } = renderUnpinned();
    const wrapper = wrapperOf(container);
    await setDocumentTheme('dark');
    expect(wrapper).toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
    act(runOneFrame);
    act(runOneFrame);
    expect(wrapper).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it('marks nothing when <html> is given the data-theme it already has', async () => {
    installMatchMedia(false);
    document.documentElement.dataset['theme'] = 'dark';
    const { container } = renderUnpinned();
    await setDocumentTheme('dark');
    expect(wrapperOf(container)).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it('follows <html> where there is no matchMedia, as in a test environment', async () => {
    vi.stubGlobal('matchMedia', undefined);
    const { container } = renderUnpinned();
    await setDocumentTheme('dark');
    expect(wrapperOf(container)).toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it('leaves the page’s mode alone while pinned', async () => {
    const setPrefersDark = installMatchMedia(false);
    const { container } = render(
      <ThemeScope theme={demoTheme} mode="light">
        <a href="/">Home</a>
      </ThemeScope>,
    );
    act(() => setPrefersDark(true));
    await setDocumentTheme('dark');
    expect(wrapperOf(container)).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it('stops listening once a mode is pinned', async () => {
    const setPrefersDark = installMatchMedia(false);
    const { container, rerender } = renderUnpinned();
    rerender(
      <ThemeScope theme={demoTheme} mode="dark">
        <a href="/">Home</a>
      </ThemeScope>,
    );
    const wrapper = wrapperOf(container);
    act(runOneFrame);
    act(runOneFrame);
    expect(wrapper).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
    act(() => setPrefersDark(true));
    await setDocumentTheme('dark');
    expect(wrapper).not.toHaveAttribute(THEME_CHANGING_ATTRIBUTE);
  });

  it('stops listening when it unmounts', async () => {
    const setPrefersDark = installMatchMedia(false);
    const { container, unmount } = renderUnpinned();
    const wrapper = wrapperOf(container);
    unmount();
    act(() => setPrefersDark(true));
    await setDocumentTheme('dark');
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
