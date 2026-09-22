/**
 * The `@calcifer-design/ui` version this app documents, from `packages/ui/package.json`, defined
 * at build time. This app is private and never published; the library's number is the one a
 * visitor could act on, and it is what the build stamp carries too.
 */
declare const DOCS_VERSION: string;
/** The Base UI range `packages/ui/package.json` depends on, defined at build time. */
declare const BASE_UI_VERSION: string;
/**
 * Where the Storybook build is served from, relative to this app's origin. `/storybook` live
 * and in a production build; `src/dev/proxy.ts` is what makes that path exist in dev too.
 */
declare const STORYBOOK_BASE_URL: string;
