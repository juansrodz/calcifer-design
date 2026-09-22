/** This app's own version, from its package.json, defined at build time. */
declare const DOCS_VERSION: string;
/**
 * Where the Storybook build is served from, relative to this app's origin. `/storybook` live
 * and in a production build; Task 5's dev proxy is what makes that path exist in dev too.
 */
declare const STORYBOOK_BASE_URL: string;
