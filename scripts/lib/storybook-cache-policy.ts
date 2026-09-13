/**
 * Answers what `Cache-Control` the Storybook nginx config sets for a given request path, by
 * reading the config itself rather than by restating its rules here — a copy of the rules would
 * agree with a broken config just as happily as with a correct one.
 *
 * Models the subset of nginx's location matching this config uses: an exact `location = <path>`
 * first, then regex locations in the order written, then the longest matching prefix location.
 * That order is only correct while no prefix location carries `^~`, which none here does. A
 * `location` line the parser cannot fit into that model — `^~`, `~*`, or an opening brace closed
 * on the same line — is rejected with a thrown error rather than silently dropped: a location the
 * parser cannot see is a location whose policy this module cannot vouch for.
 */
interface CacheLocation {
  pattern: RegExp;
  cacheControl: string | null;
}

/** A `location` block whose opening line has been read but whose closing `}` has not. */
interface OpenLocation {
  /** `=` for an exact location, `~` for a regex one, empty for a prefix one. */
  marker: string;
  target: string;
  cacheControl: string | null;
}

function escapeForRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Locations in nginx's own matching order for this file: the exact `=` match, then regex
 * locations as written, then prefix locations longest-first. Parsed line by line rather than
 * with one block-shaped regular expression, because the immutable location's own pattern
 * contains both `{` and `}` and would end any block match early.
 */
function parseLocations(conf: string): CacheLocation[] {
  const exactLocations: CacheLocation[] = [];
  const regexLocations: CacheLocation[] = [];
  const prefixLocations: CacheLocation[] = [];
  let openLocation: OpenLocation | null = null;

  for (const rawLine of conf.split('\n')) {
    const line = rawLine.trim();
    const opening = /^location\s+(?:([=~])\s+)?(".*"|\S+)\s*\{$/.exec(line);
    if (opening !== null) {
      openLocation = {
        marker: opening[1] ?? '',
        target: (opening[2] ?? '').replace(/^"|"$/g, ''),
        cacheControl: null,
      };
      continue;
    }
    if (/^location\b/.test(line)) {
      throw new Error(`storybook-cache-policy: unparseable location line: ${line}`);
    }
    if (openLocation === null) {
      continue;
    }
    const header = /^add_header\s+Cache-Control\s+"([^"]+)"/.exec(line);
    if (header !== null) {
      openLocation.cacheControl = header[1] ?? null;
      continue;
    }
    if (line === '}') {
      const { marker, target, cacheControl } = openLocation;
      if (marker === '~') {
        regexLocations.push({ pattern: new RegExp(target), cacheControl });
      } else if (marker === '=') {
        exactLocations.push({ pattern: new RegExp(`^${escapeForRegExp(target)}$`), cacheControl });
      } else {
        prefixLocations.push({ pattern: new RegExp(`^${escapeForRegExp(target)}`), cacheControl });
      }
      openLocation = null;
    }
  }

  // Longest prefix wins, as in nginx. This ranks by escaped source length rather than by the
  // prefix itself, so an escaped metacharacter could let a shorter prefix tie a longer one.
  // Moot while the config has one prefix location; sort on the unescaped target before a
  // second one is added.
  prefixLocations.sort((left, right) => right.pattern.source.length - left.pattern.source.length);
  return [...exactLocations, ...regexLocations, ...prefixLocations];
}

export function cacheControlFor(conf: string, requestPath: string): string | null {
  for (const location of parseLocations(conf)) {
    if (location.pattern.test(requestPath)) {
      return location.cacheControl;
    }
  }
  return null;
}
