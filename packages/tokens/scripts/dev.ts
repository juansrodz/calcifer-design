import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const packageRoot = resolve(import.meta.dir, '..');
const distIndex = resolve(packageRoot, 'dist/index.js');
const startedAt = Date.now();

const rslibWatcher = Bun.spawn(['rslib', 'build', '--watch'], {
  cwd: packageRoot,
  stdout: 'inherit',
  stderr: 'inherit',
});

// Rslib empties `dist` before its first watch build. `write-css.ts` writes `dist/tokens.css`
// next to Rslib's output, and `bun --watch` only re-runs it when `src` changes, so starting it
// first leaves both apps without `@calcifer/tokens/tokens.css` for the whole session. Wait for
// the first build to land (a `dist/index.js` newer than this process) before writing the CSS.
async function waitForFirstBuild(): Promise<void> {
  const deadline = startedAt + 60_000;
  while (Date.now() < deadline) {
    try {
      const stats = await stat(distIndex);
      if (stats.mtimeMs >= startedAt) {
        return;
      }
    } catch {
      // dist/index.js is gone while Rslib cleans; keep polling.
    }
    await Bun.sleep(100);
  }
  rslibWatcher.kill();
  throw new Error(`Rslib did not produce ${distIndex} within 60s`);
}

await waitForFirstBuild();

const cssWatcher = Bun.spawn(['bun', '--watch', 'scripts/write-css.ts'], {
  cwd: packageRoot,
  stdout: 'inherit',
  stderr: 'inherit',
});

const watchers = [rslibWatcher, cssWatcher];

function stopWatchers() {
  for (const watcher of watchers) {
    watcher.kill();
  }
}
process.on('SIGINT', stopWatchers);
process.on('SIGTERM', stopWatchers);

await Promise.all(watchers.map((watcher) => watcher.exited));
