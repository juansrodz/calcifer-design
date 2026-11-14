/**
 * Whether `href` is the page the app is on, or an ancestor of it. The root is the exception: `/`
 * is an ancestor of every path, so it matches only itself, or the home link would read as current
 * everywhere. Any other href matches itself and anything beneath it (`/events` holds
 * `/events/e1` and `/events/`) but not a sibling that merely shares the prefix (`/eventsx`).
 *
 * Shared by `NavMenu` and `TabBar`; internal, not part of the package's exports.
 */
export function isCurrentPath(href: string, currentPath: string): boolean {
  if (href === '/') {
    return currentPath === '/';
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}
