import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RsbuildPlugin } from '@rsbuild/core';

// See shared-dependencies.ts for why this is fileURLToPath and not new URL(...) (the jsdom test
// environment).
const thisModuleDirectory = dirname(fileURLToPath(import.meta.url));

/** Where `@module-federation/observability-plugin` writes its file, relative to the app root. */
export const OBSERVABILITY_BUILD_INFO = join('.mf', 'observability', 'build-info.json');

export interface BuildStamp {
  commit: string | null;
  ref: string | null;
  builtAt: string;
  /**
   * The `@calcifer-design/ui` version this app documents. The app is private and never
   * published, so it takes the library's number rather than claiming one of its own — the same
   * value `DOCS_VERSION` is defined from, which is what makes the standalone eyebrow, the
   * portfolio's card for this remote and this stamp agree.
   */
  version: string;
}

/** Runs `git <arguments>` and returns the trimmed output, or null when git is unavailable. */
export type GitReader = (gitArguments: string[]) => string | null;

export const gitReader: GitReader = (gitArguments) => {
  try {
    return execFileSync('git', gitArguments, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

function readUiVersion(): string {
  const uiPackageJson = JSON.parse(
    readFileSync(resolve(thisModuleDirectory, '../../../packages/ui/package.json'), 'utf8'),
  ) as { version?: unknown };
  if (typeof uiPackageJson.version !== 'string') {
    throw new Error('packages/ui/package.json has no version.');
  }
  return uiPackageJson.version;
}

export const uiVersion = readUiVersion();

/** GitHub Actions variables first, then git, then null — the order the portfolio's own stamp uses. */
export function buildStamp(
  env: Record<string, string | undefined>,
  readGit: GitReader,
  now: Date = new Date(),
): BuildStamp {
  const commit = env['GITHUB_SHA'] ?? readGit(['rev-parse', 'HEAD']);
  const ref = env['GITHUB_REF_NAME'] ?? readGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  return {
    commit: commit || null,
    ref: ref || null,
    builtAt: now.toISOString(),
    version: uiVersion,
  };
}

export function mergeBuildInfo(
  observability: Record<string, unknown>,
  stamp: BuildStamp,
): Record<string, unknown> {
  return { ...observability, build: stamp };
}

/**
 * After a production build, copies the observability plugin's build-info.json into the dist
 * root with the `build` stamp merged in, so the portfolio's card for this remote shows the
 * library version and the commit it was built from, the way every other card does. Only a
 * missing or unparsable source file is tolerated (a warning here, a failure in `test/dist`,
 * which is what CI runs) — once that file is read, a failure to write into this app's own dist
 * output is a real build failure and propagates.
 */
export function pluginBuildInfo(): RsbuildPlugin {
  return {
    name: 'docs:build-info',
    setup(api) {
      api.onAfterBuild(async () => {
        const sourcePath = resolve(api.context.rootPath, OBSERVABILITY_BUILD_INFO);
        const distRoot = api.context.distPath;
        let observability: Record<string, unknown>;
        try {
          observability = JSON.parse(await readFile(sourcePath, 'utf8')) as Record<string, unknown>;
        } catch (error) {
          api.logger.warn(`build-info.json was not written into ${distRoot}: ${String(error)}`);
          return;
        }
        await mkdir(distRoot, { recursive: true });
        const merged = mergeBuildInfo(observability, buildStamp(process.env, gitReader));
        await writeFile(join(distRoot, 'build-info.json'), `${JSON.stringify(merged, null, 2)}\n`);
      });
    },
  };
}
