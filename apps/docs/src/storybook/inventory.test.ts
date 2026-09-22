import { describe, expect, it } from 'vitest';
import {
  parseStorybookIndex,
  storybookIndexUrl,
  storybookStoryUrl,
  summarizeInventory,
} from './inventory';

// Shaped exactly like packages/ui/storybook-static/index.json, which is v5: every field below
// is present in the real file, and no other field is used here.
const index = {
  // eslint-disable-next-line id-length -- Storybook's index schema names its version field "v"
  v: 5,
  entries: {
    'overlays-dialog--center': {
      type: 'story',
      id: 'overlays-dialog--center',
      name: 'Center',
      title: 'Overlays/Dialog',
      importPath: './src/components/Dialog/Dialog.stories.tsx',
      componentPath: './src/components/Dialog/Dialog.tsx',
      exportName: 'Center',
    },
    'overlays-dialog--sheet': {
      type: 'story',
      id: 'overlays-dialog--sheet',
      name: 'Sheet',
      title: 'Overlays/Dialog',
      importPath: './src/components/Dialog/Dialog.stories.tsx',
      componentPath: './src/components/Dialog/Dialog.tsx',
      exportName: 'Sheet',
    },
    'primitives-alert--info': {
      type: 'story',
      id: 'primitives-alert--info',
      name: 'Info',
      title: 'Primitives/Alert',
      importPath: './src/components/Alert/Alert.stories.tsx',
      componentPath: './src/components/Alert/Alert.tsx',
      exportName: 'Info',
    },
  },
};

describe('parseStorybookIndex', () => {
  it('accepts the shape Storybook 10 writes', () => {
    expect(parseStorybookIndex(index).v).toBe(5);
  });

  it('refuses anything else, by name, rather than rendering undefined', () => {
    expect(() => parseStorybookIndex(null)).toThrow(/not a Storybook index/);
    // eslint-disable-next-line id-length -- Storybook's index schema names its version field "v"
    expect(() => parseStorybookIndex({ v: 5 })).toThrow(/not a Storybook index/);
    // eslint-disable-next-line id-length -- Storybook's index schema names its version field "v"
    expect(() => parseStorybookIndex({ v: 5, entries: { bad: { id: 'bad' } } })).toThrow(
      /entry "bad"/,
    );
    // eslint-disable-next-line id-length -- Storybook's index schema names its version field "v"
    expect(() => parseStorybookIndex({ v: 5, entries: [] })).toThrow(/not a Storybook index/);
  });
});

describe('summarizeInventory', () => {
  it('counts story groups, not stories, and keeps them in group order', () => {
    expect(summarizeInventory(parseStorybookIndex(index))).toEqual([
      {
        title: 'Overlays/Dialog',
        group: 'Overlays',
        name: 'Dialog',
        storyCount: 2,
        firstStoryId: 'overlays-dialog--center',
      },
      {
        title: 'Primitives/Alert',
        group: 'Primitives',
        name: 'Alert',
        storyCount: 1,
        firstStoryId: 'primitives-alert--info',
      },
    ]);
  });

  it('ignores an entry that is not a story, because only stories have a deep link', () => {
    const withDocs = {
      // eslint-disable-next-line id-length -- Storybook's index schema names its version field "v"
      v: 5,
      entries: {
        ...index.entries,
        'primitives-alert--docs': {
          type: 'docs',
          id: 'primitives-alert--docs',
          name: 'Docs',
          title: 'Primitives/Alert',
          importPath: './src/components/Alert/Alert.mdx',
        },
      },
    };
    const alert = summarizeInventory(parseStorybookIndex(withDocs)).find(
      (storyGroup) => storyGroup.name === 'Alert',
    );
    expect(alert?.storyCount).toBe(1);
  });
});

describe('the URLs', () => {
  it('builds the index URL from the base, with exactly one slash', () => {
    expect(storybookIndexUrl('/storybook')).toBe('/storybook/index.json');
    expect(storybookIndexUrl('/storybook/')).toBe('/storybook/index.json');
    expect(storybookIndexUrl('http://localhost:6006')).toBe('http://localhost:6006/index.json');
  });

  it('deep-links a story the way the Storybook manager reads the URL', () => {
    expect(storybookStoryUrl('overlays-dialog--center', '/storybook')).toBe(
      '/storybook/?path=/story/overlays-dialog--center',
    );
  });
});
