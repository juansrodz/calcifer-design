import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installMatchMedia } from '../../test/matchMedia';
import { minWidth, useMediaQuery } from './useMediaQuery';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('minWidth', () => {
  it('builds a min-width query from the breakpoint scale', () => {
    expect(minWidth('md')).toBe('(min-width: 48rem)');
  });
});

describe('useMediaQuery', () => {
  it('returns the current match', () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery(minWidth('md')));
    expect(result.current).toBe(true);
  });

  it('updates when the query changes', () => {
    const setMatches = installMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery(minWidth('md')));
    expect(result.current).toBe(false);
    act(() => setMatches(true));
    expect(result.current).toBe(true);
  });
});
