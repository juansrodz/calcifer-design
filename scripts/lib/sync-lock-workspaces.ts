export interface WorkspaceManifest {
  /** Repo-relative directory holding the package.json (posix separators, e.g. "packages/ui"). */
  directory: string;
  name: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

type DependencyFieldName =
  'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';

const dependencyFieldNames: DependencyFieldName[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

function isDependencyFieldName(candidate: string): candidate is DependencyFieldName {
  return (dependencyFieldNames as string[]).includes(candidate);
}

/** `lines[lineIndex]`, but typed as `string` — every call site already knows the index is in range. */
function requireLine(lines: string[], lineIndex: number): string {
  const line = lines[lineIndex];
  if (line === undefined) {
    throw new Error(`bun.lock: expected a line at index ${lineIndex}`);
  }
  return line;
}

/** A regex match's capture group, but typed as `string` — every call site's pattern makes this group mandatory. */
function requireGroup(match: RegExpExecArray, groupIndex: number): string {
  const group = match[groupIndex];
  if (group === undefined) {
    throw new Error(`bun.lock: expected regex capture group ${groupIndex} in "${match[0]}"`);
  }
  return group;
}

function leadingSpaces(line: string): number {
  const match = /^ */.exec(line);
  return match === null ? 0 : match[0].length;
}

/**
 * Finds the line that closes the block opened at `openLineIndex`, using indentation alone:
 * `bun.lock`'s generated formatting nests every level by exactly two spaces and puts one
 * key per line, so the closing `}`/`},` of a block is the next line at the same indent as
 * its opening line. Throws if no such line exists (a malformed or truncated lockfile).
 */
function findBlockEnd(lines: string[], openLineIndex: number): number {
  const openIndent = leadingSpaces(requireLine(lines, openLineIndex));
  for (let lineIndex = openLineIndex + 1; lineIndex < lines.length; lineIndex += 1) {
    const line = requireLine(lines, lineIndex);
    if (leadingSpaces(line) === openIndent && /^\s*}/.test(line)) {
      return lineIndex;
    }
  }
  throw new Error(
    `bun.lock: unterminated block starting at line ${openLineIndex + 1}: ${requireLine(lines, openLineIndex)}`,
  );
}

/**
 * Rewrites `bun.lock`'s `"workspaces": {...}` block in place, as text, so that each
 * workspace entry's recorded `version` and its ranges on other workspace packages match
 * what the workspace's own `package.json` currently says.
 *
 * `bun.lock` is JSONC (trailing commas), so this never runs it through `JSON.parse` —
 * every edit is a targeted line replacement, and every other byte of the file (external
 * package entries, the `packages` section, formatting) is left untouched.
 */
export function syncLockWorkspaces(
  lockText: string,
  manifests: WorkspaceManifest[],
): { lockText: string; changes: string[] } {
  const lines = lockText.split('\n');
  const workspacesStartIndex = lines.findIndex((line) => line.trim() === '"workspaces": {');
  if (workspacesStartIndex === -1) {
    throw new Error('bun.lock: no "workspaces": { block found');
  }
  const workspacesEndIndex = findBlockEnd(lines, workspacesStartIndex);

  const workspaceNames = new Set(manifests.map((manifest) => manifest.name));
  const manifestsByDirectory = new Map(manifests.map((manifest) => [manifest.directory, manifest]));
  const foundDirectories = new Set<string>();
  const changes: string[] = [];

  let entryLineIndex = workspacesStartIndex + 1;
  while (entryLineIndex < workspacesEndIndex) {
    const entryHeaderMatch = /^ {4}"([^"]*)": \{$/.exec(requireLine(lines, entryLineIndex));
    if (entryHeaderMatch === null) {
      entryLineIndex += 1;
      continue;
    }

    const directory = requireGroup(entryHeaderMatch, 1);
    const entryEndIndex = findBlockEnd(lines, entryLineIndex);
    foundDirectories.add(directory);

    const manifest = manifestsByDirectory.get(directory);
    if (manifest !== undefined) {
      for (let lineIndex = entryLineIndex + 1; lineIndex < entryEndIndex; lineIndex += 1) {
        const versionMatch = /^( {6}"version": ")([^"]*)(",?)$/.exec(requireLine(lines, lineIndex));
        if (versionMatch === null || manifest.version === undefined) continue;
        const currentVersion = requireGroup(versionMatch, 2);
        if (currentVersion === manifest.version) continue;
        const prefix = requireGroup(versionMatch, 1);
        const suffix = requireGroup(versionMatch, 3);
        lines[lineIndex] = `${prefix}${manifest.version}${suffix}`;
        changes.push(`${directory}: version ${currentVersion} -> ${manifest.version}`);
      }

      for (let lineIndex = entryLineIndex + 1; lineIndex < entryEndIndex; lineIndex += 1) {
        const fieldHeaderMatch = /^ {6}"(\w+)": \{$/.exec(requireLine(lines, lineIndex));
        if (fieldHeaderMatch === null) continue;
        const fieldName = requireGroup(fieldHeaderMatch, 1);
        if (!isDependencyFieldName(fieldName)) continue;
        const fieldValues = manifest[fieldName];
        const fieldEndIndex = findBlockEnd(lines, lineIndex);

        for (
          let dependencyLineIndex = lineIndex + 1;
          dependencyLineIndex < fieldEndIndex;
          dependencyLineIndex += 1
        ) {
          const dependencyMatch = /^( {8}")([^"]+)(": ")([^"]*)(",?)$/.exec(
            requireLine(lines, dependencyLineIndex),
          );
          if (dependencyMatch === null) continue;
          const dependencyName = requireGroup(dependencyMatch, 2);
          if (!workspaceNames.has(dependencyName)) continue;
          const declaredRange = fieldValues?.[dependencyName];
          if (declaredRange === undefined) continue;
          const currentRange = requireGroup(dependencyMatch, 4);
          if (declaredRange === currentRange) continue;
          const prefix = requireGroup(dependencyMatch, 1);
          const middle = requireGroup(dependencyMatch, 3);
          const suffix = requireGroup(dependencyMatch, 5);
          lines[dependencyLineIndex] =
            `${prefix}${dependencyName}${middle}${declaredRange}${suffix}`;
          changes.push(`${directory}: ${dependencyName} ${currentRange} -> ${declaredRange}`);
        }

        lineIndex = fieldEndIndex;
      }
    }

    entryLineIndex = entryEndIndex + 1;
  }

  for (const manifest of manifests) {
    if (!foundDirectories.has(manifest.directory)) {
      throw new Error(
        `bun.lock: no workspace entry for "${manifest.directory}" (${manifest.name}); ` +
          'run bun install first so the lock knows about this workspace',
      );
    }
  }

  return { lockText: lines.join('\n'), changes };
}
