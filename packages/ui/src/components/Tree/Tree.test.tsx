import { composeStories } from '@storybook/react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Tree, type TreeItem, type TreeProps } from './Tree';
import * as stories from './Tree.stories';

const allStories = composeStories(stories);

const items: TreeItem[] = [
  {
    id: 'guides',
    label: 'Guides',
    children: [
      { id: 'install', label: 'Installing' },
      {
        id: 'themes',
        label: 'Themes',
        children: [
          { id: 'light', label: 'Light theme' },
          { id: 'dark', label: 'Dark theme' },
        ],
      },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    children: [
      { id: 'tokens', label: 'Tokens' },
      { id: 'legacy', label: 'Legacy tokens', disabled: true },
    ],
  },
  { id: 'changelog', label: 'Changelog' },
];

const everyParent = ['guides', 'themes', 'reference'];

function renderTree(props: Partial<TreeProps> = {}) {
  return render(<Tree items={items} aria-label="Documentation" {...(props as object)} />);
}

function node(name: string) {
  return screen.getByRole('treeitem', { name });
}

function queryNode(name: string) {
  return screen.queryByRole('treeitem', { name });
}

function row(name: string) {
  return within(node(name)).getByText(name);
}

function tabStops() {
  return screen
    .getAllByRole('treeitem')
    .filter((item) => item.tabIndex === 0)
    .map(
      (item) => document.getElementById(item.getAttribute('aria-labelledby') ?? '')?.textContent,
    );
}

function focusIsOn(name: string) {
  expect(document.activeElement).toBe(node(name));
}

async function focusTree() {
  await userEvent.tab();
}

afterEach(() => {
  document.documentElement.removeAttribute('dir');
});

describe('Tree', () => {
  it.each(Object.entries(allStories))('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  describe('roles and states', () => {
    it('is a named tree of treeitems, with groups holding the open branches', () => {
      renderTree({ defaultExpandedIds: ['guides'] });
      const tree = screen.getByRole('tree', { name: 'Documentation' });
      expect(tree).toBeVisible();
      expect(within(tree).getAllByRole('group')).toHaveLength(1);
      expect(within(screen.getByRole('group')).getAllByRole('treeitem')).toHaveLength(2);
    });

    it('takes aria-labelledby in place of aria-label', () => {
      render(
        <>
          <h2 id="heading">Docs</h2>
          <Tree items={items} aria-labelledby="heading" />
        </>,
      );
      expect(screen.getByRole('tree', { name: 'Docs' })).toBeVisible();
    });

    it('requires a name in its type', () => {
      // @ts-expect-error One of `aria-label` and `aria-labelledby` is required.
      render(<Tree items={items} />);
      expect(screen.getByRole('tree')).toBeVisible();
    });

    it('names a parent by its own label, not by the labels of what it holds', () => {
      renderTree({ defaultExpandedIds: ['guides'] });
      expect(node('Guides')).toHaveAccessibleName('Guides');
    });

    it('puts aria-expanded on parents only, and never on a childless item', () => {
      renderTree({
        items: [...items, { id: 'empty', label: 'Empty', children: [] }],
        defaultExpandedIds: ['guides'],
      });
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'true');
      expect(node('Reference')).toHaveAttribute('aria-expanded', 'false');
      expect(node('Installing')).not.toHaveAttribute('aria-expanded');
      expect(node('Changelog')).not.toHaveAttribute('aria-expanded');
      expect(node('Empty')).not.toHaveAttribute('aria-expanded');
    });

    it('draws only what is open', () => {
      renderTree({ defaultExpandedIds: ['guides'] });
      expect(queryNode('Installing')).not.toBeNull();
      expect(queryNode('Light theme')).toBeNull();
      expect(queryNode('Tokens')).toBeNull();
    });

    it('marks a disabled item aria-disabled, without inheriting it downwards', () => {
      renderTree({
        items: [
          {
            id: 'locked',
            label: 'Locked',
            disabled: true,
            children: [{ id: 'free', label: 'Free' }],
          },
        ],
        defaultExpandedIds: ['locked'],
      });
      expect(node('Locked')).toHaveAttribute('aria-disabled', 'true');
      expect(node('Free')).not.toHaveAttribute('aria-disabled');
    });

    it('keeps icons out of the name', () => {
      renderTree({
        items: [{ id: 'one', label: 'One', icon: <svg role="img" aria-label="Star" /> }],
      });
      expect(node('One')).toBeVisible();
    });
  });

  describe('aria-selected follows the selection mode', () => {
    it('is absent everywhere with selectionMode none, whatever selectedIds says', () => {
      renderTree({ selectionMode: 'none', selectedIds: ['changelog'] });
      for (const item of screen.getAllByRole('treeitem')) {
        expect(item).not.toHaveAttribute('aria-selected');
      }
      expect(screen.getByRole('tree')).not.toHaveAttribute('aria-multiselectable');
    });

    it('is true on the one chosen item and absent on the rest with single', () => {
      renderTree({ selectionMode: 'single', defaultSelectedIds: ['changelog'] });
      expect(node('Changelog')).toHaveAttribute('aria-selected', 'true');
      expect(node('Guides')).not.toHaveAttribute('aria-selected');
      expect(screen.getByRole('tree')).not.toHaveAttribute('aria-multiselectable');
    });

    it('honours only the first known id with single', () => {
      renderTree({ selectionMode: 'single', selectedIds: ['ghost', 'guides', 'changelog'] });
      expect(node('Guides')).toHaveAttribute('aria-selected', 'true');
      expect(node('Changelog')).not.toHaveAttribute('aria-selected');
    });

    it('is true or false on every selectable item with multiple', () => {
      renderTree({
        selectionMode: 'multiple',
        defaultSelectedIds: ['guides'],
        defaultExpandedIds: ['reference'],
      });
      expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
      expect(node('Guides')).toHaveAttribute('aria-selected', 'true');
      expect(node('Changelog')).toHaveAttribute('aria-selected', 'false');
      // A disabled item cannot be selected, so it says nothing about it.
      expect(node('Legacy tokens')).not.toHaveAttribute('aria-selected');
    });

    it('still shows a disabled item the app selected', () => {
      renderTree({
        selectionMode: 'multiple',
        selectedIds: ['legacy'],
        defaultExpandedIds: ['reference'],
      });
      expect(node('Legacy tokens')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('the tab stop', () => {
    it('is one item, the first enabled one when nothing is selected', () => {
      renderTree({
        items: [
          { id: 'off', label: 'Off', disabled: true },
          { id: 'on', label: 'On' },
        ],
      });
      expect(tabStops()).toEqual(['On']);
    });

    it('is the first item when every item is disabled, since they stay focusable', () => {
      renderTree({
        items: [
          { id: 'off', label: 'Off', disabled: true },
          { id: 'off-too', label: 'Off too', disabled: true },
        ],
      });
      expect(tabStops()).toEqual(['Off']);
    });

    it('lands on the selected item', async () => {
      renderTree({
        selectionMode: 'single',
        defaultSelectedIds: ['changelog'],
        defaultExpandedIds: ['guides'],
      });
      expect(tabStops()).toEqual(['Changelog']);
      await focusTree();
      focusIsOn('Changelog');
    });

    it('lands on the first selected item shown with multiple', () => {
      renderTree({
        selectionMode: 'multiple',
        defaultSelectedIds: ['changelog', 'guides'],
      });
      expect(tabStops()).toEqual(['Guides']);
    });

    it('lands on the nearest open ancestor of a selected item that is collapsed away', () => {
      renderTree({
        selectionMode: 'single',
        defaultSelectedIds: ['light'],
        defaultExpandedIds: ['guides'],
      });
      expect(tabStops()).toEqual(['Themes']);
    });

    it('ignores a selected id no item holds', () => {
      renderTree({ selectionMode: 'single', defaultSelectedIds: ['ghost'] });
      expect(tabStops()).toEqual(['Guides']);
    });

    it('goes back to the selected item once focus has left and come back', async () => {
      render(
        <>
          <Tree
            items={items}
            aria-label="Docs"
            selectionMode="single"
            defaultSelectedIds={['changelog']}
          />
          <button type="button">After</button>
        </>,
      );
      await focusTree();
      await userEvent.keyboard('{Home}');
      focusIsOn('Guides');
      expect(tabStops()).toEqual(['Guides']);
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      expect(tabStops()).toEqual(['Changelog']);
    });

    it('leaves the tree in one Tab, wherever it has moved to', async () => {
      render(
        <>
          <Tree items={items} aria-label="Docs" defaultExpandedIds={['guides']} />
          <button type="button">After</button>
        </>,
      );
      await focusTree();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.tab({ shift: true });
      focusIsOn('Guides');
    });

    it('follows selectedIds changing from outside while focus is elsewhere', () => {
      const { rerender } = render(
        <Tree items={items} aria-label="Docs" selectionMode="single" selectedIds={['guides']} />,
      );
      expect(tabStops()).toEqual(['Guides']);
      rerender(
        <Tree items={items} aria-label="Docs" selectionMode="single" selectedIds={['changelog']} />,
      );
      expect(tabStops()).toEqual(['Changelog']);
      expect(document.body).toHaveFocus();
    });

    it('does not take focus away when selectedIds changes under it', async () => {
      const { rerender } = render(
        <Tree items={items} aria-label="Docs" selectionMode="single" selectedIds={['guides']} />,
      );
      await focusTree();
      await userEvent.keyboard('{ArrowDown}');
      focusIsOn('Reference');
      rerender(
        <Tree items={items} aria-label="Docs" selectionMode="single" selectedIds={['changelog']} />,
      );
      focusIsOn('Reference');
      expect(tabStops()).toEqual(['Reference']);
    });

    it('survives the item holding it being removed while focus is outside', () => {
      const { rerender } = render(
        <Tree items={items} aria-label="Docs" selectionMode="single" selectedIds={['changelog']} />,
      );
      rerender(
        <Tree
          items={items.filter((item) => item.id !== 'changelog')}
          aria-label="Docs"
          selectionMode="single"
          selectedIds={['changelog']}
        />,
      );
      expect(tabStops()).toEqual(['Guides']);
    });

    it('keeps one stop when items arrive late', () => {
      const { rerender } = render(<Tree items={[]} aria-label="Docs" />);
      expect(screen.queryAllByRole('treeitem')).toEqual([]);
      rerender(<Tree items={items} aria-label="Docs" />);
      expect(tabStops()).toEqual(['Guides']);
      expect(screen.getByRole('tree')).toHaveAttribute('data-direction', 'ltr');
    });

    it('draws nothing with no items, since a tree must own its treeitems', async () => {
      const { container } = render(<Tree items={[]} aria-label="Docs" />);
      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByRole('tree')).toBeNull();
      expect(await axeDocument()).toHaveNoViolations();
    });
  });

  describe('where focus goes when its item goes', () => {
    // In a branch that is not the first: the first enabled item is where focus rests with no
    // ancestors to go by, so an ancestor there could not tell the two apart.
    it('moves to the parent when the focused child is removed', async () => {
      const { rerender } = render(
        <Tree items={items} aria-label="Docs" defaultExpandedIds={everyParent} />,
      );
      act(() => node('Tokens').focus());
      focusIsOn('Tokens');
      rerender(
        <Tree
          items={[
            items[0] as TreeItem,
            { ...items[1], children: items[1]?.children?.slice(1) } as TreeItem,
            ...items.slice(2),
          ]}
          aria-label="Docs"
          defaultExpandedIds={everyParent}
        />,
      );
      focusIsOn('Reference');
      expect(tabStops()).toEqual(['Reference']);
    });

    it('moves to the nearest surviving ancestor when a whole branch goes', () => {
      const withBranch = (children: TreeItem[]): TreeItem[] => [
        items[0] as TreeItem,
        { id: 'reference', label: 'Reference', children },
      ];
      const hooks = { id: 'hooks', label: 'Hooks' };
      const { rerender } = render(
        <Tree
          items={withBranch([
            { id: 'tokens', label: 'Tokens' },
            { id: 'api', label: 'API', children: [hooks] },
          ])}
          aria-label="Docs"
          defaultExpandedIds={['reference', 'api']}
        />,
      );
      act(() => node('Hooks').focus());
      focusIsOn('Hooks');
      rerender(
        <Tree
          items={withBranch([{ id: 'tokens', label: 'Tokens' }])}
          aria-label="Docs"
          defaultExpandedIds={['reference', 'api']}
        />,
      );
      focusIsOn('Reference');
    });

    it('moves to the first enabled item when a root item goes', async () => {
      const { rerender } = render(<Tree items={items} aria-label="Docs" />);
      await focusTree();
      await userEvent.keyboard('{End}');
      focusIsOn('Changelog');
      rerender(<Tree items={items.slice(0, 2)} aria-label="Docs" />);
      focusIsOn('Guides');
    });

    it('moves to the parent when the focused child is collapsed away by the app', async () => {
      const { rerender } = render(
        <Tree items={items} aria-label="Docs" expandedIds={['guides', 'themes']} />,
      );
      await focusTree();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      focusIsOn('Light theme');
      rerender(<Tree items={items} aria-label="Docs" expandedIds={['guides']} />);
      focusIsOn('Themes');
      expect(tabStops()).toEqual(['Themes']);
    });

    it('moves past a collapsed grandparent too', async () => {
      const { rerender } = render(
        <Tree items={items} aria-label="Docs" expandedIds={['guides', 'themes']} />,
      );
      await focusTree();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      rerender(<Tree items={items} aria-label="Docs" expandedIds={['themes']} />);
      focusIsOn('Guides');
    });

    it('moves to the parent when an ancestor is clicked shut', async () => {
      renderTree({ defaultExpandedIds: ['guides'] });
      await focusTree();
      await userEvent.keyboard('{ArrowDown}');
      focusIsOn('Installing');
      await userEvent.click(row('Guides'));
      focusIsOn('Guides');
      expect(queryNode('Installing')).toBeNull();
    });

    it('stays put when items are replaced by equal ones', async () => {
      const { rerender } = render(
        <Tree items={items} aria-label="Docs" defaultExpandedIds={['guides']} />,
      );
      await focusTree();
      await userEvent.keyboard('{ArrowDown}');
      const focused = document.activeElement;
      rerender(
        <Tree items={structuredClone(items)} aria-label="Docs" defaultExpandedIds={['guides']} />,
      );
      expect(document.activeElement).toBe(focused);
    });

    it('does not pull focus back when every item goes and items return', async () => {
      const { rerender } = render(
        <>
          <Tree items={items} aria-label="Docs" />
          <button type="button">Elsewhere</button>
        </>,
      );
      await focusTree();
      focusIsOn('Guides');
      rerender(
        <>
          <Tree items={[]} aria-label="Docs" />
          <button type="button">Elsewhere</button>
        </>,
      );
      expect(document.body).toHaveFocus();
      const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
      act(() => elsewhere.focus());
      rerender(
        <>
          <Tree items={items} aria-label="Docs" />
          <button type="button">Elsewhere</button>
        </>,
      );
      expect(elsewhere).toHaveFocus();
      expect(tabStops()).toEqual(['Guides']);
    });

    it('does not take focus from the page either, when items return', async () => {
      const { rerender } = render(<Tree items={items} aria-label="Docs" />);
      await focusTree();
      rerender(<Tree items={[]} aria-label="Docs" />);
      rerender(<Tree items={items} aria-label="Docs" />);
      expect(document.body).toHaveFocus();
    });

    it('takes no focus when something goes while focus is outside', () => {
      const { rerender } = render(<Tree items={items} aria-label="Docs" />);
      rerender(<Tree items={items.slice(1)} aria-label="Docs" />);
      expect(document.body).toHaveFocus();
    });
  });

  describe('the keys', () => {
    function renderOpen(props: Partial<TreeProps> = {}) {
      return renderTree({ defaultExpandedIds: everyParent, ...props });
    }

    it('moves up and down through what is shown, stopping at the ends', async () => {
      renderTree({ defaultExpandedIds: ['guides'] });
      await focusTree();
      focusIsOn('Guides');
      await userEvent.keyboard('{ArrowUp}');
      focusIsOn('Guides');
      await userEvent.keyboard('{ArrowDown}');
      focusIsOn('Installing');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      focusIsOn('Reference');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      focusIsOn('Changelog');
      await userEvent.keyboard('{ArrowUp}');
      focusIsOn('Reference');
    });

    it('goes to the first and the last shown item with Home and End', async () => {
      renderTree({ defaultExpandedIds: ['reference'] });
      await focusTree();
      await userEvent.keyboard('{End}');
      focusIsOn('Changelog');
      await userEvent.keyboard('{Home}');
      focusIsOn('Guides');
    });

    it('opens a closed parent with Right, keeping focus, then enters it', async () => {
      const onExpandedChange = vi.fn();
      renderTree({ onExpandedChange });
      await focusTree();
      await userEvent.keyboard('{ArrowRight}');
      focusIsOn('Guides');
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'true');
      expect(onExpandedChange).toHaveBeenLastCalledWith(['guides']);
      await userEvent.keyboard('{ArrowRight}');
      focusIsOn('Installing');
    });

    it('does nothing with Right on a leaf', async () => {
      const onExpandedChange = vi.fn();
      renderOpen({ onExpandedChange });
      await focusTree();
      await userEvent.keyboard('{ArrowDown}{ArrowRight}');
      focusIsOn('Installing');
      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('closes an open parent with Left, keeping focus, then moves to its parent', async () => {
      const onExpandedChange = vi.fn();
      renderOpen({ onExpandedChange });
      await focusTree();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      focusIsOn('Themes');
      await userEvent.keyboard('{ArrowLeft}');
      focusIsOn('Themes');
      expect(node('Themes')).toHaveAttribute('aria-expanded', 'false');
      expect(onExpandedChange).toHaveBeenLastCalledWith(['guides', 'reference']);
      await userEvent.keyboard('{ArrowLeft}');
      focusIsOn('Guides');
    });

    it('moves a leaf to its parent with Left, and does nothing at the root', async () => {
      renderOpen();
      await focusTree();
      await userEvent.keyboard('{ArrowDown}{ArrowLeft}');
      focusIsOn('Guides');
      await userEvent.keyboard('{End}{ArrowLeft}');
      focusIsOn('Changelog');
    });

    it('swaps Left and Right in a right-to-left page', async () => {
      document.documentElement.dir = 'rtl';
      renderTree();
      await focusTree();
      await userEvent.keyboard('{ArrowLeft}');
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'true');
      await userEvent.keyboard('{ArrowLeft}');
      focusIsOn('Installing');
      await userEvent.keyboard('{ArrowRight}');
      focusIsOn('Guides');
      await userEvent.keyboard('{ArrowRight}');
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'false');
    });

    it('swaps them by the computed direction, with no dir attribute at all', async () => {
      document.documentElement.style.direction = 'rtl';
      try {
        renderTree();
        await focusTree();
        await userEvent.keyboard('{ArrowLeft}');
        expect(node('Guides')).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('tree')).toHaveAttribute('data-direction', 'rtl');
      } finally {
        document.documentElement.style.removeProperty('direction');
      }
    });

    it('leaves the keys alone when a modifier is held, so Alt+Left still goes back', async () => {
      const onExpandedChange = vi.fn();
      renderOpen({ onExpandedChange });
      await focusTree();
      await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
      await userEvent.keyboard('{Meta>}{ArrowDown}{/Meta}');
      await userEvent.keyboard('{Control>}t{/Control}');
      focusIsOn('Guides');
      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    describe('Enter and Space', () => {
      it.each(['{Enter}', ' '])(
        '%s opens and closes a parent with selectionMode none',
        async (key) => {
          const onSelectedChange = vi.fn();
          renderTree({ onSelectedChange });
          await focusTree();
          await userEvent.keyboard(key);
          expect(node('Guides')).toHaveAttribute('aria-expanded', 'true');
          await userEvent.keyboard(key);
          expect(node('Guides')).toHaveAttribute('aria-expanded', 'false');
          expect(onSelectedChange).not.toHaveBeenCalled();
        },
      );

      it.each(['{Enter}', ' '])(
        '%s selects with single, and only reports a change',
        async (key) => {
          const onSelectedChange = vi.fn();
          renderTree({ selectionMode: 'single', onSelectedChange });
          await focusTree();
          await userEvent.keyboard(key);
          expect(onSelectedChange).toHaveBeenCalledTimes(1);
          expect(onSelectedChange).toHaveBeenLastCalledWith(['guides']);
          expect(node('Guides')).toHaveAttribute('aria-selected', 'true');
          expect(node('Guides')).toHaveAttribute('aria-expanded', 'false');
          await userEvent.keyboard(key);
          expect(onSelectedChange).toHaveBeenCalledTimes(1);
          await userEvent.keyboard('{End}');
          await userEvent.keyboard(key);
          expect(onSelectedChange).toHaveBeenLastCalledWith(['changelog']);
          expect(node('Guides')).not.toHaveAttribute('aria-selected');
        },
      );

      it.each(['{Enter}', ' '])('%s toggles with multiple', async (key) => {
        const onSelectedChange = vi.fn();
        renderTree({ selectionMode: 'multiple', onSelectedChange });
        await focusTree();
        await userEvent.keyboard(key);
        expect(onSelectedChange).toHaveBeenLastCalledWith(['guides']);
        await userEvent.keyboard('{End}');
        await userEvent.keyboard(key);
        expect(onSelectedChange).toHaveBeenLastCalledWith(['guides', 'changelog']);
        await userEvent.keyboard(key);
        expect(onSelectedChange).toHaveBeenLastCalledWith(['guides']);
        expect(node('Changelog')).toHaveAttribute('aria-selected', 'false');
      });

      it('does not scroll the page with Space', () => {
        renderTree({ selectionMode: 'single' });
        act(() => node('Guides').focus());
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        act(() => {
          node('Guides').dispatchEvent(event);
        });
        expect(event.defaultPrevented).toBe(true);
      });
    });

    it('keeps a type-ahead key from the page, letter and space alike', () => {
      renderTree();
      act(() => node('Guides').focus());
      const press = (key: string) => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        act(() => {
          screen.getByRole('tree').querySelector('[tabindex="0"]')?.dispatchEvent(event);
        });
        return event.defaultPrevented;
      };
      expect(press('r')).toBe(true);
      expect(press(' ')).toBe(true);
      expect(press('z')).toBe(true);
    });

    it('leaves a key with nothing to do to the page', () => {
      renderTree();
      act(() => node('Guides').focus());
      const event = new KeyboardEvent('keydown', { key: 'F2', bubbles: true, cancelable: true });
      act(() => {
        node('Guides').dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(false);
    });

    describe('type-ahead', () => {
      const pauseOverTypeAhead = () =>
        new Promise((resolve) => {
          setTimeout(resolve, 600);
        });

      it('moves to the next shown item starting with the letter, in either case', async () => {
        renderOpen();
        await focusTree();
        await userEvent.keyboard('c');
        focusIsOn('Changelog');
        await pauseOverTypeAhead();
        await userEvent.keyboard('T');
        focusIsOn('Themes');
      });

      it('wraps past the end', async () => {
        renderOpen();
        await focusTree();
        await userEvent.keyboard('{End}g');
        focusIsOn('Guides');
      });

      it('cycles through the matches on the same letter pressed again', async () => {
        renderOpen();
        await focusTree();
        await userEvent.keyboard('t');
        focusIsOn('Themes');
        await userEvent.keyboard('t');
        focusIsOn('Tokens');
        await userEvent.keyboard('t');
        focusIsOn('Themes');
      });

      it('narrows on letters typed quickly, and takes a space as part of them', async () => {
        renderOpen({ selectionMode: 'single' });
        await focusTree();
        await userEvent.keyboard('to');
        focusIsOn('Tokens');
        await pauseOverTypeAhead();
        await userEvent.keyboard('legacy t');
        focusIsOn('Legacy tokens');
        expect(screen.queryByRole('treeitem', { selected: true })).toBeNull();
      });

      it('does not select an enabled item at the gap in "New York"', async () => {
        const onSelectedChange = vi.fn();
        renderTree({
          items: [
            { id: 'first', label: 'First' },
            { id: 'new-jersey', label: 'New Jersey' },
            { id: 'new-york', label: 'New York' },
          ],
          selectionMode: 'single',
          onSelectedChange,
        });
        await focusTree();
        await userEvent.keyboard('new y');
        focusIsOn('New York');
        expect(onSelectedChange).not.toHaveBeenCalled();
      });

      it('starts over after a pause', async () => {
        renderOpen();
        await focusTree();
        await userEvent.keyboard('t');
        focusIsOn('Themes');
        await pauseOverTypeAhead();
        await userEvent.keyboard('i');
        focusIsOn('Installing');
      });

      it.each([
        ['ArrowDown', '{ArrowDown}'],
        ['Home', '{Home}'],
        ['Escape', '{Escape}'],
        ['F2', '{F2}'],
      ])('starts over after %s, with no pause', async (_name, key) => {
        renderOpen();
        await focusTree();
        await userEvent.keyboard('t');
        focusIsOn('Themes');
        await userEvent.keyboard(key);
        await userEvent.keyboard('i');
        // Taken together with the "t", this would be "ti", which matches nothing.
        focusIsOn('Installing');
      });

      it('takes Space as activating, not typing, after a key that is not a letter', async () => {
        const onSelectedChange = vi.fn();
        renderOpen({ selectionMode: 'single', onSelectedChange });
        await focusTree();
        await userEvent.keyboard('t');
        focusIsOn('Themes');
        await userEvent.keyboard('{ArrowDown} ');
        expect(onSelectedChange).toHaveBeenCalledWith(['light']);
      });

      it('goes on through Shift and Caps Lock, which are how a capital is typed', async () => {
        renderTree({
          items: [
            { id: 'first', label: 'First' },
            { id: 'new-jersey', label: 'New Jersey' },
            { id: 'new-york', label: 'New York' },
          ],
        });
        await focusTree();
        await userEvent.keyboard('{Shift>}N{/Shift}ew {Shift>}Y{/Shift}{CapsLock}O{CapsLock}');
        focusIsOn('New York');
      });

      it('skips what is collapsed away', async () => {
        renderTree({ defaultExpandedIds: ['guides'] });
        await focusTree();
        await userEvent.keyboard('t');
        focusIsOn('Themes');
        await userEvent.keyboard('l');
        // "Tokens" and "Light theme" are both closed off, and "tl" matches nothing.
        focusIsOn('Themes');
      });

      describe('with a match collapsed away ahead of one that shows', () => {
        const collapsedFirst: TreeItem[] = [
          {
            id: 'guides',
            label: 'Guides',
            children: [
              { id: 'install', label: 'Installing' },
              { id: 'dark', label: 'Dark theme' },
            ],
          },
          { id: 'docs', label: 'Docs' },
          { id: 'dates', label: 'Dates' },
        ];

        it('passes over it on one letter', async () => {
          renderTree({ items: collapsedFirst });
          await focusTree();
          await userEvent.keyboard('d');
          focusIsOn('Docs');
        });

        it('passes over it on several', async () => {
          renderTree({ items: collapsedFirst });
          await focusTree();
          await userEvent.keyboard('d');
          focusIsOn('Docs');
          await userEvent.keyboard('a');
          focusIsOn('Dates');
        });
      });

      it('lands on a disabled item, which stays focusable', async () => {
        renderOpen();
        await focusTree();
        await userEvent.keyboard('le');
        focusIsOn('Legacy tokens');
      });

      it('stays put when nothing matches', async () => {
        renderOpen();
        await focusTree();
        await userEvent.keyboard('z');
        focusIsOn('Guides');
      });

      it('selects nothing and opens nothing', async () => {
        const onSelectedChange = vi.fn();
        const onExpandedChange = vi.fn();
        renderTree({ selectionMode: 'single', onSelectedChange, onExpandedChange });
        await focusTree();
        await userEvent.keyboard('c');
        expect(onSelectedChange).not.toHaveBeenCalled();
        expect(onExpandedChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('the pointer', () => {
    function toggleOf(name: string) {
      return node(name).querySelector('[data-toggle]') as HTMLElement;
    }

    it('opens and closes a parent by its row with selectionMode none, and focuses it', async () => {
      renderTree();
      await userEvent.click(row('Guides'));
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'true');
      focusIsOn('Guides');
      await userEvent.click(row('Guides'));
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'false');
    });

    it('selects by the row and opens by the chevron with single', async () => {
      const onSelectedChange = vi.fn();
      renderTree({ selectionMode: 'single', onSelectedChange });
      await userEvent.click(row('Guides'));
      expect(onSelectedChange).toHaveBeenLastCalledWith(['guides']);
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(toggleOf('Reference'));
      expect(node('Reference')).toHaveAttribute('aria-expanded', 'true');
      expect(onSelectedChange).toHaveBeenCalledTimes(1);
      focusIsOn('Reference');
    });

    it('does not let a click on a child reach its parent', async () => {
      const onSelectedChange = vi.fn();
      renderTree({ selectionMode: 'multiple', defaultExpandedIds: ['guides'], onSelectedChange });
      await userEvent.click(row('Installing'));
      expect(onSelectedChange).toHaveBeenCalledTimes(1);
      expect(onSelectedChange).toHaveBeenCalledWith(['install']);
    });

    it('draws a chevron only on a parent, hidden from assistive technology', () => {
      renderTree();
      expect(toggleOf('Guides')).toHaveAttribute('aria-hidden', 'true');
      expect(toggleOf('Changelog')).toBeNull();
    });
  });

  describe('disabled items', () => {
    const disabledParent: TreeItem[] = [
      {
        id: 'locked',
        label: 'Locked',
        disabled: true,
        children: [{ id: 'free', label: 'Free' }],
      },
      { id: 'next', label: 'Next' },
    ];

    it('take focus by arrow key and read out, but cannot be selected', async () => {
      const onSelectedChange = vi.fn();
      renderTree({
        selectionMode: 'multiple',
        defaultExpandedIds: ['reference'],
        onSelectedChange,
      });
      await focusTree();
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      focusIsOn('Legacy tokens');
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(onSelectedChange).not.toHaveBeenCalled();
      await userEvent.click(row('Legacy tokens'));
      expect(onSelectedChange).not.toHaveBeenCalled();
      focusIsOn('Legacy tokens');
    });

    it('do not open or close by key or by pointer', async () => {
      const onExpandedChange = vi.fn();
      renderTree({ items: disabledParent, onExpandedChange });
      await userEvent.click(row('Locked'));
      focusIsOn('Locked');
      await userEvent.keyboard('{ArrowRight}{Enter} ');
      await userEvent.click(node('Locked').querySelector('[data-toggle]') as HTMLElement);
      expect(node('Locked')).toHaveAttribute('aria-expanded', 'false');
      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('stay navigable when the app opened them', async () => {
      const onExpandedChange = vi.fn();
      renderTree({ items: disabledParent, defaultExpandedIds: ['locked'], onExpandedChange });
      await focusTree();
      focusIsOn('Free');
      await userEvent.keyboard('{ArrowLeft}');
      focusIsOn('Locked');
      await userEvent.keyboard('{ArrowLeft}');
      focusIsOn('Locked');
      expect(onExpandedChange).not.toHaveBeenCalled();
      await userEvent.keyboard('{ArrowRight}');
      focusIsOn('Free');
    });

    it('go on to their parent with Left when nested and left open by the app', async () => {
      const onExpandedChange = vi.fn();
      renderTree({
        items: [
          {
            id: 'outer',
            label: 'Outer',
            children: [
              {
                id: 'nested',
                label: 'Nested',
                disabled: true,
                children: [{ id: 'inner', label: 'Inner' }],
              },
            ],
          },
        ],
        defaultExpandedIds: ['outer', 'nested'],
        onExpandedChange,
      });
      act(() => node('Nested').focus());
      await userEvent.keyboard('{ArrowLeft}');
      focusIsOn('Outer');
      expect(node('Nested')).toHaveAttribute('aria-expanded', 'true');
      expect(onExpandedChange).not.toHaveBeenCalled();
    });
  });

  describe('controlled and uncontrolled', () => {
    let consoleError: ReturnType<typeof vi.spyOn>;

    afterEach(() => {
      consoleError?.mockRestore();
    });

    it('holds its own state past the first mount, with no callback needed', async () => {
      const { rerender } = renderTree({ selectionMode: 'single' });
      await userEvent.click(row('Changelog'));
      await userEvent.click(node('Guides').querySelector('[data-toggle]') as HTMLElement);
      rerender(<Tree items={items} aria-label="Docs" selectionMode="single" />);
      expect(node('Changelog')).toHaveAttribute('aria-selected', 'true');
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'true');
    });

    it('keeps state when an inline items prop arrives new on each render', async () => {
      const { rerender } = renderTree({ selectionMode: 'single' });
      await userEvent.click(row('Changelog'));
      rerender(<Tree items={structuredClone(items)} aria-label="Docs" selectionMode="single" />);
      expect(node('Changelog')).toHaveAttribute('aria-selected', 'true');
    });

    it('does what the parent says, and only that, when controlled', async () => {
      const onExpandedChange = vi.fn();
      const onSelectedChange = vi.fn();
      const props = {
        items,
        'aria-label': 'Docs',
        selectionMode: 'single',
        expandedIds: [],
        selectedIds: [],
        onExpandedChange,
        onSelectedChange,
      } as const;
      const { rerender } = render(<Tree {...props} expandedIds={[]} selectedIds={[]} />);
      await focusTree();
      await userEvent.keyboard('{ArrowRight}');
      expect(onExpandedChange).toHaveBeenCalledWith(['guides']);
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'false');
      await userEvent.keyboard('{Enter}');
      expect(onSelectedChange).toHaveBeenCalledWith(['guides']);
      expect(node('Guides')).not.toHaveAttribute('aria-selected');
      rerender(<Tree {...props} expandedIds={['guides']} selectedIds={['guides']} />);
      expect(node('Guides')).toHaveAttribute('aria-expanded', 'true');
      expect(node('Guides')).toHaveAttribute('aria-selected', 'true');
    });

    it('works with state in a parent, past first mount', async () => {
      function Parent() {
        const [selectedIds, setSelectedIds] = useState(['guides']);
        return (
          <>
            <Tree
              items={items}
              aria-label="Docs"
              selectionMode="single"
              selectedIds={selectedIds}
              onSelectedChange={setSelectedIds}
            />
            <button type="button" onClick={() => setSelectedIds(['reference'])}>
              Choose reference
            </button>
          </>
        );
      }
      render(<Parent />);
      await userEvent.click(row('Changelog'));
      expect(node('Changelog')).toHaveAttribute('aria-selected', 'true');
      await userEvent.click(screen.getByRole('button', { name: 'Choose reference' }));
      expect(node('Reference')).toHaveAttribute('aria-selected', 'true');
      expect(tabStops()).toEqual(['Reference']);
    });

    it('warns of nothing when moving between controlled and uncontrolled', async () => {
      consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { rerender } = render(<Tree items={items} aria-label="Docs" selectionMode="single" />);
      await userEvent.click(row('Changelog'));
      rerender(
        <Tree
          items={items}
          aria-label="Docs"
          selectionMode="single"
          selectedIds={['guides']}
          expandedIds={['guides']}
        />,
      );
      expect(node('Guides')).toHaveAttribute('aria-selected', 'true');
      rerender(<Tree items={items} aria-label="Docs" selectionMode="single" />);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('reports ids it does not know along with the new one, as they are the parent’s', async () => {
      const onSelectedChange = vi.fn();
      renderTree({ selectionMode: 'multiple', selectedIds: ['ghost'], onSelectedChange });
      await userEvent.click(row('Guides'));
      expect(onSelectedChange).toHaveBeenCalledWith(['ghost', 'guides']);
    });
  });

  describe('a repeated id', () => {
    const repeated: TreeItem[] = [
      { id: 'twin', label: 'First twin', children: [{ id: 'kid', label: 'Kid' }] },
      { id: 'twin', label: 'Second twin' },
      { id: 'other', label: 'Other', children: [{ id: 'kid', label: 'Kid again' }] },
    ];

    it('keeps the first and leaves out the rest, with what they hold', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      renderTree({ items: repeated, defaultExpandedIds: ['twin', 'other'] });
      expect(queryNode('First twin')).not.toBeNull();
      expect(queryNode('Second twin')).toBeNull();
      expect(queryNode('Kid')).not.toBeNull();
      expect(queryNode('Kid again')).toBeNull();
      expect(node('Other')).not.toHaveAttribute('aria-expanded');
      // Handled here, so React has no two sibling keys to complain of.
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('does not hang on items that hold themselves', () => {
      const cycle: TreeItem = { id: 'loop', label: 'Loop' };
      cycle.children = [cycle];
      renderTree({ items: [cycle], defaultExpandedIds: ['loop'] });
      expect(screen.getAllByRole('treeitem')).toHaveLength(1);
    });
  });

  it('marks the chevrons with the direction the stylesheet turns them by', () => {
    document.documentElement.dir = 'rtl';
    renderTree();
    expect(screen.getByRole('tree')).toHaveAttribute('data-direction', 'rtl');
  });
});
