import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import { indexItems, visibleNodesOf, type TreeNode } from './treeIndex';
import styles from './Tree.module.css';

export interface TreeItem {
  /**
   * Identifies the item across renders, and unique in the whole tree, not only among its siblings.
   * A repeated id is left out, with everything under it: the first one in reading order stays.
   */
  id: string;
  /** The visible text, the accessible name and what type-ahead matches. */
  label: string;
  /** Sits before the label. Decorative: it stays out of the accessible name. */
  icon?: ReactNode;
  /**
   * Focusable and read out, as the WAI-ARIA pattern asks, but inert: it cannot be selected and does
   * not open or close. It says nothing about what it holds, which an app can still open for it.
   */
  disabled?: boolean;
  children?: TreeItem[];
}

export type TreeSelectionMode = 'none' | 'single' | 'multiple';

interface TreeBaseProps {
  /** Static data. A new array of the same ids changes nothing but what is drawn. */
  items: TreeItem[];
  /** Controlled: the ids of the open parents. Pair it with `onExpandedChange`. */
  expandedIds?: string[];
  /** Uncontrolled: the parents open at first. */
  defaultExpandedIds?: string[];
  /** Every open id, in one argument, each time a parent opens or closes. */
  onExpandedChange?: (ids: string[]) => void;
  /**
   * `none`, the default: Enter, Space and a press on the row open and close a parent. `single` and
   * `multiple`: they select, and the chevron or the Left and Right keys open and close. `multiple`
   * toggles one item at a time; there is no range selection.
   */
  selectionMode?: TreeSelectionMode;
  /**
   * Controlled: the selected ids. Pair it with `onSelectedChange`. Under `single` the first id an
   * item holds counts, and under `none` this is ignored. An id no item holds selects nothing.
   */
  selectedIds?: string[];
  /** Uncontrolled: the ids selected at first. */
  defaultSelectedIds?: string[];
  /** Every selected id, in one argument, and only for a real change. */
  onSelectedChange?: (ids: string[]) => void;
}

interface TreeNamedByLabel extends TreeBaseProps {
  /** Names the tree. One of this and `aria-labelledby` is required. */
  'aria-label': string;
  'aria-labelledby'?: undefined;
}

interface TreeNamedByElement extends TreeBaseProps {
  'aria-label'?: undefined;
  /** The id of the element that names the tree. */
  'aria-labelledby': string;
}

export type TreeProps = TreeNamedByLabel | TreeNamedByElement;

/** A pause longer than this starts a new type-ahead, in milliseconds. */
const TYPE_AHEAD_WINDOW = 500;

interface FocusedItem {
  id: string;
  /** Kept for when the item goes, taking its place in the tree with it. */
  ancestorIds: string[];
}

function isPrintable(key: string): boolean {
  return Array.from(key).length === 1;
}

function findTypedMatch(visible: TreeNode[], from: number, typed: string): TreeNode | undefined {
  const wanted = typed.toLocaleLowerCase();
  for (let offset = 0; offset < visible.length; offset += 1) {
    const candidate = visible[(from + offset) % visible.length];
    if (candidate?.item.label.toLocaleLowerCase().startsWith(wanted)) {
      return candidate;
    }
  }
  return undefined;
}

type TreeViewProps = TreeProps & {
  /** A press on an item that can be chosen, including the one chosen already. `TreeSelect`'s. */
  onItemChoose?: (id: string) => void;
};

/**
 * The tree, with one prop more than the public `Tree`. Internal: not exported from `src/index.ts`.
 *
 * Open branches are nested in the DOM, so a browser works out each item's level and position in its
 * set for itself, and `aria-level`, `aria-setsize` and `aria-posinset` would only repeat it.
 */
