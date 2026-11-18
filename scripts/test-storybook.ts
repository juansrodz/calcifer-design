import { spawn } from 'node:child_process';
import { resolve, sep } from 'node:path';

// Serves the built Storybook (`bun run storybook:build` writes packages/ui/storybook-static) on a
// free loopback port and runs `@storybook/test-runner` against it: every story renders in
// headless Chromium and every `play` function runs; a story that throws fails the run. Extra
// arguments go to `test-storybook` (`bun run storybook:test --verbose`, `--maxWorkers 2`, ...).
const repoRoot = resolve(import.meta.dir, '..');
const uiDirectory = resolve(repoRoot, 'packages/ui');
const staticDirectory = resolve(uiDirectory, 'storybook-static');

if (!(await Bun.file(resolve(staticDirectory, 'index.json')).exists())) {
  console.error(
    'storybook:test: packages/ui/storybook-static/index.json is missing; run `bun run storybook:build` first',
  );
  process.exit(1);
}

function notFound(): Response {
  return new Response('Not found', { status: 404 });
}

// Port 0: the OS picks a free port, so this never collides with a running `storybook dev`.
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const relativePath = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const filePath = resolve(staticDirectory, `.${relativePath}`);
    if (!filePath.startsWith(staticDirectory + sep)) {
      return notFound();
    }
    const file = Bun.file(filePath);
    return (await file.exists()) ? new Response(file) : notFound();
  },
});

// `detached` puts the runner in a process group of its own, which jest and its workers join, so
// a signal sent to this script alone can be passed to all of them instead of orphaning the
// workers. Ctrl-C in a terminal, or closing it, reaches only this script, which passes the signal
// on the same way.
const runner = spawn(
  resolve(repoRoot, 'node_modules/.bin/test-storybook'),
  ['--url', `http://127.0.0.1:${server.port}`, ...process.argv.slice(2)],
  { cwd: uiDirectory, stdio: 'inherit', detached: true },
);
const runnerExited = new Promise<number | null>((settle) => {
  runner.on('exit', (code) => settle(code));
  runner.on('error', (error) => {
    console.error(`storybook:test: could not start test-storybook: ${error.message}`);
    settle(null);
  });
});

// A negative pid addresses the runner's whole process group, and signal 0 only tests that the group
// exists. Returns whether the group was there to receive the signal.
function signalRunnerGroup(signal: NodeJS.Signals | 0): boolean {
  if (runner.pid === undefined) {
    return false;
  }
  try {
    process.kill(-runner.pid, signal);
    return true;
  } catch {
    return false;
  }
}

function runnerGroupAlive(): boolean {
  return signalRunnerGroup(0);
}

let stopped = false;
function stop(): void {
  stopped = true;
  signalRunnerGroup('SIGTERM');
}
process.on('SIGHUP', stop);
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

const exitCode = await runnerExited;
// `test-storybook` is a wrapper that can exit before jest has finished its teardown (which closes
// the browser), so wait for the group to empty. jest-worker replaces a worker that dies mid-run,
// so a stop can leave a fresh worker behind; whatever outlives the wait is killed.
const groupDeadline = Date.now() + 5_000;
while (runnerGroupAlive() && Date.now() < groupDeadline) {
  await Bun.sleep(100);
}
signalRunnerGroup('SIGKILL');
await server.stop(true);
// 143 (128 + SIGTERM) whenever the run was stopped, whichever signal stopped it.
process.exit(stopped ? 143 : (exitCode ?? 1));
