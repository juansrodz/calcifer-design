import type { TreeItem } from './Tree';

/** One item in its place. Internal, as `TreeSelect` and `Tree` share it. */
export interface TreeNode {
  id: string;
  item: TreeItem;
  /** Nearest first. */
  ancestorIds: string[];
  children: TreeNode[];
  /** Its place in the whole tree, which an element id can hold where any `id` string could not. */
  ordinal: number;
}

export interface TreeIndex {
  roots: TreeNode[];
  nodes: Map<string, TreeNode>;
}

/**
 * The tree with each id in one place. An id seen before is left out with everything it holds:
 * selection, expansion and focus all speak in ids, so two items sharing one could not be told apart.
 * That also stops an item that holds itself from going round for ever.
 */
export function indexItems(items: TreeItem[]): TreeIndex {
  const nodes = new Map<string, TreeNode>();
  const collect = (level: TreeItem[], ancestorIds: string[]): TreeNode[] => {
    const collected: TreeNode[] = [];
    for (const item of level) {
      if (!nodes.has(item.id)) {
        const node: TreeNode = {
          id: item.id,
          item,
          ancestorIds,
          children: [],
          ordinal: nodes.size,
        };
        nodes.set(item.id, node);
        node.children = collect(item.children ?? [], [item.id, ...ancestorIds]);
        collected.push(node);
      }
    }
    return collected;
  };
  return { roots: collect(items, []), nodes };
}

/** What is shown, top to bottom: every root, and what each open parent holds. */
export function visibleNodesOf(roots: TreeNode[], expanded: ReadonlySet<string>): TreeNode[] {
  return roots.flatMap((node) => [
    node,
    ...(expanded.has(node.id) ? visibleNodesOf(node.children, expanded) : []),
  ]);
}
