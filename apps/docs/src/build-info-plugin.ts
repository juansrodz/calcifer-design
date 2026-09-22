import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RsbuildPlugin } from '@rsbuild/core';

const thisModuleDirectory = dirname(fileURLToPath(import.meta.url));

/** Where `@module-federation/observability-plugin` writes its file, relative to the app root. */
export const OBSERVABILITY_BUILD_INFO = join('.mf', 'observability', 'build-info.json');

export interface BuildStamp {
  commit: string | null;
  ref: string | null;
  builtAt: string;
  /** The library version this app documents — the docs app has no version of its own. */
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
 * library version and the commit it was built from, the way every other card does. A missing
 * source file is a warning here and a failure in `test/dist`, which is what CI runs.
 */
export function pluginBuildInfo(): RsbuildPlugin {
  return {
    name: 'docs:build-info',
    setup(api) {
      api.onAfterBuild(async () => {
        const sourcePath = resolve(api.context.rootPath, OBSERVABILITY_BUILD_INFO);
        const distRoot = api.context.distPath;
        try {
          const observability = JSON.parse(await readFile(sourcePath, 'utf8')) as Record<
            string,
            unknown
          >;
          await mkdir(distRoot, { recursive: true });
          const merged = mergeBuildInfo(observability, buildStamp(process.env, gitReader));
          await writeFile(
            join(distRoot, 'build-info.json'),
            `${JSON.stringify(merged, null, 2)}\n`,
          );
        } catch (error) {
          api.logger.warn(`build-info.json was not written into ${distRoot}: ${String(error)}`);
        }
      });
    },
  };
}
