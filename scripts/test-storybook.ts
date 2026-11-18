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

const runner = Bun.spawn(
  [
    resolve(uiDirectory, 'node_modules/.bin/test-storybook'),
    '--url',
    `http://127.0.0.1:${server.port}`,
    ...process.argv.slice(2),
  ],
  { cwd: uiDirectory, stdout: 'inherit', stderr: 'inherit' },
);

function stop() {
  runner.kill();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

const exitCode = await runner.exited;
await server.stop(true);
process.exit(exitCode);
