export interface PrerenderedPage {
  markup: string;
  scripts: string;
  title: string;
  stylesheets: string[];
}

const MOUNT_POINT = '<div id="root"></div>';
const BODY_END = '</body>';
const HEAD_END = '</head>';
const TITLE = /<title>[^<]*<\/title>/;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Turns Rsbuild's HTML template into a prerendered page: the app markup inside `#root`,
 * the router's dehydrated `$_TSR` scripts right before `</body>` (Rsbuild's own bundle tags
 * sit in `<head>` with `defer`, so they run after this inline script has executed), the
 * route's title, and one `<link rel="stylesheet">` per async stylesheet right before
 * `</head>` so the page is styled before its route chunk loads. Throws rather than writing
 * a page that would not hydrate.
 */
export function injectPrerender(template: string, page: PrerenderedPage): string {
  if (!template.includes(MOUNT_POINT)) {
    throw new Error(`template has no empty ${MOUNT_POINT} (#root) mount point`);
  }
  if (!template.includes(BODY_END)) {
    throw new Error('template has no </body>');
  }
  if (!template.includes(HEAD_END)) {
    throw new Error('template has no </head>');
  }
  if (!TITLE.test(template)) {
    throw new Error('template has no <title>');
  }
  const stylesheetLinks = page.stylesheets
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`)
    .join('');
  return template
    .replace(MOUNT_POINT, () => `<div id="root">${page.markup}</div>`)
    .replace(BODY_END, () => `${page.scripts}${BODY_END}`)
    .replace(HEAD_END, () => `${stylesheetLinks}${HEAD_END}`)
    .replace(TITLE, () => `<title>${escapeHtml(page.title)}</title>`);
}
