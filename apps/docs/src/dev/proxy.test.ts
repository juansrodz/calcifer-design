import { describe, expect, it } from 'vitest';
import { DEV_PORTS, devProxy } from './proxy';

describe('devProxy', () => {
  it('sends /storybook to the Storybook dev server, which serves its index at the root', () => {
    expect(devProxy()).toEqual({
      '/storybook': {
        target: `http://localhost:${DEV_PORTS.storybook}`,
        pathRewrite: { '^/storybook': '' },
      },
    });
  });

  it('takes an override, so a second Storybook on another port needs no code change', () => {
    expect(devProxy({ storybook: 7007 })['/storybook']?.target).toBe('http://localhost:7007');
  });

  it('keeps the ports this workspace and the portfolio shell agree on', () => {
    expect(DEV_PORTS).toEqual({ docs: 3002, storybook: 6006 });
  });
});
