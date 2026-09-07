import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

// Rslib empties `dist` before its first watch build, so ui's declaration build would see
// tokens as untyped if both watchers started together. Start tokens, wait for its artifacts
// to be rewritten, then start ui.
const repoRoot = resolve(import.meta.dir, '..');
const startedAt = Date.now();
const stages = [
  {
    workspace: '@calcifer-design/tokens',
    artifacts: ['packages/tokens/dist/index.d.ts', 'packages/tokens/dist/tokens.css'],
  },
  { workspace: '@calcifer-design/ui', artifacts: [] },
];

const processes: Bun.Subprocess[] = [];
let stopping = false;

function stopAll() {
  stopping = true;
  for (const child of processes) {
    child.kill();
  }
}
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

async function isRebuilt(relativePath: string): Promise<boolean> {
  try {
    return (await stat(resolve(repoRoot, relativePath))).mtimeMs >= startedAt;
  } catch {
    return false;
  }
}

async function waitForArtifacts(artifacts: string[]): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (!stopping && Date.now() < deadline) {
    const rebuilt = await Promise.all(artifacts.map(isRebuilt));
    if (rebuilt.every(Boolean)) {
      return;
    }
    await Bun.sleep(200);
  }
  if (!stopping) {
    console.warn('dev: the tokens watcher did not rebuild in time; starting ui anyway');
  }
}

for (const stage of stages) {
  if (stopping) {
    break;
  }
  processes.push(
    Bun.spawn(['bun', 'run', '--filter', stage.workspace, 'dev'], {
      cwd: repoRoot,
      stdout: 'inherit',
      stderr: 'inherit',
    }),
  );
  if (stage.artifacts.length > 0) {
    await waitForArtifacts(stage.artifacts);
  }
}

if (stopping) {
  stopAll();
  await Promise.all(processes.map((child) => child.exited));
  process.exit(0);
}

const exitCodes = await Promise.all(processes.map((child) => child.exited));
process.exit(exitCodes.find((code) => code !== 0) ?? 0);