export function TreeView({
  items,
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  selectionMode = 'none',
  selectedIds,
  defaultSelectedIds,
  onSelectedChange,
  onItemChoose,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: TreeViewProps) {
  const baseId = useId();
  const rootRef = useRef<HTMLUListElement>(null);
  const itemElements = useRef(new Map<string, HTMLElement>());
  const typedSoFar = useRef({ text: '', at: Number.NEGATIVE_INFINITY });
  const [heldExpanded, setHeldExpanded] = useState<string[]>(defaultExpandedIds ?? []);
  const [heldSelected, setHeldSelected] = useState<string[]>(defaultSelectedIds ?? []);
  const [focused, setFocused] = useState<FocusedItem | null>(null);

  const index = useMemo(() => indexItems(items), [items]);
  const expanded = expandedIds ?? heldExpanded;
  const expandedSet = useMemo(() => new Set(expanded), [expanded]);
  const visible = useMemo(
    () => visibleNodesOf(index.roots, expandedSet),
    [index.roots, expandedSet],
  );
  const selected = selectedIds ?? heldSelected;
  const selectedSet = useMemo(() => {
    if (selectionMode === 'none') {
      return new Set<string>();
    }
    const known = selected.filter((id) => index.nodes.has(id));
    return new Set(selectionMode === 'single' ? known.slice(0, 1) : known);
  }, [selectionMode, selected, index.nodes]);

  /** The item itself if it is shown, else the nearest ancestor that is. */
  const nearestShown = (id: string, ancestorIds: string[]) =>
    [id, ...ancestorIds].find((candidate) => visible.some((node) => node.id === candidate));
  /** Where Tab comes in: the first selected item, what shows of one, the first enabled, the first. */
  const restingId = () => {
    const firstSelected =
      visible.find((node) => selectedSet.has(node.id))?.id ??
      [...selectedSet]
        .map((id) => nearestShown(id, index.nodes.get(id)?.ancestorIds ?? []))
        .find(Boolean);
    return firstSelected ?? (visible.find((node) => !node.item.disabled) ?? visible[0])?.id;
  };
  // Worked out on each render, so that no change to the items or to what is open can strand it.
  const tabStopId =
    (focused === null
      ? undefined
      : nearestShown(
          focused.id,
          index.nodes.get(focused.id)?.ancestorIds ?? focused.ancestorIds,
        )) ?? restingId();
  const current = tabStopId === undefined ? undefined : index.nodes.get(tabStopId);

  // On every commit, because the focused element can go with any change: removed, collapsed away or
  // moved under another parent. React fires no blur for an element it removes, so `focused` still
  // says focus was in here, and `activeElement` says it no longer is.
  useLayoutEffect(() => {
    const stop = tabStopId === undefined ? undefined : itemElements.current.get(tabStopId);
    if (focused !== null && stop !== undefined && document.activeElement !== stop) {
      stop.focus();
    }
  });

  // Written straight to the node for the reasons `DatePicker`'s `Calendar` gives: read from the page
  // and not from `:dir()`, which a bundler can rewrite, and with no second render to see it.
  useLayoutEffect(() => {
    if (rootRef.current !== null) {
      rootRef.current.dataset.direction = getComputedStyle(rootRef.current).direction;
    }
  });

  const toggleExpanded = (node: TreeNode) => {
    if (node.item.disabled || node.children.length === 0) {
      return;
    }
    const next = expandedSet.has(node.id)
      ? expanded.filter((id) => id !== node.id)
      : [...expanded, node.id];
    setHeldExpanded(next);
    onExpandedChange?.(next);
  };

  const commitSelected = (next: string[]) => {
    setHeldSelected(next);
    onSelectedChange?.(next);
  };

  /** What Enter, Space and a press on the row all do. */
  const activate = (node: TreeNode) => {
    if (selectionMode === 'none') {
      toggleExpanded(node);
    } else if (!node.item.disabled) {
      if (selectionMode === 'multiple') {
        commitSelected(
          selectedSet.has(node.id)
            ? selected.filter((id) => id !== node.id)
            : [...selected, node.id],
        );
      } else if (!selectedSet.has(node.id)) {
        commitSelected([node.id]);
      }
      onItemChoose?.(node.id);
    }
  };

  const focusNode = (id: string | undefined) => {
    if (id !== undefined) {
      itemElements.current.get(id)?.focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || current === undefined) {
      return;
    }
    const position = visible.indexOf(current);
    const inRightToLeft = getComputedStyle(event.currentTarget).direction === 'rtl';
    const isOpen = current.children.length > 0 && expandedSet.has(current.id);
    const isTyping =
      typedSoFar.current.text !== '' &&
      event.timeStamp - typedSoFar.current.at <= TYPE_AHEAD_WINDOW;

    const keyActions: Record<string, () => void> = {
      ArrowDown: () => focusNode(visible[position + 1]?.id),
      ArrowUp: () => focusNode(visible[position - 1]?.id),
      Home: () => focusNode(visible[0]?.id),
      End: () => focusNode(visible.at(-1)?.id),
      Enter: () => activate(current),
    };
    const moveInward = () =>
      isOpen ? focusNode(current.children[0]?.id) : toggleExpanded(current);
    const moveOutward = () =>
      isOpen && !current.item.disabled
        ? toggleExpanded(current)
        : focusNode(current.ancestorIds[0]);
    keyActions[inRightToLeft ? 'ArrowLeft' : 'ArrowRight'] = moveInward;
    keyActions[inRightToLeft ? 'ArrowRight' : 'ArrowLeft'] = moveOutward;
    if (!isTyping) {
      // Inside a type-ahead a space is a letter: "New York" must get past its gap.
      keyActions[' '] = () => activate(current);
    }

    const keyAction = keyActions[event.key];
    if (keyAction !== undefined) {
      event.preventDefault();
      keyAction();
    } else if (isPrintable(event.key)) {
      event.preventDefault();
      const text = (isTyping ? typedSoFar.current.text : '') + event.key;
      typedSoFar.current = { text, at: event.timeStamp };
      // One letter again and again goes round its matches; more letters narrow from where we are.
      const isOneLetter = Array.from(text).every((letter) => letter === event.key);
      const match = isOneLetter
        ? findTypedMatch(visible, position + 1, event.key)
        : findTypedMatch(visible, position, text);
      focusNode(match?.id);
    }
  };

  const renderNode = (node: TreeNode, level: number): ReactElement => {
    const hasChildren = node.children.length > 0;
    const isOpen = hasChildren && expandedSet.has(node.id);
    const isSelected = selectedSet.has(node.id);
    const labelId = `${baseId}-${node.ordinal}`;
    // The pattern's rule: single marks only the chosen item, multiple marks every item that can be
    // selected, and an item that cannot be selected says nothing unless the app selected it anyway.
    const ariaSelected =
      isSelected || (selectionMode === 'multiple' && !node.item.disabled) ? isSelected : undefined;
    return (
      <li
        key={node.id}
        ref={(element) => {
          if (element !== null) {
            itemElements.current.set(node.id, element);
          }
          return () => {
            itemElements.current.delete(node.id);
          };
        }}
        role="treeitem"
        className={styles.item}
        tabIndex={node.id === tabStopId ? 0 : -1}
        // By its label alone: a treeitem's name would otherwise take in everything nested under it.
        aria-labelledby={labelId}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-selected={ariaSelected}
        aria-disabled={node.item.disabled ? true : undefined}
        onFocus={(event) => {
          if (event.target === event.currentTarget) {
            setFocused({ id: node.id, ancestorIds: node.ancestorIds });
          }
        }}
      >
        {/* The keyboard path to all of this is the tree's own `onKeyDown`, and focus lands on the
            treeitem around the row. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- see above */}
        <div
          className={styles.row}
          style={{ '--tree-level': level } as CSSProperties}
          onClick={() => activate(node)}
        >
          {hasChildren ? (
            // Not a button: a treeitem may not hold another control, and Left and Right do this.
            <span
              className={styles.toggle}
              data-toggle=""
              aria-hidden="true"
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(node);
              }}
            >
              <ChevronDownIcon />
            </span>
          ) : (
            <span className={styles.toggle} />
          )}
          {node.item.icon ? (
            <span className={styles.icon} aria-hidden="true">
              {node.item.icon}
            </span>
          ) : null}
          <span id={labelId} className={styles.label}>
            {node.item.label}
          </span>
          {isSelected ? (
            <span className={styles.check} aria-hidden="true">
              <CheckIcon />
            </span>
          ) : null}
        </div>
        {isOpen ? (
          <ul role="group" className={styles.group}>
            {node.children.map((child) => renderNode(child, level + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <ul
      ref={rootRef}
      role="tree"
      className={styles.root}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-multiselectable={selectionMode === 'multiple' ? true : undefined}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(null);
        }
      }}
    >
      {index.roots.map((node) => renderNode(node, 0))}
    </ul>
  );
}

/**
 * A hierarchy to move through and select from, following the WAI-ARIA tree view pattern: one tab
 * stop, arrow keys, Home, End and type-ahead. Left and Right swap in a right-to-left page.
 *
 * Tab lands on the selected item, or on the nearest open ancestor of one that is collapsed away,
 * else on the first enabled item. Focus never goes with an item: when it is removed or collapsed
 * away, focus moves to the nearest ancestor still shown.
 */
export function Tree(props: TreeProps) {
  return <TreeView {...props} />;
}
