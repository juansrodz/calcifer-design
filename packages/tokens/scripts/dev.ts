import { resolve } from 'node:path';

const packageRoot = resolve(import.meta.dir, '..');
const watchers = [
  Bun.spawn(['rslib', 'build', '--watch'], {
    cwd: packageRoot,
    stdout: 'inherit',
    stderr: 'inherit',
  }),
  Bun.spawn(['bun', '--watch', 'scripts/write-css.ts'], {
    cwd: packageRoot,
    stdout: 'inherit',
    stderr: 'inherit',
  }),
];

function stopWatchers() {
  for (const watcher of watchers) {
    watcher.kill();
  }
}
process.on('SIGINT', stopWatchers);
process.on('SIGTERM', stopWatchers);

await Promise.all(watchers.map((watcher) => watcher.exited));
