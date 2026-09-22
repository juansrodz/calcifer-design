export interface StorybookEntry {
  id: string;
  title: string;
  name: string;
  type: string;
  importPath: string;
  componentPath?: string;
}

export interface StorybookIndex {
  v: number;
  entries: Record<string, StorybookEntry>;
}

export interface InventoryGroup {
  /** The story group's title, e.g. `Overlays/Dialog`. */
  title: string;
  group: string;
  name: string;
  storyCount: number;
  /** The first story in the group: what the deep link opens. */
  firstStoryId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates the shape before anything renders it. This payload crosses a network boundary from
 * a build this app does not control, and an `undefined` in a table cell is a bug report that
 * takes an afternoon; a thrown error naming the offending entry takes a minute.
 */
export function parseStorybookIndex(payload: unknown): StorybookIndex {
  if (!isRecord(payload) || typeof payload.v !== 'number' || !isRecord(payload.entries)) {
    throw new Error('that is not a Storybook index (expected { v, entries })');
  }
  const entries: Record<string, StorybookEntry> = {};
  for (const [entryId, candidate] of Object.entries(payload.entries)) {
    if (
      !isRecord(candidate) ||
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.name !== 'string' ||
      typeof candidate.type !== 'string' ||
      typeof candidate.importPath !== 'string'
    ) {
      throw new Error(`that is not a Storybook index: entry "${entryId}" is missing fields`);
    }
    entries[entryId] = {
      id: candidate.id,
      title: candidate.title,
      name: candidate.name,
      type: candidate.type,
      importPath: candidate.importPath,
      ...(typeof candidate.componentPath === 'string'
        ? { componentPath: candidate.componentPath }
        : {}),
    };
  }
  // eslint-disable-next-line id-length -- Storybook's index schema names its version field "v"
  return { v: payload.v, entries };
}

/**
 * One row per story group. Not every group is a component — `Forms/A whole form` is a
 * composition — so this keeps every group Storybook lists, not just the ones that are.
 */
export function summarizeInventory(index: StorybookIndex): InventoryGroup[] {
  const byTitle = new Map<string, InventoryGroup>();
  for (const entry of Object.values(index.entries)) {
    if (entry.type !== 'story') {
      continue;
    }
    const existing = byTitle.get(entry.title);
    if (existing) {
      existing.storyCount += 1;
      continue;
    }
    const separator = entry.title.lastIndexOf('/');
    byTitle.set(entry.title, {
      title: entry.title,
      group: separator === -1 ? '' : entry.title.slice(0, separator),
      name: separator === -1 ? entry.title : entry.title.slice(separator + 1),
      storyCount: 1,
      firstStoryId: entry.id,
    });
  }
  return [...byTitle.values()].sort(
    (left, right) => left.group.localeCompare(right.group) || left.name.localeCompare(right.name),
  );
}

function trimTrailingSlash(base: string): string {
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function storybookIndexUrl(base: string = STORYBOOK_BASE_URL): string {
  return `${trimTrailingSlash(base)}/index.json`;
}

/** The URL form Storybook's manager reads a deep link from. */
export function storybookStoryUrl(storyId: string, base: string = STORYBOOK_BASE_URL): string {
  return `${trimTrailingSlash(base)}/?path=/story/${storyId}`;
}
