# Phase 4 Plan B — Tier 2, the floating surfaces

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the five Tier 2 components — `Popover`, `Dialog` (with a sheet variant), `Menu`, `Tooltip`, `ToastRegion` — to `@calcifer-design/ui` on one shared popup skin, share the visually-hidden block that six components currently copy, and implement spec §5.3's provider rule across `calcifer-design` and `portfolio-mfe`: the host mounts the single toast provider, portal and viewport and passes its manager through the Bridge props contract.

**Architecture:** Every component in this tier is a thin wrapper over a Base UI 1.8.0 part set that already supplies focus management, dismissal and ARIA wiring. What the wrappers add is the visible state: one shared stylesheet, `src/styles/popup.module.css`, holds the layering, the surface, the viewport clamp, the transform origin and the entry/exit transition, and each component varies it through a `data-popup` attribute on the same element. `Popover` is authored first and alone because it establishes that file; `Dialog`, `Menu` and `Tooltip` then add only what is genuinely their own (a centring viewport, an item row, a tip's typography). `ToastRegion` is the exception and is sequenced last: a toast stack is not an anchored surface, and Base UI drives it through five custom properties of its own. The cross-repository half threads a toast manager object — a plain closure over a listener set, with no React context and no module identity requirement — from the shell into every remote through `HostProps`, which is the only channel that survives a separate React root.

**Tech Stack:** React 19, TypeScript, Base UI 1.8.0, CSS Modules, Rslib (bundleless ESM), Storybook 10.6 on `storybook-react-rsbuild`, Vitest 5 + Testing Library + `vitest-axe`, Changesets, Module Federation 2.9 with `@module-federation/bridge-react`, CodeArtifact for `@calcifer-design/contract`.

**Spec:** `/Users/calcifer/Code/portfolio-mfe-worktrees/gamma/docs/superpowers/specs/2026-09-12-portfolio-mfe-phase-4-design-system-remote-design.md`. Sections 2.1, 5 (all of it, 5.1 through 5.3), 8, 9 and 10 are the ones this plan implements. The spec is the binding authority; where this plan departs from it, the departure is argued in "Decisions taken up front" below and must be recorded in the spec's §12 Errata.

**Worktrees — this plan spans two repositories:**

| Tasks | Repository | Worktree | Branch |
| ----- | ---------- | -------- | ------ |
| 1–9 | `calcifer-design` (the library) | `/Users/calcifer/Code/calcifer-design-worktrees/gamma` | a fresh branch off `origin/main` (currently `99de531`, the Tier 1 release commit) |
| 10–13 | `portfolio-mfe` (the host and the contract) | `/Users/calcifer/Code/portfolio-mfe-worktrees/gamma` | `gamma/storybook-remote`, which is four spec-docs commits ahead of `main` and carries nothing else |

Do not create another worktree in either repository.

**Repository 2's worktree has no `node_modules` yet.** The library worktree is installed; the `portfolio-mfe` one has never been. Task 10 Step 0 runs `bun install` there, and nothing in Tasks 10–13 — every one of which invokes `./node_modules/.bin/<tool>` — works before it does.

**Before Task 1, clear the library worktree.** It is one commit behind `origin/main` and holds an untracked Tier 2 spike from an earlier session — `packages/ui/src/components/{Popover,Dialog,Menu,Tooltip,ToastRegion}/`, `packages/ui/src/styles/popup.module.css`, `packages/ui/src/styles/a11y.module.css`, `packages/ui/src/baseui-probe.test.tsx`, `packages/ui/src/baseui-probe2.test.tsx`, and a modified `packages/tokens/src/tokens.ts`:

```bash
git fetch origin
git switch --create gamma/tier-2-floating-surfaces origin/main
git checkout -- packages/tokens/src/tokens.ts
rm -rf packages/ui/src/components/Popover packages/ui/src/components/Dialog \
  packages/ui/src/components/Menu packages/ui/src/components/Tooltip \
  packages/ui/src/components/ToastRegion packages/ui/src/styles/popup.module.css \
  packages/ui/src/styles/a11y.module.css packages/ui/src/styles/a11y.module.css.d.ts \
  packages/ui/src/styles/popup.module.css.d.ts packages/ui/src/baseui-probe.test.tsx \
  packages/ui/src/baseui-probe2.test.tsx
```

The two `.d.ts` files are in that list for the same reason Task 1 Step 4 deletes `LiveRegion.module.css.d.ts` by hand: they are generated and gitignored, they are on disk in this worktree right now, and a stale declaration left behind would keep `tsc` happy about a stylesheet that no longer exists until Task 3 writes the real one. The component folders' own `.d.ts` files are covered by the directory removals.

Every file this plan needs is written out in full below. A half-finished spike sitting underneath the tasks is how a test ends up passing against code the plan did not prescribe.

**The main checkout has its own uncommitted half-migration** (`packages/ui/src/styles/a11y.module.css` untracked, `Spinner.tsx` and `Avatar.module.css` modified). None of it is on `main`, so a fresh worktree does not see it. Do not consume it: Task 1 authors that file from scratch, and the `composes:` line in that checkout's `Avatar.module.css` fails `bun run lint` (`property-no-unknown`, `value-keyword-case`) and inlines a duplicate of the rule into every consuming stylesheet at build time. Mechanism A — one CSS Module imported from TSX — is what Task 1 uses, and it emits exactly one copy.

---

## Global Constraints

Copied from the spec and from both repositories' own rules. Every task's requirements implicitly include this section.

- **No single-letter identifiers anywhere**, including arrow-function parameters and loop variables. ESLint enforces it in both repositories (`id-length` minimum 2, no exceptions). Unused parameters must be prefixed `_` (`argsIgnorePattern: '^_'`).
- **`npx`, `bunx` and `bun x` are blocked.** Run tools as `./node_modules/.bin/<tool>` from the worktree root, or through a package script.
- **Never run `prettier --write .`, `bun run format`, or any format command over a tree.** Format only the files you touched, by explicit path.
- **Commits carry no `Co-Authored-By` and no "generated by" trailer.**
- Do not run `git add -A` or `git commit -a`. Stage the files you changed, by explicit path.
- **Heading props are `heading` and `headingLevel`**, never `title`/`titleLevel` — the Tier 1 convention, applied library-wide by commit `14112b0`. Base UI's own parts keep their own names (`Popover.Title`, `Dialog.Title`, `Toast.Title`); only the wrapper's prop is renamed. The level maps to a tag through a `{ 2: 'h2', 3: 'h3', 4: 'h4' } as const` lookup with a `?? ` fallback, because JavaScript callers are not held to the union.
- **Component shape:** `export function Name({ ...destructured with inline defaults }: NameProps)` — a named function declaration. No `forwardRef`, no `memo`, no `defaultProps`, no arrow-const components.
- **Types:** `export interface NameProps` beside the component. Union aliases are exported only when something else reuses them; one-off unions stay inline on the prop.
- **Variants are data attributes**, never composed class names. The boolean idiom is `condition ? '' : undefined`.
- **Barrel:** `packages/ui/src/index.ts` gains an adjacent value/type export pair per component, **appended** rather than alphabetised.
- **Every CSS value for a token-governed property must be a `var(--token)`.** Stylelint's `scale-unlimited/declaration-strict-value` governs, in full: every property ending `color`, `background`, `fill`, `stroke`, `outline-color`, `border-color`, `font-size`, `font-family`, `line-height`, `letter-spacing`, every `margin*` and `padding*` longhand and shorthand, `gap`/`row-gap`/`column-gap`, `border-radius`, `box-shadow`, `transition-duration`, `transition-timing-function`, every `border*` longhand and shorthand, `outline`, `animation-duration`, `animation-timing-function`, `transition`, `text-shadow`. `ignoreVariables: true`, `ignoreFunctions: false`, `expandShorthand: true`. `1px` and `solid` are allowed on `border*` and `outline` only; `max(var(--…), …)` is allowed on `padding` and `padding-inline` only.
- **Motion is the longhand triple**, never `transition:` — the shorthand is rejected three times over, because `expandShorthand` reads the property name inside it as a value. `animation:` shorthand is fine when every value is a token.
- `z-index`, `max-height`, `max-width`, `min-width`, `width`, `height`, `inset`, `transform`, `transform-origin`, `opacity`, `overflow*`, `overscroll-behavior`, `transition-property`, `transition-behavior`, `animation-name`, `animation-iteration-count` and `animation-direction` are **not** governed; bare values are fine there.
- `@keyframes` names are kebab-case (`keyframes-name-pattern`). `@media (min-width: 48rem)` prefix notation only, never `(width >= 48rem)`, and never a `max-width` query.
- **`*.module.css.d.ts` files are gitignored and generated.** Never write one by hand and never commit one. `bun run --filter @calcifer-design/ui build` regenerates them; `bun run test` does not need them (Vitest resolves CSS Modules itself with `classNameStrategy: 'non-scoped'`, so `styles.root` is the string `'root'` in tests and `a11yStyles.visuallyHidden` is `'visuallyHidden'`).
- **Tier 2 stories live under the `Overlays/` group** (`title: 'Overlays/<Name>'`), a new group beside the existing `Primitives/` and `Navigation/`. `argTypes` appear only for enum props, as `{ control: 'radio', options: [...] }`. Callback args use `fn()` from `storybook/test`.
- **Each component task ends with `bun run typecheck`, explicitly.** On Plan A, `prettier`, `eslint` and `stylelint` all passed on code `tsc` rejected.
- CI gates a changeset on every touched published package (`changeset status --since=origin/main`). `@calcifer-design/ui` and `@calcifer-design/tokens` are published; `@calcifer-design/contract` is published to CodeArtifact; the apps and `@calcifer-design/build-tools` are private and versionless, so they need none.

**Commands, verified working from each worktree root** — from the library worktree today, and from the `portfolio-mfe` worktree once Task 10 Step 0's `bun install` has run:

| Purpose | Command |
| ------- | ------- |
| One library component's tests | `./node_modules/.bin/vitest run --project ui <Name>` |
| One library test file, with console output | `./node_modules/.bin/vitest run --project ui <Name> --silent=false --reporter=verbose` |
| Every library unit test | `bun run test` |
| Library lint (ESLint + Stylelint + Prettier check) | `bun run lint` |
| Library typecheck (builds tokens and ui first) | `bun run typecheck` |
| Format one file | `./node_modules/.bin/prettier --write <path>` |
| Everything library CI runs | `bun run check` |
| One portfolio app's tests | `./node_modules/.bin/vitest run --project shell <Name>` (or `--project showcase`) |
| Portfolio typecheck | `bun run typecheck` |
| Portfolio lint | `bun run lint` |
| Portfolio unit tests | `bun run test` |

---

## Decisions taken up front

The spec leaves six questions open or answers them in a way this tier cannot honour. Each is settled here, with the reason, and each is recorded in the spec's §12 Errata by **Task 10 Step 1** — the only step in this plan that can write them. The spec lives in `portfolio-mfe`, not in the library, so Tasks 1–9 cannot touch it however much they depart from it.

**1. The NavMenu overlap: Popover authors the skin, NavMenu migrates onto it afterwards, and the migration ships as a minor because it changes how a live component behaves.**

`NavMenu` already composes Base UI's `Menu` and already carries a `.positioner` (`z-index: 50`) and a `.popup` (eight declarations: flex column, `min-width: 12rem`, `padding: var(--space-2)`, hairline border, `--radius-lg`, `--color-surface-raised`, `--elevation-2`). That is the static half of a popup skin and nothing more: it has no viewport clamp, no `transform-origin`, no `[data-starting-style]`/`[data-ending-style]` transition, no backdrop, and not one `@keyframes`. Three routes were available — extract NavMenu's rules into a shared file and have Popover consume them; author the skin fresh in Popover and migrate NavMenu onto it; or leave NavMenu alone and accept two skins.

This plan takes the middle route, in two commits: **Task 3 writes the skin fresh** (Popover needs the clamp, the origin, the transition and the scrim regardless, and none of them exist in NavMenu to extract), and **Task 8 migrates NavMenu onto it** as its own explicitly-scoped task with its own changeset. Extracting from NavMenu first is the trap: `min-width: 12rem` and `padding: var(--space-2)` are dropdown-shaped, a popover holding a paragraph wants neither, and after parameterising them the "shared" part would be four declarations.

**Is it breaking?** Not in the API sense: `NavMenuProps`, `NavItem` and `LinkRenderProps` are untouched, so the published surface of 0.1.2 and the staged 0.2.0 is unchanged. But the behaviour of a live component does change, in more ways than a first reading of the two rules suggests, so the changeset is a **minor**, not a patch — `@calcifer-design/ui` is pre-1.0, a patch reaches every `^0.2.x` consumer with no signal at all, and the tier already takes a minor, so saying it out loud costs nothing.

Counted against the real `.popup` rule, the delta is: the rendered class name on the popup (hashes are `[local]-[hash:base64:5]` and already change whenever a rule's content changes, so nothing stable is being broken); **an entry and exit transition it does not have today**, so the mobile navigation on jsrodriguez.dev will fade and scale where it currently appears instantly; a `transform-origin` for that transition to grow out of; the viewport clamp (`max-width`/`max-height` from the positioner's own custom properties) with `overflow-y: auto` and `overscroll-behavior: contain` behind it; an explicit `color: var(--color-text)` where the popup previously inherited it from the body; and Base UI's `[data-instant]` escape hatch. The one declaration the shared surface adds that a nav dropdown genuinely does not want — `gap: var(--space-2)`, which would put 8px between every item in the live mobile menu — is switched off in the `data-popup='menu'` variant Task 3 writes, so neither `NavMenu` nor `Menu` inherits it. `base.css` already collapses the motion under `prefers-reduced-motion`. All of that is a deliberate visual change to a live component, which is exactly why it is its own task, its own review and its own changeset.

**2. `Dialog` composes Base UI's `Dialog`, not the native `<dialog>` element.** Spec §3 says "`Dialog` uses native `<dialog>` with `showModal()`" and spec §2.1 says Popover's skin "is reused by every other component in the tier". Both cannot hold. Base UI's `Dialog.Popup` renders a plain `<div role="dialog">` — measured, not assumed — and brings the focus trap, the scroll lock, the nested-dialog bookkeeping (`--nested-dialogs`), the same `data-starting-style`/`data-ending-style` hooks the rest of the tier animates on, and `@base-ui/react/alert-dialog` as a near-free variant later. `showModal()` would put exactly one component in the top layer, where the shared `z-index` and the `.scrim` class do not apply, and would need its own `::backdrop` animation story. §2.1 wins; §3's sentence is an erratum.

**3. Base UI 1.8.0's `Drawer` is rejected for the sheet variant, in writing.** 1.8.0 does ship `@base-ui/react/drawer` with `Root/Trigger/Portal/Backdrop/Viewport/Popup/Content/Indent/IndentBackground/SwipeArea/Title/Description/Close/Provider/VirtualKeyboardProvider/createHandle` — swipe-to-dismiss, snap points and an iOS virtual-keyboard provider already solved. It is rejected here for three reasons: the sheet this tier needs is a bottom-docked dialog on a narrow viewport, not a draggable drawer; `Drawer` is a second anatomy with its own parts and its own state attributes, which is precisely the "one skin" claim this tier is built on; and adopting it is a component in its own right, with its own stories, tests and changeset. If a screen later asks for swipe-to-dismiss or snap points, `Drawer` is the right answer then and this note is the reason it was not the answer now.

**4. `Toast` does not wear the popup skin, and the spec's §2.1 sentence is narrowed.** "Popover's popup, positioner and animation skin is reused by every other component in the tier" holds for `Dialog`, `Menu` and `Tooltip`. `Toast` has no positioner in the stacked form, no anchor, and a transform system of its own driven by `--toast-index`, `--toast-offset-y`, `--toast-height` and `--toast-swipe-movement-x/y`. It takes exactly one thing from the shared file — its `z-index` — so the tier's stacking order stays in one place. Sequencing Toast last is right; claiming it reuses the skin is not.

**5. The contract types the toast manager as a minimal structural subset, and the cross-boundary payload is `string`, not `ReactNode`.** `@calcifer-design/contract` must not gain a dependency on `@base-ui/react`; it is plumbing, and a UI library inside it would be dragged into every remote that types itself against it. More importantly, the contract is the promise the **live** shell already keeps: every method it names is a method some remote may call against a shell built months earlier, with no compilation shared between them and therefore no compile-time signal when it is wrong. So it declares `add`, `close` and `update` and nothing else — not `promise()`, not an action button, not `actionProps`. `title` and `description` are `string` because a `ReactNode` authored in a remote would render inside the **host's** React root, under the host's CSS. The existing `hostReact: unknown` plus showcase's duck-typed `sharesReactInstance()` is the precedent, and it is the right one.

The contract's `close` also takes a **required** `toastId`, where the library's own manager makes it optional. Measured, not assumed: Base UI's `closeToast` reads `const closeAll = toastId === undefined` and then clears every timer and every toast in the store. That is a reasonable thing for the host that owns the region to do and an unreasonable thing to hand a remote, which would be wiping toasts the shell raised and toasts a different remote raised. Narrowing the parameter costs nothing — a `(toastId?: string) => void` is still assignable to `(toastId: string) => void`, so the real manager satisfies the contract unchanged — and it is the one authority question the three-method surface could not answer on its own. Ids remain global to the host's store, and the interface says so.

**6. The stacking order lives in `popup.module.css` as three literals, and the scrim becomes a token.** There is no `--z-*` token and `z-index` is not a governed property, so `.layer` (50), `.dialogLayer` (60) and `.toastLayer` (70) are literals, in one file, with the reason written above them. The scrim is different: `background: rgb(0 0 0 / 40%)` is rejected by stylelint, and the only token that passes — `var(--color-surface-inverse)` at reduced opacity — inverts between themes, because `surface-inverse` is near-black in light mode and near-white in dark. Task 2 adds `--color-scrim` to `@calcifer-design/tokens` for that reason alone.

---

## What the probes measured

Every claim below was produced by running Base UI 1.8.0 in this repository's own jsdom setup, not read from documentation. Tasks depend on them; a test written against the intuition instead of the measurement fails.

- **`toHaveStyle` reads computed style.** `toHaveStyle({ height: '8rem' })` can never pass in jsdom — assert `element.style.height` for inline-style wiring. (Carried over from Plan A, still true.)
- **Focus arrives a frame late, and asserting it without `waitFor` is flaky, not wrong.** `Popover`'s popup does take focus when it opens — by click and by Enter, modal and not — but whether `findByRole('dialog')` resolves before or after that frame depends on what ran earlier in the file. The spike's own Popover test failed on exactly this assertion as its sixth test and passed as its first. **Every focus assertion in this plan is wrapped in `waitFor`.**
- **The same applies to `Menu`'s highlight.** After `{ArrowDown}` on the trigger, the first item gets real DOM focus a frame later. Pressing `{Enter}` before it lands sends the key to the trigger, which closes the menu and selects nothing — the failure looks like "Base UI does not activate items from the keyboard", and it is not. Wait for `toHaveFocus()` on the item first.
- **`Dialog` focuses its own close control**, not the popup, and only after a frame. `Popover` in modal mode focuses the visually-hidden close control this plan renders.
- **A popover's focus trap silently requires a `Popover.Close` descendant.** `PopoverPopup.js` computes `focusManagerModal = modal !== false && hasClosePart`. `modal` with no `Close` inside the popup arms nothing. Task 3 renders a visually-hidden `Popover.Close` whenever `modal` is set — the first consumer of Task 1's shared class.
- **Portalled content is not inside the container `render()` returns**, so the house `axe(container)` never sees a popup. Tier 2 asserts over `document.body` through a new `axeDocument()` helper, with axe's `region` rule disabled there and only there: it asks that every node sit inside a landmark, which a component test's bare render can never satisfy. Measured: an open `Menu` and an open `Tooltip` both raise `region` and nothing else; an open `Dialog` raises nothing at all, because everything outside a modal is inert.
- **`Tooltip` puts nothing in the accessibility tree.** No `role="tooltip"`, no `aria-describedby` on the trigger, and it is disabled on touch devices. The wrapper therefore requires a `label` and applies it as the trigger's `aria-label` as well as the tip's text, so the two cannot drift.
- **`Toast.Close` renders `aria-hidden="true"` while the viewport is collapsed and unfocused**, and it is focusable at the same time. It is deliberate (`'aria-hidden': !expanded && !hasFocus`). Two consequences: `getByRole('button', { name: 'Close' })` cannot find it — use `getByLabelText('Close')`, which can — and a browser-based axe run would flag `aria-hidden-focus`, so the Toast story that shows a toast carries a documented rule exclusion. Do not "fix" it by overriding `aria-hidden`.
- **`Toast.Title`, `Toast.Description` and `Toast.Action` render `null` when the toast carries no such field**, so all four parts are rendered unconditionally and the manager options decide.
- **Two `ToastRegion`s under one manager render two landmarks and two copies of every toast.** That is the failure spec §9 asks tests to guard against, and it is why the provider, portal and viewport ship as one component nobody can half-mount.
- **`createToastManager().add()` with no region mounted returns an id and drops the toast**, silently. Documented on the wrapper.
- **A positioner starts at `opacity: 0` until Floating UI reports it positioned**, which never happens in jsdom. Never assert visibility through computed style; assert role, name and text.

---

## File structure

### Repository 1 — `calcifer-design` (Tasks 1–9)

**Created:**

| File | Responsibility |
| ---- | -------------- |
| `packages/ui/src/styles/a11y.module.css` | The one `.visuallyHidden` class, replacing seven copies. |
| `packages/ui/src/styles/a11y.test.tsx` | Proves the block is declared once and that its six consumers use it. |
| `packages/ui/src/styles/popup.module.css` | The tier's shared skin: layering, surface, clamp, origin, transition, scrim. |
| `packages/ui/src/components/Popover/Popover.tsx` | Anchored dialog; heading, description, optional modal focus trap. |
| `packages/ui/src/components/Popover/Popover.module.css` | Only the heading and description type; everything else is the shared skin. |
| `packages/ui/src/components/Popover/Popover.stories.tsx` | Sides, alignment, modal, open-on-load, a keyboard play story. |
| `packages/ui/src/components/Popover/Popover.test.tsx` | axe over the document; focus in and out; the modal close control. |
| `packages/ui/src/components/Dialog/Dialog.tsx` | Centred dialog and bottom sheet, header, body, footer, close control. |
| `packages/ui/src/components/Dialog/Dialog.module.css` | The centring viewport, the header row, the scrolling body, the footer. |
| `packages/ui/src/components/Dialog/Dialog.stories.tsx` | Trigger-opened, open-on-load, sheet, non-dismissible. |
| `packages/ui/src/components/Dialog/Dialog.test.tsx` | axe; focus lands on Close; Escape; outside press; the sheet variant. |
| `packages/ui/src/components/Menu/Menu.tsx` | A list of actions on the shared skin, with separators and disabled items. |
| `packages/ui/src/components/Menu/Menu.module.css` | The item row, its highlight and the separator. |
| `packages/ui/src/components/Menu/Menu.stories.tsx` | Default, aligned, open-on-load, a keyboard play story. |
| `packages/ui/src/components/Menu/Menu.test.tsx` | axe; arrow keys; Enter selects; disabled items; Escape restores focus. |
| `packages/ui/src/components/Tooltip/Tooltip.tsx` | A tip that is also the trigger's accessible name. |
| `packages/ui/src/components/Tooltip/TooltipProvider.tsx` | The delay group every remote mounts, plus `TOOLTIP_DELAY`. |
| `packages/ui/src/components/Tooltip/Tooltip.stories.tsx` | Under a provider, instant, below. |
| `packages/ui/src/components/Tooltip/Tooltip.test.tsx` | axe; the label reaches the trigger; hover opens and closes. |
| `packages/ui/src/components/ToastRegion/ToastRegion.tsx` | Provider + portal + viewport as one component; `createToastManager`. |
| `packages/ui/src/components/ToastRegion/ToastRegion.module.css` | The stack, its offsets, the tone rail, the action and close controls. |
| `packages/ui/src/components/ToastRegion/ToastRegion.stories.tsx` | A trigger that raises toasts, with the `aria-hidden-focus` exclusion. |
| `packages/ui/src/components/ToastRegion/ToastRegion.test.tsx` | One landmark; tone; action; close; update; the orphaned-manager case. |
| `.changeset/visually-hidden.md` … `.changeset/nav-menu-popup-skin.md` | One per task, listed in each task. |

**Modified:**

| File | Change |
| ---- | ------ |
| `packages/ui/src/components/LiveRegion/LiveRegion.tsx` | Uses the shared class; its stylesheet is deleted outright. |
| `packages/ui/src/components/LiveRegion/LiveRegion.module.css` | **Deleted** — its `.root` was entirely the visually-hidden block. |
| `packages/ui/src/components/Alert/Alert.tsx` + `.module.css` | `.toneWord` replaced by the shared class. |
| `packages/ui/src/components/Avatar/Avatar.tsx` + `.module.css` | `.name` replaced by the shared class. |
| `packages/ui/src/components/Spinner/Spinner.tsx` + `.module.css` | `.label` replaced by the shared class. |
| `packages/ui/src/components/StatusDot/StatusDot.tsx` + `.module.css` | `.label[data-hidden]` replaced by the shared class. |
| `packages/ui/src/components/DataTable/DataTable.tsx` + `.module.css` | Both copies replaced, including the lossy one on the stacked header. |
| `packages/ui/src/components/NavMenu/NavMenu.tsx` + `.module.css` | Positioner and popup move to the shared skin (Task 8). |
| `packages/ui/src/components/NavMenu/NavMenu.test.tsx` | One appended test: the popup wears the shared surface (Task 8). |
| `packages/ui/test/axe.ts` | Gains `axeDocument()` for portalled surfaces. |
| `packages/tokens/src/tokens.ts` | `--color-scrim` in both themes. |
| `packages/tokens/test/generate.test.ts` | Asserts the scrim is emitted in both themes. |
| `packages/ui/src/index.ts` | Value/type export pairs appended per component. |
| `packages/ui/test/dist/ui-dist.test.ts` | The five new names, plus the two shared stylesheets. |
| `README.md:27` | The component list. |

### Repository 2 — `portfolio-mfe` (Tasks 10–13)

**Created:**

| File | Responsibility |
| ---- | -------------- |
| `apps/shell/src/toast/host-toast.ts` | The single module-scope toast manager the host owns. |
| `apps/shell/src/toast/host-toast.test.tsx` | One landmark in the mounted app; a toast raised through the manager. |
| `.changeset/host-toast.md` | Minor on `@calcifer-design/contract`. |

**Modified:**

| File | Change |
| ---- | ------ |
| `docs/superpowers/specs/2026-09-12-portfolio-mfe-phase-4-design-system-remote-design.md` | §12 Errata for every departure in "Decisions taken up front" (Task 10 Step 1, its own commit). |
| `packages/contract/src/remote-app.ts` | `HostToastOptions`, `HostToastManager`, optional `hostToast` on `HostProps`. |
| `packages/contract/src/index.ts` | Exports the two new types. |
| `packages/contract/test/remote-app.test-d.ts` | Type tests for the manager's shape and its optionality. |
| `apps/shell/src/routes/__root.tsx` | Mounts `<ToastRegion>` once, beside the devtools, and wraps the frame in `<TooltipProvider>`. |
| `apps/shell/src/federation/RemoteRoute.tsx` | `hostToast` added to the `HostProps` literal. |
| `apps/shell/src/federation/RemoteRoute.test.tsx` | The Bridge mock reports the prop; one test asserts it arrives. |
| `apps/shell/package.json` | `@calcifer-design/ui` to `^0.3.0` **and `@calcifer-design/tokens` to `^0.2.0`**; `@base-ui/react` at `catalog:` (Task 13). |
| `apps/showcase/src/app.tsx` | Host manager or its own; `TooltipProvider` around the tree. |
| `apps/showcase/src/host/host-store.ts` | `toast` in `HostState`, plus `raiseToast`. |
| `apps/showcase/src/pages/Playground.tsx` | A control that raises a toast through whichever manager is in play. |
| `apps/showcase/src/pages/Playground.test.tsx` | One appended test: the control calls the manager in the store. |
| `apps/showcase/src/app.test.tsx` | Federated uses the host's manager and mounts no region; standalone does both. |
| `apps/showcase/test/render.tsx` | `resetHostStore` covers the new field. |
| `apps/showcase/package.json` | `@calcifer-design/ui` to `^0.3.0` **and `@calcifer-design/tokens` to `^0.2.0`**; `@base-ui/react` at `catalog:` (Task 13). |
| `package.json` | `@base-ui/react` in the workspace catalog (Task 13). |
| `packages/build-tools/src/shared-dependencies.ts` | `strictVersion`, the Base UI range, both shared keys (Task 13). |
| `packages/build-tools/test/shared-dependencies.test.ts` | The inverted assertion (Task 13). |

---

## Task 1: One visually-hidden class for the whole library

**Files:**

- Create: `packages/ui/src/styles/a11y.module.css`
- Create: `packages/ui/src/styles/a11y.test.tsx`
- Create: `.changeset/visually-hidden.md`
- Modify: `packages/ui/src/components/LiveRegion/LiveRegion.tsx`
- Delete: `packages/ui/src/components/LiveRegion/LiveRegion.module.css`
- Modify: `packages/ui/src/components/Alert/Alert.tsx`, `Alert.module.css`
- Modify: `packages/ui/src/components/Avatar/Avatar.tsx`, `Avatar.module.css`
- Modify: `packages/ui/src/components/Spinner/Spinner.tsx`, `Spinner.module.css`
- Modify: `packages/ui/src/components/StatusDot/StatusDot.tsx`, `StatusDot.module.css`
- Modify: `packages/ui/src/components/DataTable/DataTable.tsx`, `DataTable.module.css`

**Interfaces:**

- Consumes: nothing.
- Produces: `packages/ui/src/styles/a11y.module.css`, a CSS Module whose single export is `visuallyHidden: string`, imported as `import a11yStyles from '../../styles/a11y.module.css';` from a component and `'../styles/a11y.module.css'` from `src/styles/`. Tasks 3 and 7 both use it. It is **internal**: it is not added to `packages/ui/package.json`'s `exports` map, which stays `"."` and `"./base.css"`.

**Why this goes first, and what it is not.** The block appears seven times in six files, and one of those copies has already diverged: `DataTable.module.css:124-130` drops `margin: -1px`, `padding: 0`, `white-space: nowrap` and `border: 0`. Two of those omissions are functional — without the negative margin the hidden `<thead>` still occupies a 1×1 cell in a `border-collapse: collapse` table, and without `nowrap` the 1px box can become one pixel wide and arbitrarily tall, and a screen reader may report the clipped text line-broken. Nothing in `bun run check` compares two stylesheets, so the divergence was invisible. Tier 2 adds five more components that want the class; sharing it afterwards would mean twelve copies to reconcile. This task does **not** put the class in `base.css`: that file is global, unhashed and optional for consumers, and a global `.visually-hidden` would become de-facto public API and collide with whatever the consuming app already defines.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/styles/a11y.test.tsx`:

```tsx
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installMatchMedia } from '../../test/matchMedia';
import { Alert } from '../components/Alert/Alert';
import { Avatar } from '../components/Avatar/Avatar';
import * as dataTableStories from '../components/DataTable/DataTable.stories';
import { LiveRegion } from '../components/LiveRegion/LiveRegion';
import { Spinner } from '../components/Spinner/Spinner';
import { StatusDot } from '../components/StatusDot/StatusDot';

const { Stacked } = composeStories(dataTableStories);

const stylesRoot = path.resolve(import.meta.dirname, '.');
const componentsRoot = path.resolve(import.meta.dirname, '../components');

async function collectStylesheets(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectStylesheets(entryPath)));
    } else if (entry.name.endsWith('.module.css')) {
      files.push(entryPath);
    }
  }
  return files;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the visually-hidden block', () => {
  it('is declared once, and no component stylesheet keeps a copy', async () => {
    const stylesheets = await collectStylesheets(componentsRoot);
    expect(stylesheets.length).toBeGreaterThan(10);
    const offenders: string[] = [];
    for (const stylesheet of stylesheets) {
      const css = await readFile(stylesheet, 'utf8');
      if (css.includes('clip-path: inset(50%)')) {
        offenders.push(path.basename(stylesheet));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps every declaration the pattern needs, so no copy can go lossy again', async () => {
    const css = await readFile(path.join(stylesRoot, 'a11y.module.css'), 'utf8');
    // The four that DataTable's second copy dropped are the reason this list is spelled out:
    // without `margin: -1px` the 1px box still takes part in layout, and without
    // `white-space: nowrap` the clipped text can wrap to an arbitrary height.
    for (const declaration of [
      'position: absolute',
      'width: 1px',
      'height: 1px',
      'margin: -1px',
      'padding: 0',
      'overflow: hidden',
      'clip-path: inset(50%)',
      'white-space: nowrap',
      'border: 0',
    ]) {
      expect(css, declaration).toContain(declaration);
    }
  });

  it('hides the live region itself', () => {
    render(<LiveRegion message="Loading Federation Showcase" />);
    expect(screen.getByRole('status')).toHaveClass('visuallyHidden');
  });

  it("hides Alert's tone word, which is what keeps colour from being the only signal", () => {
    render(<Alert tone="warning">Two versions behind.</Alert>);
    expect(screen.getByText('Warning')).toHaveClass('visuallyHidden');
  });

  it("hides Avatar's full name, leaving the initials decorative", () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByText('Ada Lovelace')).toHaveClass('visuallyHidden');
  });

  it("hides Spinner's label inside its status region", () => {
    render(<Spinner label="Loading projects" />);
    expect(screen.getByText('Loading projects')).toHaveClass('visuallyHidden');
  });

  it("hides StatusDot's label when the caller asks for it, and not otherwise", () => {
    const { rerender } = render(<StatusDot status="loaded" label="showcase" showLabel={false} />);
    expect(screen.getByText('showcase')).toHaveClass('visuallyHidden');
    rerender(<StatusDot status="loaded" label="showcase" />);
    expect(screen.getByText('showcase')).not.toHaveClass('visuallyHidden');
  });

  it("hides DataTable's header row when it stacks, keeping the columns in the tree", () => {
    installMatchMedia(false);
    const { container } = render(<Stacked />);
    expect(container.querySelector('thead')).toHaveClass('visuallyHidden');
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui a11y`

Expected: FAIL — `a11y.module.css` does not exist, so the module import in the components has nothing to resolve and the declaration assertions cannot read the file.

- [ ] **Step 3: Write the shared stylesheet**

Create `packages/ui/src/styles/a11y.module.css`:

```css
/* The one visually-hidden class in the library: clipped to a 1px box, pulled out of layout by a
   negative margin, and held on one line so a screen reader reads it as written. Imported from
   TSX rather than `composes`-d into each stylesheet — `composes` copies the whole rule into
   every consuming stylesheet at build time (the duplication, moved from source to dist) and
   stylelint rejects it outright (`property-no-unknown`, `value-keyword-case`). */
.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  /* stylelint-disable-next-line scale-unlimited/declaration-strict-value -- canonical visually-hidden pattern; no negative spacing token */
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 4: Migrate LiveRegion, and delete its stylesheet**

`LiveRegion`'s `.root` was *entirely* the visually-hidden block, so the file goes. Replace `packages/ui/src/components/LiveRegion/LiveRegion.tsx` with:

```tsx
import a11yStyles from '../../styles/a11y.module.css';

export interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export function LiveRegion({ message, politeness = 'polite' }: LiveRegionProps) {
  const role = politeness === 'assertive' ? 'alert' : 'status';
  return (
    <div
      className={a11yStyles.visuallyHidden}
      role={role}
      aria-live={politeness}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
```

Then delete the stylesheet:

```bash
git rm packages/ui/src/components/LiveRegion/LiveRegion.module.css
rm -f packages/ui/src/components/LiveRegion/LiveRegion.module.css.d.ts
```

The `.d.ts` is generated and gitignored; `rm` it so a stale declaration cannot keep `tsc` happy about an import that no longer exists.

- [ ] **Step 5: Migrate Alert**

In `packages/ui/src/components/Alert/Alert.tsx`, add the import above the existing `styles` import:

```tsx
import a11yStyles from '../../styles/a11y.module.css';
```

and change the tone-word span:

```tsx
        <span className={a11yStyles.visuallyHidden}>{toneWords[tone]}</span>
```

In `packages/ui/src/components/Alert/Alert.module.css`, delete the whole `.toneWord` rule (the last rule in the file, twelve lines including its disable comment).

- [ ] **Step 6: Migrate Avatar**

In `packages/ui/src/components/Avatar/Avatar.tsx`, add the import and change the name span:

```tsx
import a11yStyles from '../../styles/a11y.module.css';
```

```tsx
        <span className={a11yStyles.visuallyHidden}>{name}</span>
```

In `packages/ui/src/components/Avatar/Avatar.module.css`, delete the `.name` rule.

- [ ] **Step 7: Migrate Spinner**

In `packages/ui/src/components/Spinner/Spinner.tsx`, add the import and change the label span:

```tsx
import a11yStyles from '../../styles/a11y.module.css';
```

```tsx
      <span className={a11yStyles.visuallyHidden}>{label}</span>
```

In `packages/ui/src/components/Spinner/Spinner.module.css`, delete the `.label` rule. `.wrapper` stays.

- [ ] **Step 8: Migrate StatusDot**

`StatusDot`'s label is hidden conditionally, and it keeps its own `.label` rule for the visible case, so both classes are applied. In `packages/ui/src/components/StatusDot/StatusDot.tsx`, add the import and replace the label span:

```tsx
import a11yStyles from '../../styles/a11y.module.css';
```

```tsx
      <span
        className={[styles.label, showLabel ? null : a11yStyles.visuallyHidden]
          .filter(Boolean)
          .join(' ')}
        data-hidden={showLabel ? undefined : ''}
      >
        {label}
      </span>
```

`data-hidden` stays as the state marker — it is the styling hook a consumer would reach for, and it costs nothing — but the hiding itself now comes from the shared class. In `packages/ui/src/components/StatusDot/StatusDot.module.css`, delete the `.label[data-hidden]` rule. The remaining `.label` rule's `overflow: hidden` and `white-space: nowrap` agree with the shared class rather than fighting it, and `min-width: 0` is inert on an absolutely-positioned box.

- [ ] **Step 9: Migrate DataTable, both copies**

In `packages/ui/src/components/DataTable/DataTable.tsx`, add the import:

```tsx
import a11yStyles from '../../styles/a11y.module.css';
```

Change the caption to carry the shared class when hidden, keeping `data-hidden` as the state marker:

```tsx
        <caption
          id={captionId}
          className={[styles.caption, hideCaption ? a11yStyles.visuallyHidden : null]
            .filter(Boolean)
            .join(' ')}
          data-hidden={hideCaption ? '' : undefined}
        >
          {caption}
        </caption>
```

and the header row, which is the lossy copy — the component already knows whether it is stacked, so the choice moves from a descendant selector to the className:

```tsx
        <thead className={stacked ? a11yStyles.visuallyHidden : styles.head}>
```

In `packages/ui/src/components/DataTable/DataTable.module.css`, delete the `.table[data-stacked] .head` rule outright and **cut `.caption[data-hidden]` down to one declaration**:

```css
/* One survivor of the shared-class migration, and the reason is a specificity tie. `.caption`
   declares `padding: var(--space-3) var(--space-5)` and the shared `.visuallyHidden` declares
   `padding: 0`; both are single-class selectors, but they live in two separately emitted
   stylesheets, so the winner is decided by the consumer's bundle order — and with the a11y
   import above `./DataTable.module.css`, `.caption` wins and the hidden caption keeps its
   padding. `[data-hidden]` takes the specificity to (0,2,0) and settles it. The head needs no
   such rule: `.head` is not applied at all when the table is stacked. */
.caption[data-hidden] {
  padding: 0;
}
```

The `.head` rule itself stays for the unstacked case. This is the one place in this task where a `data-hidden` selector survives, and the padding is the whole reason.

- [ ] **Step 10: Run the tests to verify they pass**

```bash
./node_modules/.bin/vitest run --project ui a11y
bun run test
```

Expected: the first PASSes with 8 tests; the second PASSes whole — 149 existing tests plus these 8. If `LiveRegion.test.tsx` fails on a missing module, the generated `LiveRegion.module.css.d.ts` was left behind; delete it.

- [ ] **Step 11: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/styles packages/ui/src/components/LiveRegion \
  packages/ui/src/components/Alert packages/ui/src/components/Avatar \
  packages/ui/src/components/Spinner packages/ui/src/components/StatusDot \
  packages/ui/src/components/DataTable
./node_modules/.bin/eslint packages/ui/src/styles packages/ui/src/components
./node_modules/.bin/stylelint "packages/ui/src/**/*.css"
bun run typecheck
```

Expected: all four silent, and `bun run typecheck` exits 0.

- [ ] **Step 12: Write the changeset**

Create `.changeset/visually-hidden.md`:

```markdown
---
'@calcifer-design/ui': patch
---

Share one visually-hidden class across the library instead of copying the block into each component's stylesheet. `LiveRegion`, `Alert`, `Avatar`, `Spinner`, `StatusDot` and `DataTable` all used it, and `DataTable`'s stacked header had already lost four of its nine declarations — including the negative margin that takes the 1px box out of layout. The hidden elements' generated class names change; nothing in the public API does.
```

- [ ] **Step 13: Commit**

```bash
git add packages/ui/src/styles packages/ui/src/components/LiveRegion \
  packages/ui/src/components/Alert packages/ui/src/components/Avatar \
  packages/ui/src/components/Spinner packages/ui/src/components/StatusDot \
  packages/ui/src/components/DataTable .changeset/visually-hidden.md
git commit -m "refactor(ui): one visually-hidden class for the whole library"
```

---

## Task 2: A scrim token

**Files:**

- Modify: `packages/tokens/src/tokens.ts`
- Modify: `packages/tokens/test/generate.test.ts`
- Create: `.changeset/scrim-token.md`

**Interfaces:**

- Consumes: nothing.
- Produces: `--color-scrim` in both themes, reachable from CSS as `var(--color-scrim)` and from TS as `tokens.themes.light.color.scrim`. Task 3's `.scrim` rule is its only consumer, and Task 4 inherits it through `Dialog.Backdrop`.

**Why a token and not a literal.** `Dialog` and a modal `Popover` need a translucent black behind them. `background: rgb(0 0 0 / 40%)` is rejected by `declaration-strict-value`, and the one existing token that passes lint — `var(--color-surface-inverse)` at reduced opacity — is near-black in light mode and near-white in dark, so it would invert the scrim exactly where it matters. The dark value is darker and heavier than the light one on purpose: a dark surface needs more separation from a dark page than a light surface needs from a light one.

- [ ] **Step 1: Write the failing test**

In `packages/tokens/test/generate.test.ts`, append a case to the existing `describe` block, in the style of the neighbouring "emits the new colour roles and the material family":

```ts
  it('emits the scrim in both themes, so a modal backdrop does not invert between them', () => {
    expect(css).toContain(`--color-scrim: ${tokens.themes.light.color.scrim};`);
    expect(css).toContain(`--color-scrim: ${tokens.themes.dark.color.scrim};`);
    expect(tokens.themes.light.color.scrim).not.toBe(tokens.themes.dark.color.scrim);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project tokens generate`

Expected: FAIL — `Property 'scrim' does not exist` at type level, and the emitted CSS contains no `--color-scrim`.

- [ ] **Step 3: Add the token to both themes**

In `packages/tokens/src/tokens.ts`, in `lightColor`, immediately after the `cardBorder` entry:

```ts
  /** The scrim behind a modal dialog. Warm black at 45%, so the page reads as inert, not gone. */
  scrim: 'rgba(28, 25, 23, 0.45)',
```

and in `darkColor`, in the same position after its `cardBorder` entry:

```ts
  /** Heavier than the light theme's: a dark surface needs more separation from a dark page. */
  scrim: 'rgba(3, 4, 6, 0.6)',
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
./node_modules/.bin/vitest run --project tokens
bun run --filter @calcifer-design/tokens build
```

Expected: PASS, and `packages/tokens/dist/tokens.css` now contains `--color-scrim` in the `:root` block and again in both dark blocks. The contrast tests are unaffected: they iterate `textContrastPairs` and `uiContrastPairs`, which are explicit lists, and the scrim is in neither — it is a wash over content, not a foreground on a background.

- [ ] **Step 5: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/tokens/src/tokens.ts packages/tokens/test/generate.test.ts
./node_modules/.bin/eslint packages/tokens
bun run typecheck
```

- [ ] **Step 6: Write the changeset**

Create `.changeset/scrim-token.md`:

```markdown
---
'@calcifer-design/tokens': minor
---

Add `--color-scrim`, the wash behind a modal surface, themed separately in light and dark. The alternative — reusing `--color-surface-inverse` at a reduced opacity — inverts between themes, because that role is near-black in light mode and near-white in dark.
```

Changesets rewrites `@calcifer-design/ui`'s `"@calcifer-design/tokens": "^0.1.1"` range when it versions the release, so `ui@0.3.0` declares `tokens@^0.2.0`. Do not edit that range by hand.

**That rewrite is not what delivers the variable to an app.** It installs a copy of `tokens` under `ui`, and nothing imports that copy's `tokens.css`. Both apps in `portfolio-mfe` import `@calcifer-design/tokens/tokens.css` from their **own** top-level dependency, which is `^0.1.1` today and — a caret on a 0.x version pinning the minor — can never resolve 0.2.0. Tasks 11 and 12 each move that line to `^0.2.0` for exactly this reason, and both check the resolved file. This is the coupling worth remembering for any consumer outside this workspace too: adding a token for a component makes the component's release useless to anyone who does not also take the token release.

- [ ] **Step 7: Commit**

```bash
git add packages/tokens/src/tokens.ts packages/tokens/test/generate.test.ts .changeset/scrim-token.md
git commit -m "feat(tokens): add the scrim colour"
```

---

## Task 3: Popover, and the popup skin the whole tier wears

**Files:**

- Create: `packages/ui/src/styles/popup.module.css`
- Create: `packages/ui/src/components/Popover/Popover.tsx`
- Create: `packages/ui/src/components/Popover/Popover.module.css`
- Create: `packages/ui/src/components/Popover/Popover.stories.tsx`
- Create: `packages/ui/src/components/Popover/Popover.test.tsx`
- Create: `.changeset/popover.md`
- Modify: `packages/ui/test/axe.ts` (add `axeDocument`)
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: `a11yStyles.visuallyHidden` from Task 1 (`import a11yStyles from '../../styles/a11y.module.css';`) and `var(--color-scrim)` from Task 2.
- Produces:
  - `packages/ui/src/styles/popup.module.css`, whose exports are `layer`, `dialogLayer`, `toastLayer`, `surface` and `scrim` (all `string`). Tasks 4, 5, 6 and 7 import it as `import popupStyles from '../../styles/popup.module.css';`.
  - `Popover` and `PopoverProps`, plus `PopupSide` (`'top' | 'bottom' | 'left' | 'right'`) and `PopupAlign` (`'start' | 'center' | 'end'`), which Tasks 5 and 6 import as types from `'../Popover/Popover'`.
  - `axeDocument()` in `packages/ui/test/axe.ts`, signature `() => Promise<AxeResults>`, used by Tasks 4, 5, 6 and 7.

**What this task exists to get right.** Three things, each measured rather than assumed. **Focus:** Base UI moves focus into the popup when it opens and back to the trigger when it closes, but it does so a frame after the popup mounts, so every focus assertion here waits. **The focus trap:** `PopoverPopup.js` computes `focusManagerModal = modal !== false && hasClosePart` — setting `modal` without rendering a `Popover.Close` inside the popup silently traps nothing, so this wrapper renders a visually-hidden close control whenever `modal` is set, which is Task 1's first new consumer. **The accessibility tree:** Base UI wires `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` on the trigger and `role="dialog"`, `aria-labelledby` and `aria-describedby` on the popup by itself; the wrapper's job is to make sure the heading and description parts exist so those ids point somewhere.

- [ ] **Step 1: Add the document-wide axe helper**

Every surface in this tier is portalled to `document.body`, which is outside the container `render()` returns — the existing `axe(container)` would pass on an empty subtree. Append to `packages/ui/test/axe.ts`:

```ts
/**
 * axe over the whole document, for a component whose surface is portalled to `document.body`
 * and therefore never appears inside the container `render()` returns.
 *
 * The `region` rule is disabled here and only here: it asks that every node sit inside a
 * landmark, which is a page-level requirement a component test's bare render cannot satisfy —
 * an open menu or tooltip raises it every time, and nothing else.
 */
export function axeDocument() {
  return runAxe(document.body, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
}
```

- [ ] **Step 2: Write the stories**

Create `packages/ui/src/components/Popover/Popover.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Popover } from './Popover';

const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  args: {
    trigger: <Button variant="secondary">Remote details</Button>,
    heading: 'Showcase remote',
    description: 'Loaded from the registry entry at /projects/showcase.',
    children: <p>Mounted 184ms after the route resolved.</p>,
  },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Above: Story = { args: { side: 'top' } };
export const AlignedToTheStart: Story = { args: { align: 'start' } };
export const Modal: Story = { args: { modal: true } };
export const OpenOnLoad: Story = { args: { defaultOpen: true } };

/** Opens from the keyboard and checks that focus lands inside the popup, not behind it. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Remote details' }).focus();
    await userEvent.keyboard('{Enter}');
    const popup = await screen.findByRole('dialog', { name: 'Showcase remote' });
    await expect(popup.contains(document.activeElement)).toBe(true);
  },
};
```

- [ ] **Step 3: Write the failing test**

Create `packages/ui/src/components/Popover/Popover.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import * as stories from './Popover.stories';

const { Default, Above, AlignedToTheStart, Modal, OpenOnLoad } = composeStories(stories);

describe('Popover', () => {
  it.each([
    ['Default', Default],
    ['Above', Above],
    ['AlignedToTheStart', AlignedToTheStart],
    ['Modal', Modal],
    ['OpenOnLoad', OpenOnLoad],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('keeps the popup out of the document until the trigger is pressed', async () => {
    render(<Default />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remote details' }));
    expect(await screen.findByRole('dialog', { name: 'Showcase remote' })).toBeInTheDocument();
  });

  it('names the popup with the heading and describes it with the description', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog', { name: 'Showcase remote' });
    expect(popup).toHaveAccessibleDescription(
      'Loaded from the registry entry at /projects/showcase.',
    );
  });

  it('renders the heading at the requested level', async () => {
    render(<OpenOnLoad headingLevel={2} />);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Showcase remote' }),
    ).toBeInTheDocument();
  });

  it('marks the trigger as the popup owner, so the state is in the accessibility tree', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Remote details' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('moves focus into the popup when it opens and back to the trigger when it closes', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Remote details' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const popup = await screen.findByRole('dialog');
    // `waitFor`, not a bare expect: Base UI moves focus a frame after the popup mounts, and
    // `findByRole` resolves as soon as the node exists. Measured — the same assertion without
    // this wrapper passes or fails depending on what ran earlier in the file.
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('renders no close control when it is not modal, so the popup holds only its own content', async () => {
    render(<OpenOnLoad />);
    await screen.findByRole('dialog');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('renders a visually-hidden close control when modal, which is what arms the focus trap', async () => {
    render(<Modal defaultOpen />);
    const popup = await screen.findByRole('dialog');
    const close = screen.getByRole('button', { name: 'Close' });
    expect(popup).toContainElement(close);
    expect(close).toHaveClass('visuallyHidden');
  });

  it('closes from that control', async () => {
    render(<Modal defaultOpen />);
    await screen.findByRole('dialog');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('reports every open and close through onOpenChange', async () => {
    const onOpenChange = vi.fn();
    render(<Default onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remote details' }));
    await screen.findByRole('dialog');
    expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything()));
  });

  it('marks the popup so the shared skin can style it', async () => {
    render(<OpenOnLoad />);
    expect(await screen.findByRole('dialog')).toHaveAttribute('data-popup', 'popover');
  });
});
```

`onOpenChange` is asserted with a second `expect.anything()` argument on purpose: Base UI calls it as `(open, eventDetails)`, and a test written for a one-argument handler would pass today and mislead whoever next reads it.

- [ ] **Step 4: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui Popover`

Expected: FAIL — the suite cannot resolve `./Popover` from the stories file.

- [ ] **Step 5: Write the shared popup skin**

Create `packages/ui/src/styles/popup.module.css`:

```css
/* The one popup skin for Tier 2. Popover authors it; Dialog, Menu and Tooltip wear it unchanged
   and vary only through the `data-popup` attribute set on the same element. The variants live
   here rather than in each component's own stylesheet on purpose: two single-class rules in two
   separately emitted stylesheets tie on specificity, and which one won would then depend on the
   consumer's bundle order.

   Base UI's positioner sets `--transform-origin`, `--available-width` and `--available-height`
   on itself and they inherit into the popup, so the surface grows out of its anchor and clamps
   to the viewport with no measurement of our own. Dialog has no positioner: there those custom
   properties are undefined, the two `max-*` declarations become invalid at computed-value time
   and fall back to `none`, and the `data-popup='dialog'` rule supplies the real limits. */

/* The stacking order for the whole tier, in one place. `z-index` is not a token-governed
   property and there is no `--z-*` token, so these are literals: anchored popups sit above the
   shell's sticky header, the dialog above them, toasts above everything, because a toast can
   report a failure that happened inside a dialog. A backdrop shares its popup's layer and sits
   below it on DOM order alone — Base UI's anatomy always renders the backdrop first. */
.layer {
  z-index: 50;
}

.dialogLayer {
  z-index: 60;
}

.toastLayer {
  z-index: 70;
}

.surface {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: var(--available-width);
  max-height: var(--available-height);
  padding: var(--space-2);
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  color: var(--color-text);
  box-shadow: var(--elevation-2);
  transform-origin: var(--transform-origin);
  transition-property: opacity, transform;
  transition-duration: var(--motion-duration-2);
  transition-timing-function: var(--motion-ease);
}

.surface[data-popup='popover'] {
  gap: var(--space-3);
  min-width: 14rem;
  padding: var(--space-4);
}

/* `gap: 0` is the point of this variant as much as the width is. A menu's rows are adjacent so
   the roving highlight reads as one list rather than a column of floating chips, the separator
   supplies its own spacing where a group boundary is wanted, and it is what keeps Task 8's
   migration from silently adding 8px between every item of the live mobile navigation. */
.surface[data-popup='menu'] {
  gap: 0;
  min-width: 12rem;
}

.surface[data-popup='tooltip'] {
  max-width: 18rem;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}

.surface[data-popup='dialog'] {
  gap: var(--space-4);
  width: min(32rem, 100%);
  max-width: 100%;
  max-height: 85dvh;
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  box-shadow: var(--elevation-3);
}

.surface[data-popup='sheet'] {
  gap: var(--space-4);
  width: 100%;
  max-width: 100%;
  max-height: 85dvh;
  padding: var(--space-5);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: var(--elevation-3);
}

/* Base UI drives the entry and the exit with these two attributes. Its handbook prefers a
   transition over an animation because a transition can be cancelled part-way, which is what a
   popup reopened mid-close needs. base.css collapses both under prefers-reduced-motion. */
.surface[data-starting-style],
.surface[data-ending-style] {
  opacity: 0;
  transform: scale(0.96);
}

/* A sheet slides from the edge it is docked to rather than scaling out of a point. */
.surface[data-popup='sheet'][data-starting-style],
.surface[data-popup='sheet'][data-ending-style] {
  opacity: 1;
  transform: translateY(100%);
}

/* Base UI sets `data-instant` when a transition would be wrong: a second trigger taking over the
   same popup, or a dismissal that must feel immediate. Its value differs per component, so this
   matches on the attribute's presence alone. `transition-property: none` is the way to honour
   it — `transition-duration: 0s` is rejected by the token rule, which admits `0` but not `0s`. */
.surface[data-instant] {
  transition-property: none;
}

/* Base UI's backdrop renders a bare <div> with no positioning of its own, so the scrim's whole
   geometry is here. It carries no z-index: the consumer joins it with the layer class of the
   popup it belongs to. */
.scrim {
  position: fixed;
  inset: 0;
  background: var(--color-scrim);
  transition-property: opacity;
  transition-duration: var(--motion-duration-2);
  transition-timing-function: var(--motion-ease);
}

.scrim[data-starting-style],
.scrim[data-ending-style] {
  opacity: 0;
}
```

- [ ] **Step 6: Write Popover's own stylesheet**

Create `packages/ui/src/components/Popover/Popover.module.css`:

```css
/* Popover adds only what the shared popup skin cannot know: the type of its own heading and
   description. Surface, viewport clamp, transform origin and the entry transition all come from
   `src/styles/popup.module.css`, which Dialog, Menu and Tooltip wear too. */
.heading {
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: var(--leading-snug);
}

.description {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-prose);
}
```

- [ ] **Step 7: Write the component**

Create `packages/ui/src/components/Popover/Popover.tsx`:

```tsx
import { Popover as BasePopover } from '@base-ui/react/popover';
import type { ReactElement, ReactNode } from 'react';
import a11yStyles from '../../styles/a11y.module.css';
import popupStyles from '../../styles/popup.module.css';
import styles from './Popover.module.css';

export type PopupSide = 'top' | 'bottom' | 'left' | 'right';
export type PopupAlign = 'start' | 'center' | 'end';

export interface PopoverProps {
  /**
   * The control that opens the popover, rendered as the trigger itself: Base UI merges
   * `aria-haspopup`, `aria-expanded` and `aria-controls` onto this element, so it must be a
   * single element that produces a native `<button>` — `Button` and `IconButton` both do.
   */
  trigger: ReactElement;
  /** Names the popup: it is both the visible heading and the popup's `aria-labelledby` target. */
  heading: string;
  headingLevel?: 2 | 3 | 4;
  /** Sits under the heading and becomes the popup's `aria-describedby` target. */
  description?: ReactNode;
  children?: ReactNode;
  side?: PopupSide;
  align?: PopupAlign;
  /** Gap between the anchor and the popup, in pixels. */
  sideOffset?: number;
  /**
   * `true` locks page scroll, blocks pointer interaction outside, and paints the scrim.
   * `'trap-focus'` traps focus and nothing else: page scroll keeps working and clicks outside
   * still land, so it paints **no** scrim — a full-viewport wash that swallows every outside
   * click is exactly what that mode exists not to do. `false`, the default, does none of it.
   *
   * Either truthy value renders the visually-hidden close control below, because Base UI only
   * arms its focus trap when a `Popover.Close` is present inside the popup — `modal` on its own
   * traps nothing, silently — and because a touch screen reader needs a way out of the popup.
   */
  modal?: boolean | 'trap-focus';
  /** The accessible name of that close control. */
  closeLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  /**
   * Base UI calls this as `(open, eventDetails)`; a handler that takes only the first argument
   * is what most callers want, and the second is passed through untouched for one that doesn't.
   */
  onOpenChange?: (open: boolean, eventDetails: unknown) => void;
}

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export function Popover({
  trigger,
  heading,
  headingLevel = 3,
  description,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  modal = false,
  closeLabel = 'Close',
  open,
  defaultOpen,
  onOpenChange,
}: PopoverProps) {
  // The `?? 'h3'` is for JavaScript callers, who are not held to the `2 | 3 | 4` union: an
  // out-of-range level would otherwise resolve to `undefined` and throw in React as an invalid
  // element type. `@calcifer-design/ui` is consumed from JavaScript apps.
  const Heading = headingTags[headingLevel] ?? 'h3';
  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        {/* Only full `modal`, never `'trap-focus'`. Base UI's backdrop is a hit-testable element
            unless the popover was opened by hover (`PopoverBackdrop.js` sets
            `pointerEvents: 'none'` for `REASONS.triggerHover` and for nothing else), and the
            shared `.scrim` is `position: fixed; inset: 0`. Rendering it under `'trap-focus'`
            would block every outside click and wash the page over, which is precisely the
            behaviour that mode is documented as leaving alone. */}
        {modal === true ? (
          <BasePopover.Backdrop className={[popupStyles.layer, popupStyles.scrim].join(' ')} />
        ) : null}
        <BasePopover.Positioner
          className={popupStyles.layer}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BasePopover.Popup className={popupStyles.surface} data-popup="popover">
            <BasePopover.Title className={styles.heading} render={<Heading />}>
              {heading}
            </BasePopover.Title>
            {description === undefined ? null : (
              <BasePopover.Description className={styles.description}>
                {description}
              </BasePopover.Description>
            )}
            {children}
            {modal === false ? null : (
              <BasePopover.Close className={a11yStyles.visuallyHidden}>
                {closeLabel}
              </BasePopover.Close>
            )}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
```

- [ ] **Step 8: Append to the barrel**

Add to the end of `packages/ui/src/index.ts`:

```ts
export { Popover } from './components/Popover/Popover';
export type { PopoverProps, PopupSide, PopupAlign } from './components/Popover/Popover';
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `./node_modules/.bin/vitest run --project ui Popover`

Expected: PASS, 15 tests.

- [ ] **Step 10: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/components/Popover packages/ui/src/styles/popup.module.css packages/ui/test/axe.ts packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src/components/Popover packages/ui/test/axe.ts packages/ui/src/index.ts
./node_modules/.bin/stylelint "packages/ui/src/components/Popover/*.css" "packages/ui/src/styles/*.css"
bun run typecheck
```

Expected: all four silent, `bun run typecheck` exits 0.

- [ ] **Step 11: Write the changeset**

Create `.changeset/popover.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `Popover`: an anchored dialog with a heading, an optional description and collision-aware placement. Setting `modal` also renders a visually-hidden close control, because Base UI only arms its focus trap when a close part is present inside the popup — `modal` alone traps nothing. `modal={true}` paints a scrim; `modal="trap-focus"` does not, because that mode leaves page scroll and outside clicks working and a full-viewport backdrop would swallow both. Its surface, viewport clamp and entry transition come from a shared popup skin that `Dialog`, `Menu` and `Tooltip` wear too.

That scrim is `var(--color-scrim)`, new in `@calcifer-design/tokens@0.2.0`. An app that imports `tokens.css` from its own top-level dependency must move that dependency to `^0.2.0` as well — the range inside this package only nests a second copy nobody imports, and a missing custom property falls back to `transparent` with no error anywhere.
```

- [ ] **Step 12: Commit**

```bash
git add packages/ui/src/components/Popover packages/ui/src/styles/popup.module.css \
  packages/ui/test/axe.ts packages/ui/src/index.ts .changeset/popover.md
git commit -m "feat(ui): add Popover and the shared popup skin"
```

---

## Task 4: Dialog, with a sheet variant

**Files:**

- Create: `packages/ui/src/components/Dialog/Dialog.tsx`
- Create: `packages/ui/src/components/Dialog/Dialog.module.css`
- Create: `packages/ui/src/components/Dialog/Dialog.stories.tsx`
- Create: `packages/ui/src/components/Dialog/Dialog.test.tsx`
- Create: `.changeset/dialog.md`
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: `popupStyles` from Task 3 (`import popupStyles from '../../styles/popup.module.css';` — the `dialogLayer`, `surface` and `scrim` classes) and `var(--color-scrim)` from Task 2.
- Produces: `Dialog`, `DialogProps`, `DialogVariant` (`'center' | 'sheet'`). Nothing later in this plan consumes them.

**What is different about Dialog.** It has **no positioner** — `Dialog.Popup` sits directly under `Dialog.Portal` — so all the centring is this wrapper's CSS, on `Dialog.Viewport`, the optional positioning container Base UI added to the canonical anatomy in 1.8.0. (It is not the same concept as `Popover.Viewport`, which is a content-transition container for multi-trigger popups; do not describe them as one thing.) `modal` defaults to **`true`** here, the opposite of Popover, and the focus trap needs no close part to arm it. There is no `dismissible`, `closeOnOutsidePress` or `closeOnEscape` prop in Base UI: Escape always closes, and the only outside-press control is `disablePointerDismissal`, which this wrapper exposes the right way round as `dismissOnOutsidePress`. Measured: focus lands on the header's close control a frame after the popup mounts, an outside press closes by default and does not when `dismissOnOutsidePress={false}`, and axe over the whole document reports nothing while a modal dialog is open, because everything outside it is inert.

- [ ] **Step 1: Write the stories**

Create `packages/ui/src/components/Dialog/Dialog.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Dialog } from './Dialog';

const meta = {
  title: 'Overlays/Dialog',
  component: Dialog,
  args: {
    trigger: <Button variant="secondary">Remove remote</Button>,
    heading: 'Remove the showcase remote?',
    description: 'It disappears from the registry; the deployment itself is untouched.',
    children: <p>Anyone already on /projects/showcase will get the not-found page.</p>,
    footer: <Button size="sm">Remove</Button>,
  },
  argTypes: {
    variant: { control: 'radio', options: ['center', 'sheet'] },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const OpenOnLoad: Story = { args: { defaultOpen: true } };
export const Sheet: Story = { args: { variant: 'sheet', defaultOpen: true } };
export const Persistent: Story = { args: { defaultOpen: true, dismissOnOutsidePress: false } };

/** Opens from the keyboard and checks that focus is inside the dialog, not behind it. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Remove remote' }).focus();
    await userEvent.keyboard('{Enter}');
    const popup = await screen.findByRole('dialog', { name: 'Remove the showcase remote?' });
    await expect(popup.contains(document.activeElement)).toBe(true);
  },
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/ui/src/components/Dialog/Dialog.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import * as stories from './Dialog.stories';

const { Default, OpenOnLoad, Sheet, Persistent } = composeStories(stories);

describe('Dialog', () => {
  it.each([
    ['Default', Default],
    ['OpenOnLoad', OpenOnLoad],
    ['Sheet', Sheet],
    ['Persistent', Persistent],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('stays closed until the trigger is pressed, then names and describes itself', async () => {
    render(<Default />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove remote' }));
    const popup = await screen.findByRole('dialog', { name: 'Remove the showcase remote?' });
    expect(popup).toHaveAccessibleDescription(
      'It disappears from the registry; the deployment itself is untouched.',
    );
  });

  it('moves focus to the close control, so the first Tab lands inside the dialog', async () => {
    render(<Default />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove remote' }));
    const popup = await screen.findByRole('dialog');
    // Base UI focuses a frame after the popup mounts; `findByRole` returns before that.
    await waitFor(() => expect(within(popup).getByRole('button', { name: 'Close' })).toHaveFocus());
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Remove remote' });
    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('closes from the header control', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog');
    await userEvent.click(within(popup).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes on a press outside it', async () => {
    render(<OpenOnLoad />);
    await screen.findByRole('dialog');
    await userEvent.click(document.body);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps a persistent dialog open on a press outside it', async () => {
    render(<Persistent />);
    await screen.findByRole('dialog');
    await userEvent.click(document.body);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the heading as an h2 by default, and at the level asked for', async () => {
    const { unmount } = render(<OpenOnLoad />);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Remove the showcase remote?' }),
    ).toBeInTheDocument();
    unmount();
    render(<OpenOnLoad headingLevel={3} />);
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Remove the showcase remote?' }),
    ).toBeInTheDocument();
  });

  it('renders the footer inside the dialog', async () => {
    render(<OpenOnLoad />);
    const popup = await screen.findByRole('dialog');
    expect(within(popup).getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('marks the sheet variant on both the popup and the viewport that docks it', async () => {
    render(<Sheet />);
    const popup = await screen.findByRole('dialog');
    expect(popup).toHaveAttribute('data-popup', 'sheet');
    expect(popup.parentElement).toHaveAttribute('data-variant', 'sheet');
  });

  it('marks the centred variant too, so the two never share a rule by accident', async () => {
    render(<OpenOnLoad />);
    expect(await screen.findByRole('dialog')).toHaveAttribute('data-popup', 'dialog');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui Dialog`
Expected: FAIL — cannot resolve `./Dialog`.

- [ ] **Step 4: Write the stylesheet**

Create `packages/ui/src/components/Dialog/Dialog.module.css`:

```css
/* Dialog has no positioner, so the viewport is what centres the popup — or docks it to the
   bottom edge for the sheet variant. The popup surface itself is the shared popup skin in
   `src/styles/popup.module.css`, under `data-popup='dialog'` and `data-popup='sheet'`. */
.viewport {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-4);
}

.viewport[data-variant='sheet'] {
  place-items: end center;
  padding: 0;
}

.header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.heading {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--color-text);
  font-size: var(--text-h3);
  font-weight: 600;
  line-height: var(--leading-snug);
}

.description {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-prose);
}

/* The body is the only part that scrolls: the header and footer stay put, which is what makes a
   long dialog usable on a short viewport. */
.body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.close {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition-property: background-color, color;
  transition-duration: var(--motion-duration-1);
  transition-timing-function: var(--motion-ease);
}

.close > svg {
  width: 1rem;
  height: 1rem;
}

@media (hover: hover) {
  .close:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
}
```

- [ ] **Step 5: Write the component**

Create `packages/ui/src/components/Dialog/Dialog.tsx`:

```tsx
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ReactElement, ReactNode } from 'react';
import popupStyles from '../../styles/popup.module.css';
import styles from './Dialog.module.css';

export type DialogVariant = 'center' | 'sheet';

export interface DialogProps {
  /**
   * The control that opens the dialog. Optional: a dialog driven by application state passes
   * `open` and `onOpenChange` instead and renders no trigger at all.
   */
  trigger?: ReactElement;
  /** Names the popup: it is both the visible heading and the popup's `aria-labelledby` target. */
  heading: string;
  headingLevel?: 2 | 3 | 4;
  /** Sits under the heading and becomes the popup's `aria-describedby` target. */
  description?: ReactNode;
  children?: ReactNode;
  /**
   * Pinned below the scrolling body; put the confirming action here. These controls are the
   * caller's own — the header's close control always closes the dialog, and a footer control
   * that needs to close it does so through `open`/`onOpenChange`.
   */
  footer?: ReactNode;
  /** `center` floats in the middle of the viewport; `sheet` docks to the bottom edge. */
  variant?: DialogVariant;
  /** The accessible name of the close control in the header. */
  closeLabel?: string;
  /**
   * Whether a press outside the popup closes it. Escape always does: Base UI has no prop for
   * that, and vetoing it means cancelling the event inside `onOpenChange`, which this wrapper
   * deliberately does not expose.
   */
  dismissOnOutsidePress?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  /** Base UI calls this as `(open, eventDetails)`; the second argument is passed through. */
  onOpenChange?: (open: boolean, eventDetails: unknown) => void;
}

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m4.5 4.5 7 7" />
      <path d="m11.5 4.5-7 7" />
    </svg>
  );
}

export function Dialog({
  trigger,
  heading,
  headingLevel = 2,
  description,
  children,
  footer,
  variant = 'center',
  closeLabel = 'Close',
  dismissOnOutsidePress = true,
  open,
  defaultOpen,
  onOpenChange,
}: DialogProps) {
  // The `?? 'h2'` is for JavaScript callers, who are not held to the `2 | 3 | 4` union: an
  // out-of-range level would otherwise resolve to `undefined` and throw in React as an invalid
  // element type. `@calcifer-design/ui` is consumed from JavaScript apps.
  const Heading = headingTags[headingLevel] ?? 'h2';
  return (
    <BaseDialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      disablePointerDismissal={!dismissOnOutsidePress}
    >
      {trigger === undefined ? null : <BaseDialog.Trigger render={trigger} />}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={[popupStyles.dialogLayer, popupStyles.scrim].join(' ')} />
        <BaseDialog.Viewport
          className={[popupStyles.dialogLayer, styles.viewport].join(' ')}
          data-variant={variant}
        >
          <BaseDialog.Popup
            className={popupStyles.surface}
            data-popup={variant === 'sheet' ? 'sheet' : 'dialog'}
          >
            <div className={styles.header}>
              <BaseDialog.Title className={styles.heading} render={<Heading />}>
                {heading}
              </BaseDialog.Title>
              <BaseDialog.Close className={styles.close} aria-label={closeLabel}>
                <CloseIcon />
              </BaseDialog.Close>
            </div>
            {description === undefined ? null : (
              <BaseDialog.Description className={styles.description}>
                {description}
              </BaseDialog.Description>
            )}
            {children === undefined ? null : <div className={styles.body}>{children}</div>}
            {footer === undefined ? null : <div className={styles.footer}>{footer}</div>}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
```

- [ ] **Step 6: Append to the barrel**

Add to the end of `packages/ui/src/index.ts`:

```ts
export { Dialog } from './components/Dialog/Dialog';
export type { DialogProps, DialogVariant } from './components/Dialog/Dialog';
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `./node_modules/.bin/vitest run --project ui Dialog`
Expected: PASS, 14 tests.

- [ ] **Step 8: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/components/Dialog packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src/components/Dialog packages/ui/src/index.ts
./node_modules/.bin/stylelint "packages/ui/src/components/Dialog/*.css"
bun run typecheck
```

- [ ] **Step 9: Write the changeset**

Create `.changeset/dialog.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `Dialog`: a modal surface in two variants — centred, and a sheet docked to the bottom edge — on the same popup skin as `Popover`. Escape always closes it, because Base UI treats that as non-negotiable and offers no prop to turn it off; `dismissOnOutsidePress` covers the case a caller actually needs to control. Focus moves to the header's close control on open and back to the trigger on close.

Its backdrop is `var(--color-scrim)`, new in `@calcifer-design/tokens@0.2.0`: an app that imports `tokens.css` from its own top-level dependency needs that dependency at `^0.2.0`, or the dialog opens over a fully transparent page.
```

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/Dialog packages/ui/src/index.ts .changeset/dialog.md
git commit -m "feat(ui): add Dialog"
```

---

## Task 5: Menu

**Files:**

- Create: `packages/ui/src/components/Menu/Menu.tsx`
- Create: `packages/ui/src/components/Menu/Menu.module.css`
- Create: `packages/ui/src/components/Menu/Menu.stories.tsx`
- Create: `packages/ui/src/components/Menu/Menu.test.tsx`
- Create: `.changeset/menu.md`
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: `popupStyles` from Task 3 (`layer` and `surface`), and the two type aliases from Task 3 (`import type { PopupAlign, PopupSide } from '../Popover/Popover';`).
- Produces: `Menu`, `MenuProps`, `MenuItem` (`{ id: string; label: string; onSelect?: () => void; disabled?: boolean; separatorBefore?: boolean }`). Nothing later in this plan consumes them.

**Two facts that decide the tests.** Base UI's `Menu.Root` defaults `modal` to **`true`**, which locks page scroll; a command menu hanging off a toolbar button is not that, and `NavMenu` already ships `modal={false}` for the same reason, so this wrapper inverts the default and says so in the prop's doc comment. And the highlight arrives a frame after the popup mounts: after `{ArrowDown}` on the trigger, pressing `{Enter}` too early sends the key back to the trigger, which closes the menu and selects nothing. Measured — the test below waits for the item to hold focus first, and a test written without that wait fails intermittently and looks like a Base UI bug.

- [ ] **Step 1: Write the stories**

Create `packages/ui/src/components/Menu/Menu.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Menu } from './Menu';

const meta = {
  title: 'Overlays/Menu',
  component: Menu,
  args: {
    trigger: <Button variant="secondary">Remote actions</Button>,
    items: [
      { id: 'reload', label: 'Reload manifest', onSelect: fn() },
      { id: 'open', label: 'Open standalone', onSelect: fn() },
      { id: 'remove', label: 'Remove from registry', onSelect: fn(), separatorBefore: true },
      { id: 'pin', label: 'Pin version', onSelect: fn(), disabled: true },
    ],
  },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AlignedToTheStart: Story = { args: { align: 'start' } };
export const OpenOnLoad: Story = { args: { defaultOpen: true } };

/** Opens with the keyboard and checks the first item takes focus, so arrow keys work at once. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Remote actions' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(await screen.findByRole('menuitem', { name: 'Reload manifest' })).toHaveFocus();
  },
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/ui/src/components/Menu/Menu.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Button } from '../Button/Button';
import { Menu } from './Menu';
import * as stories from './Menu.stories';

const { Default, AlignedToTheStart, OpenOnLoad } = composeStories(stories);

describe('Menu', () => {
  it.each([
    ['Default', Default],
    ['AlignedToTheStart', AlignedToTheStart],
    ['OpenOnLoad', OpenOnLoad],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('marks the trigger as a menu owner and keeps the items out of the document until it opens', async () => {
    render(<Default />);
    const trigger = screen.getByRole('button', { name: 'Remote actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(await screen.findByRole('menuitem', { name: 'Reload manifest' })).toBeInTheDocument();
  });

  it('selects the highlighted item with Enter and closes', async () => {
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={<Button variant="secondary">Remote actions</Button>}
        items={[{ id: 'reload', label: 'Reload manifest', onSelect }]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Remote actions' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const reload = await screen.findByRole('menuitem', { name: 'Reload manifest' });
    // The highlight lands a frame after the popup mounts. Pressing Enter before it does sends
    // the key to the trigger, which closes the menu and selects nothing — measured, and the
    // reason this wait is here rather than a bare assertion.
    await waitFor(() => expect(reload).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('selects an item with the pointer', async () => {
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={<Button variant="secondary">Remote actions</Button>}
        items={[{ id: 'reload', label: 'Reload manifest', onSelect }]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remote actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Reload manifest' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape and returns focus to the trigger, selecting nothing', async () => {
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={<Button variant="secondary">Remote actions</Button>}
        items={[{ id: 'reload', label: 'Reload manifest', onSelect }]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Remote actions' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('menuitem', { name: 'Reload manifest' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('marks a disabled item in the accessibility tree and does not fire it', async () => {
    const onSelect = vi.fn();
    render(
      <Menu
        trigger={<Button variant="secondary">Remote actions</Button>}
        items={[{ id: 'pin', label: 'Pin version', onSelect, disabled: true }]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remote actions' }));
    const pin = await screen.findByRole('menuitem', { name: 'Pin version' });
    expect(pin).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(pin);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('draws a separator above an item that asks for one, and nowhere else', async () => {
    render(<OpenOnLoad />);
    await screen.findByRole('menuitem', { name: 'Reload manifest' });
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('marks the popup so the shared skin can style it', async () => {
    render(<OpenOnLoad />);
    expect(await screen.findByRole('menu')).toHaveAttribute('data-popup', 'menu');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui Menu`
Expected: FAIL — cannot resolve `./Menu`.

- [ ] **Step 4: Write the stylesheet**

Create `packages/ui/src/components/Menu/Menu.module.css`:

```css
/* Menu adds only the item row and the separator; the popup surface, the viewport clamp and the
   entry transition are the shared skin in `src/styles/popup.module.css`, under
   `data-popup='menu'`. */
.item {
  display: flex;
  align-items: center;
  min-height: var(--size-touch);
  padding-inline: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-md);
  cursor: pointer;
  user-select: none;
}

/* Base UI moves one roving highlight with both the pointer and the arrow keys, so `:hover`
   would fight it: the highlight is the only hover affordance here. */
.item[data-highlighted] {
  background: var(--color-surface-2);
  color: var(--color-text);
}

.item[data-disabled] {
  color: var(--color-text-subtle);
  cursor: not-allowed;
}

.separator {
  height: 1px;
  margin-block: var(--space-1);
  background: var(--color-border);
}
```

- [ ] **Step 5: Write the component**

Create `packages/ui/src/components/Menu/Menu.tsx`:

```tsx
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Fragment, type ReactElement } from 'react';
import popupStyles from '../../styles/popup.module.css';
import type { PopupAlign, PopupSide } from '../Popover/Popover';
import styles from './Menu.module.css';

export interface MenuItem {
  /** Stable across renders; used as the React key. */
  id: string;
  /** The visible text, and what Base UI's typeahead matches against. */
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  /** Draws a hairline above this item, separating the group below from the one above. */
  separatorBefore?: boolean;
}

export interface MenuProps {
  /**
   * The control that opens the menu, rendered as the trigger itself: it must be a single element
   * that produces a native `<button>`, and the popup takes its accessible name from it.
   */
  trigger: ReactElement;
  items: MenuItem[];
  side?: PopupSide;
  align?: PopupAlign;
  /** Gap between the trigger and the popup, in pixels. */
  sideOffset?: number;
  /**
   * Base UI defaults this to `true`, which locks page scroll and blocks pointer interaction
   * outside. A menu hanging off a toolbar button is not that, and `NavMenu` already ships
   * `modal={false}` for the same reason, so the default is inverted here.
   */
  modal?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  /** Base UI calls this as `(open, eventDetails)`; the second argument is passed through. */
  onOpenChange?: (open: boolean, eventDetails: unknown) => void;
}

export function Menu({
  trigger,
  items,
  side = 'bottom',
  align = 'end',
  sideOffset = 8,
  modal = false,
  open,
  defaultOpen,
  onOpenChange,
}: MenuProps) {
  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      modal={modal}
    >
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          className={popupStyles.layer}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseMenu.Popup className={popupStyles.surface} data-popup="menu">
            {items.map((item) => (
              <Fragment key={item.id}>
                {item.separatorBefore === true ? (
                  <BaseMenu.Separator className={styles.separator} />
                ) : null}
                <BaseMenu.Item
                  className={styles.item}
                  disabled={item.disabled}
                  onClick={item.onSelect}
                >
                  {item.label}
                </BaseMenu.Item>
              </Fragment>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
```

`onClick` is the activation handler Base UI itself documents for `Menu.Item`, and it is what both the pointer and the keyboard path end up dispatching — there is no `onSelect` prop on the Base UI part. The wrapper's prop is named `onSelect` because from the caller's side a menu item is chosen, not clicked.

- [ ] **Step 6: Append to the barrel**

Add to the end of `packages/ui/src/index.ts`:

```ts
export { Menu } from './components/Menu/Menu';
export type { MenuProps, MenuItem } from './components/Menu/Menu';
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `./node_modules/.bin/vitest run --project ui Menu`
Expected: PASS, 10 tests.

- [ ] **Step 8: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/components/Menu packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src/components/Menu packages/ui/src/index.ts
./node_modules/.bin/stylelint "packages/ui/src/components/Menu/*.css"
bun run typecheck
```

- [ ] **Step 9: Write the changeset**

Create `.changeset/menu.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `Menu`: a list of actions anchored to a trigger, on the same popup skin as `Popover`, with roving focus, typeahead and optional separators supplied by Base UI. `modal` defaults to `false` rather than Base UI's `true`: a menu hanging off a toolbar button has no business locking page scroll, and `NavMenu` already made the same call.
```

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/Menu packages/ui/src/index.ts .changeset/menu.md
git commit -m "feat(ui): add Menu"
```

---

## Task 6: Tooltip, and the provider every remote mounts

**Files:**

- Create: `packages/ui/src/components/Tooltip/Tooltip.tsx`
- Create: `packages/ui/src/components/Tooltip/TooltipProvider.tsx`
- Create: `packages/ui/src/components/Tooltip/Tooltip.stories.tsx`
- Create: `packages/ui/src/components/Tooltip/Tooltip.test.tsx`
- Create: `.changeset/tooltip.md`
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: `popupStyles` from Task 3 (`layer` and `surface`), and `import type { PopupAlign, PopupSide } from '../Popover/Popover';`.
- Produces: `Tooltip`, `TooltipProps`, `TooltipProvider`, `TooltipProviderProps`, and the value `TOOLTIP_DELAY = 600`. Task 12 imports `TooltipProvider` and `TOOLTIP_DELAY` from `@calcifer-design/ui` in the showcase remote — this is the constant spec §5.3 requires be exported so both sides of the federation seam use one value.

**Tooltip has no stylesheet of its own**, and that is the point: its whole surface is `data-popup='tooltip'` on the shared skin. The folder holds two components, as `Button`/`LinkButton` already do.

**The accessibility problem this wrapper exists to solve.** Base UI's tooltip puts **nothing** in the accessibility tree: the popup carries no `role="tooltip"`, the trigger gets no `aria-describedby`, and the whole thing is disabled on touch devices (the hover hook is `mouseOnly`). Its own documentation makes the trigger's accessible name a hard requirement. So `label` is required here and is applied twice — as the tip's text and as the trigger's `aria-label` — so the two cannot drift, and the prop's doc comment says what this component is *not* for: a sentence of help belongs in a `Popover` on a hover-opening trigger, and contextual feedback belongs in a toast.

**What `TooltipProvider` actually is.** Two React context providers and a timer. No DOM element, no portal, no window listeners, no store — verified in `tooltip/provider/TooltipProvider.js`, which returns `<TooltipProviderContext.Provider><FloatingDelayGroup>{children}</FloatingDelayGroup></TooltipProviderContext.Provider>` and nothing else. It is also **optional**: `useTooltipProviderContext` is a bare `useContext` with no throw, and a trigger with no provider falls back to Base UI's `OPEN_DELAY = 600`. That is why `TOOLTIP_DELAY` is 600 — it is not a number this library invents, it is the one Base UI would have used anyway — and why every remote mounting its own provider is free rather than merely tolerable. It buys one thing: once a tooltip in that tree has opened, its neighbours open instantly.

- [ ] **Step 1: Write the stories**

Create `packages/ui/src/components/Tooltip/Tooltip.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Tooltip } from './Tooltip';
import { TooltipProvider } from './TooltipProvider';

/** A 16x16 stroke glyph, sized by the button's own stylesheet. */
function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13.25 8a5.25 5.25 0 1 1-1.6-3.78" />
      <path d="M13.25 2.75v3.5h-3.5" />
    </svg>
  );
}

const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  args: {
    trigger: (
      <Button variant="ghost">
        <RefreshIcon />
      </Button>
    ),
    label: 'Reload the registry',
  },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
  },
  // Every consumer mounts one of these, host and remote alike: it renders no DOM and attaches
  // no listeners, so nesting is free, and it is what makes adjacent tooltips open instantly.
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Instant: Story = { args: { delay: 0 } };
export const Below: Story = { args: { side: 'bottom', delay: 0 } };

/** Hovers the trigger and checks the tip appears with the same words as its accessible name. */
export const HoverOpens: Story = {
  args: { delay: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('button', { name: 'Reload the registry' }));
    await expect(await screen.findByText('Reload the registry')).toBeInTheDocument();
  },
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/ui/src/components/Tooltip/Tooltip.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Button } from '../Button/Button';
import { Tooltip } from './Tooltip';
import * as stories from './Tooltip.stories';
import { TOOLTIP_DELAY, TooltipProvider } from './TooltipProvider';

const { Default, Instant, Below } = composeStories(stories);

describe('Tooltip', () => {
  it.each([
    ['Default', Default],
    ['Instant', Instant],
    ['Below', Below],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('gives the trigger its accessible name, because Base UI puts the tip in no tree at all', () => {
    render(<Default />);
    expect(screen.getByRole('button', { name: 'Reload the registry' })).toBeInTheDocument();
  });

  it('shows the tip on hover and takes it away again', async () => {
    render(<Instant />);
    const trigger = screen.getByRole('button', { name: 'Reload the registry' });
    expect(screen.queryByText('Reload the registry')).not.toBeInTheDocument();
    await userEvent.hover(trigger);
    expect(await screen.findByText('Reload the registry')).toBeInTheDocument();
    expect(await axeDocument()).toHaveNoViolations();
    await userEvent.unhover(trigger);
    await waitFor(() => expect(screen.queryByText('Reload the registry')).not.toBeInTheDocument());
  });

  it('takes a delay per trigger, with no provider in the tree at all', async () => {
    render(<Tooltip trigger={<Button>{null}</Button>} label="Retry the manifest" delay={0} />);
    await userEvent.hover(screen.getByRole('button', { name: 'Retry the manifest' }));
    expect(await screen.findByText('Retry the manifest')).toBeInTheDocument();
  });

  it('marks the popup so the shared skin can style it', async () => {
    render(<Instant />);
    await userEvent.hover(screen.getByRole('button', { name: 'Reload the registry' }));
    const tip = await screen.findByText('Reload the registry');
    expect(tip).toHaveAttribute('data-popup', 'tooltip');
  });
});

describe('TooltipProvider', () => {
  it('renders no DOM of its own, which is why every remote can mount one', () => {
    const { container } = render(
      <TooltipProvider>
        <span data-testid="child">Only this</span>
      </TooltipProvider>,
    );
    expect(container.innerHTML).toBe('<span data-testid="child">Only this</span>');
  });

  it('exports the delay both sides of the federation seam use, which is Base UI’s own default', () => {
    expect(TOOLTIP_DELAY).toBe(600);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui Tooltip`
Expected: FAIL — cannot resolve `./Tooltip`.

- [ ] **Step 4: Write the provider**

Create `packages/ui/src/components/Tooltip/TooltipProvider.tsx`:

```tsx
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ReactNode } from 'react';

/**
 * Base UI's own default hover delay, in milliseconds, re-exported as a constant so the shell and
 * every remote use one value across the federation seam. A remote that mounts its own provider
 * with this number produces the same feel as the host's, which is the whole point: the seam
 * should be invisible to someone moving the pointer across it.
 */
export const TOOLTIP_DELAY = 600;

export interface TooltipProviderProps {
  children?: ReactNode;
  /** Hover delay in milliseconds shared by every tooltip below this provider. */
  delay?: number;
  /** How long a tooltip waits before closing, in milliseconds. */
  closeDelay?: number;
}

/**
 * Groups the tooltips below it, so that once one has opened its neighbours open instantly.
 *
 * It renders no DOM, mounts no portal and attaches no window listeners — two React contexts and
 * a timer — which is why every federated remote mounts its own instead of trying to reach the
 * host's through context, which cannot cross a React root boundary. It is also optional: without
 * one, each trigger falls back to this same delay on its own.
 */
export function TooltipProvider({
  children,
  delay = TOOLTIP_DELAY,
  closeDelay,
}: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={delay} closeDelay={closeDelay}>
      {children}
    </BaseTooltip.Provider>
  );
}
```

- [ ] **Step 5: Write the component**

Create `packages/ui/src/components/Tooltip/Tooltip.tsx`:

```tsx
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ReactElement } from 'react';
import popupStyles from '../../styles/popup.module.css';
import type { PopupAlign, PopupSide } from '../Popover/Popover';

export interface TooltipProps {
  /**
   * The control the tip describes, rendered as the trigger itself: it must be a single element
   * that produces a native `<button>`.
   */
  trigger: ReactElement;
  /**
   * The tip's text — and the trigger's accessible name, applied as `aria-label` so the two can
   * never drift.
   *
   * Base UI's tooltip puts nothing in the accessibility tree: the popup carries no
   * `role="tooltip"`, the trigger gets no `aria-describedby`, and it is disabled on touch
   * devices. This is therefore a label for a control that has no visible text, not a place for
   * prose — for a sentence of help use `Popover`, and for feedback about something that just
   * happened use a toast.
   */
  label: string;
  side?: PopupSide;
  align?: PopupAlign;
  /** Gap between the trigger and the popup, in pixels. */
  sideOffset?: number;
  /**
   * Hover delay in milliseconds for this trigger alone. Leave it out and the tooltip takes the
   * delay from the nearest `TooltipProvider`, falling back to Base UI's own 600ms.
   */
  delay?: number;
}

export function Tooltip({
  trigger,
  label,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  delay,
}: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={trigger} aria-label={label} delay={delay} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          className={popupStyles.layer}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseTooltip.Popup className={popupStyles.surface} data-popup="tooltip">
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
```

- [ ] **Step 6: Append to the barrel**

Add to the end of `packages/ui/src/index.ts`:

```ts
export { Tooltip } from './components/Tooltip/Tooltip';
export type { TooltipProps } from './components/Tooltip/Tooltip';
export { TooltipProvider, TOOLTIP_DELAY } from './components/Tooltip/TooltipProvider';
export type { TooltipProviderProps } from './components/Tooltip/TooltipProvider';
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `./node_modules/.bin/vitest run --project ui Tooltip`
Expected: PASS, 9 tests.

- [ ] **Step 8: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/components/Tooltip packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src/components/Tooltip packages/ui/src/index.ts
bun run typecheck
```

There is no stylelint step here: `Tooltip` has no stylesheet of its own.

- [ ] **Step 9: Write the changeset**

Create `.changeset/tooltip.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `Tooltip` and `TooltipProvider`, with the hover delay exported as `TOOLTIP_DELAY`. `label` is required and becomes both the tip's text and the trigger's `aria-label`, because Base UI's tooltip contributes nothing to the accessibility tree — no `role="tooltip"`, no `aria-describedby` — and is disabled on touch devices, so a tip nobody names is a tip some people never get. The provider renders no DOM and attaches no listeners, which is what makes it safe for a federated remote to mount its own.
```

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/Tooltip packages/ui/src/index.ts .changeset/tooltip.md
git commit -m "feat(ui): add Tooltip and TooltipProvider"
```

---

## Task 7: ToastRegion, and the manager that crosses the Bridge

**Files:**

- Create: `packages/ui/src/components/ToastRegion/ToastRegion.tsx`
- Create: `packages/ui/src/components/ToastRegion/ToastRegion.module.css`
- Create: `packages/ui/src/components/ToastRegion/ToastRegion.stories.tsx`
- Create: `packages/ui/src/components/ToastRegion/ToastRegion.test.tsx`
- Create: `.changeset/toast-region.md`
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: `popupStyles.toastLayer` from Task 3. Nothing else in the tier.
- Produces:
  - `createToastManager(): ToastManager` — a plain object, created outside React.
  - `ToastManager` — `{ add: (options: ToastOptions) => string; close: (toastId?: string) => void; update: (toastId: string, options: Partial<ToastOptions>) => void; readonly baseManager: BaseToastManager }`.
  - `ToastOptions` — `{ title: string; description?: string; tone?: ToastTone; timeout?: number; priority?: 'low' | 'high'; id?: string; action?: ToastAction }`.
  - `ToastTone` — `'info' | 'success' | 'warning' | 'danger'`. `ToastAction` — `{ label: string; onClick: () => void }`.
  - `ToastRegion`, `ToastRegionProps` — `{ manager: ToastManager; label?: string; limit?: number; timeout?: number; closeLabel?: string }`.
  - Task 10 declares a structural subset of `ToastManager` in `@calcifer-design/contract`; Tasks 11 and 12 call `createToastManager()` and render `<ToastRegion>`.

**Why the provider, the portal and the viewport ship as one component.** Spec §5.2 attributes the damage of a second provider to the provider. It is really the **viewport**: `Toast.Provider` renders no DOM at all (a context provider plus a `null`-returning synchroniser), while `Toast.Viewport` renders the `role="region" aria-live="polite" aria-label="Notifications"` landmark, a second visually-hidden `role="alert"` mirror for high-priority toasts, and four window- and document-level listeners (F6 focus jump, blur and focus to pause dismiss timers, pointerdown). Two viewports means two landmarks overlapping in the same screen corner and two sets of those listeners. Shipping all three parts as one component is how a consumer is prevented from half-mounting the apparatus — and the test below asserts exactly one landmark, which is spec §9's requirement.

**Why the manager is a plain object.** `createToastManager()` returns a closure over a `Set` of listeners: no context, no hooks, no module-identity requirement. That is the only reason the host's toast manager can be handed to a remote through the Bridge props and still work — context cannot cross a React root boundary, and `useToastManager()` throws outright without a provider above it. Two consequences are documented on the wrapper rather than defended against: `add()` with no region mounted returns an id and drops the toast, and the payload is `string`, not `ReactNode`, because an element authored in a remote would render inside the host's React root and under the host's CSS.

- [ ] **Step 1: Write the stories**

Create `packages/ui/src/components/ToastRegion/ToastRegion.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button/Button';
import { ToastRegion, createToastManager } from './ToastRegion';

// One manager for the stories, created outside React exactly as a host creates its own: it has
// to outlive every render of the component that shows it.
const storyManager = createToastManager();

const meta = {
  title: 'Overlays/ToastRegion',
  component: ToastRegion,
  args: { manager: storyManager },
  parameters: {
    a11y: {
      // Base UI marks the close control `aria-hidden` while the stack is collapsed and
      // unfocused, and it stays focusable — deliberate, and it trips axe's `aria-hidden-focus`
      // in a real browser. Overriding the attribute would take the control out of Base UI's own
      // expanded/collapsed handling, so the rule is excluded here instead and the behaviour is
      // asserted in the unit test.
      options: { rules: { 'aria-hidden-focus': { enabled: false } } },
    },
  },
} satisfies Meta<typeof ToastRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          args.manager.add({
            title: 'Remote removed',
            description: 'showcase is no longer in the registry.',
            tone: 'success',
            action: { label: 'Undo', onClick: () => undefined },
          })
        }
      >
        Raise a toast
      </Button>
      <ToastRegion {...args} />
    </>
  ),
};

export const Danger: Story = {
  render: (args) => (
    <>
      <Button
        variant="secondary"
        onClick={() =>
          args.manager.add({
            title: 'The showcase remote failed to load',
            description: 'The manifest returned 404.',
            tone: 'danger',
            priority: 'high',
            timeout: 0,
          })
        }
      >
        Raise a failure
      </Button>
      <ToastRegion {...args} />
    </>
  ),
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/ui/src/components/ToastRegion/ToastRegion.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { ToastRegion, createToastManager } from './ToastRegion';
import * as stories from './ToastRegion.stories';

const { Default, Danger } = composeStories(stories);

describe('ToastRegion', () => {
  it.each([
    ['Default', Default],
    ['Danger', Danger],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('renders exactly one notifications landmark, which is the whole reason it ships as one component', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Remote removed' });
    await screen.findByText('Remote removed');
    expect(screen.getAllByRole('region', { name: 'Notifications' })).toHaveLength(1);
  });

  it('names the toast with its title and describes it with its description', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Remote removed', description: 'showcase is no longer registered.' });
    const region = await screen.findByRole('region', { name: 'Notifications' });
    const toast = within(region).getByRole('dialog');
    expect(toast).toHaveAccessibleName('Remote removed');
    expect(toast).toHaveAccessibleDescription('showcase is no longer registered.');
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('carries the tone as a data attribute, for the rail colour', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Saved', tone: 'success' });
    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(within(region).getByRole('dialog')).toHaveAttribute('data-type', 'success');
  });

  it('runs the action and keeps its own label', async () => {
    const manager = createToastManager();
    const onClick = vi.fn();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Remote removed', action: { label: 'Undo', onClick } });
    const region = await screen.findByRole('region', { name: 'Notifications' });
    await userEvent.click(within(region).getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('closes from the close control, which is reachable by its label while the stack is collapsed', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    manager.add({ title: 'Saved' });
    const region = await screen.findByRole('region', { name: 'Notifications' });
    // `getByRole('button', { name: 'Close' })` cannot find this one: Base UI marks it
    // `aria-hidden` while the stack is collapsed and unfocused, which takes it out of the
    // accessibility tree without taking it out of the tab order. Measured, and deliberate on
    // their side — it comes back when the viewport is hovered or focused.
    const closeControl = within(region).getByLabelText('Close');
    expect(closeControl).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(closeControl);
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument());
  });

  it('closes from the manager', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    const identifier = manager.add({ title: 'Saved' });
    await screen.findByText('Saved');
    manager.close(identifier);
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument());
  });

  it('updates a toast in place rather than stacking a second one', async () => {
    const manager = createToastManager();
    render(<ToastRegion manager={manager} />);
    const identifier = manager.add({ title: 'Uploading', timeout: 0 });
    expect(await screen.findByText('Uploading')).toBeInTheDocument();
    manager.update(identifier, { title: 'Uploaded' });
    expect(await screen.findByText('Uploaded')).toBeInTheDocument();
    expect(screen.queryByText('Uploading')).not.toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });

  it('drops a toast raised while no region is mounted, and still returns an id', () => {
    const manager = createToastManager();
    const identifier = manager.add({ title: 'Nobody is listening' });
    expect(typeof identifier).toBe('string');
    expect(identifier.length).toBeGreaterThan(0);
    expect(screen.queryByText('Nobody is listening')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui ToastRegion`
Expected: FAIL — cannot resolve `./ToastRegion`.

- [ ] **Step 4: Write the stylesheet**

Create `packages/ui/src/components/ToastRegion/ToastRegion.module.css`:

```css
/* Toast is the one Tier 2 component that does not wear the popup skin: it is a stack, not an
   anchored surface, and Base UI drives it through five custom properties of its own
   (--toast-index, --toast-offset-y, --toast-height, --toast-swipe-movement-x/y). It takes
   exactly one thing from `popup.module.css` — `.toastLayer` — so the tier's stacking order
   stays in one file. */
.viewport {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  left: auto;
  width: min(22rem, calc(100vw - var(--space-6)));
}

.toast {
  position: absolute;
  right: 0;
  bottom: 0;
  left: auto;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-inline-start: var(--border-width-strong) solid var(--color-neutral);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  color: var(--color-text);
  box-shadow: var(--elevation-2);
  transition-property: transform, opacity;
  transition-duration: var(--motion-duration-3);
  transition-timing-function: var(--motion-ease);
  transform: translateY(calc(var(--toast-index) * -0.5rem))
    scale(calc(1 - var(--toast-index) * 0.04));
}

/* Hovered or focused, the stack fans out and Base UI supplies each toast's resting offset.
   `--toast-offset-y` is a *positive* running sum of the heights of the toasts in front of this
   one (`toast/store.js`: `offsetY += toast.height || 0`), so a bottom-docked stack has to negate
   it — a bare `translateY(var(--toast-offset-y))` pushes every toast but the newest down past
   the bottom edge of the window, which is what Base UI's own bottom-anchored example negates it
   for. The `--toast-index * --space-2` term is the gap between fanned toasts, matching the
   0.5rem peek the collapsed state uses. jsdom has no layout, so no test can catch this: check it
   in the story. */
.toast[data-expanded] {
  transform: translateY(calc((var(--toast-offset-y) + var(--toast-index) * var(--space-2)) * -1));
}

/* Over the viewport's limit: still mounted and inert, so its dismiss timer keeps its place. */
.toast[data-limited] {
  opacity: 0;
}

.toast[data-starting-style] {
  opacity: 0;
  transform: translateY(100%);
}

.toast[data-ending-style] {
  opacity: 0;
}

.toast[data-type='info'] {
  border-inline-start-color: var(--color-accent);
}

.toast[data-type='success'] {
  border-inline-start-color: var(--color-success);
}

.toast[data-type='warning'] {
  border-inline-start-color: var(--color-warning);
}

.toast[data-type='danger'] {
  border-inline-start-color: var(--color-danger);
}

.content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.heading {
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: var(--leading-snug);
}

.description {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-prose);
}

.action {
  flex: none;
  align-self: center;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-sm);
  cursor: pointer;
}

.close {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.close > svg {
  width: 0.875rem;
  height: 0.875rem;
}

@media (hover: hover) {
  .action:hover {
    background: var(--color-surface-2);
  }

  .close:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
}
```

- [ ] **Step 5: Write the component**

Create `packages/ui/src/components/ToastRegion/ToastRegion.tsx`:

```tsx
import { Toast as BaseToast } from '@base-ui/react/toast';
import type { ToastManager as BaseToastManager } from '@base-ui/react/toast';
import popupStyles from '../../styles/popup.module.css';
import styles from './ToastRegion.module.css';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds before the toast dismisses itself. `0` keeps it until it is closed. */
  timeout?: number;
  /** `high` also mirrors the toast into a hidden `role="alert"` region, so it interrupts. */
  priority?: 'low' | 'high';
  /** Reusing an id updates that toast in place and restarts its dismiss timer. */
  id?: string;
  action?: ToastAction;
}

/**
 * The object a host hands to a remote so the remote can raise a toast in the host's single
 * viewport. Deliberately narrower than Base UI's own manager: `title` and `description` are
 * `string`, not `ReactNode`, because an element authored in a remote would render inside the
 * host's React root and under the host's CSS.
 */
export interface ToastManager {
  add: (options: ToastOptions) => string;
  close: (toastId?: string) => void;
  update: (toastId: string, options: Partial<ToastOptions>) => void;
  /**
   * The Base UI manager `ToastRegion` subscribes to. Not part of the surface a remote is given —
   * the Bridge contract declares only `add`, `close` and `update`.
   */
  readonly baseManager: BaseToastManager;
}

function toBaseOptions(options: Partial<ToastOptions>) {
  const { tone, action, ...rest } = options;
  return {
    ...rest,
    ...(tone === undefined ? {} : { type: tone }),
    ...(action === undefined
      ? {}
      : { actionProps: { children: action.label, onClick: action.onClick } }),
  };
}

/**
 * Creates a toast manager outside React. It is a plain object over a listener set: no context,
 * no hooks, no module-identity requirement — which is exactly why it survives the trip across
 * the Bridge into a remote's separate React root, where a provider's context could not.
 *
 * A call made while no `ToastRegion` is mounted is dropped: `add` still returns an id, and the
 * toast is never shown.
 */
export function createToastManager(): ToastManager {
  const baseManager = BaseToast.createToastManager();
  return {
    baseManager,
    add: (options) => baseManager.add(toBaseOptions(options)),
    close: (toastId) => {
      baseManager.close(toastId);
    },
    update: (toastId, options) => {
      baseManager.update(toastId, toBaseOptions(options));
    },
  };
}

export interface ToastRegionProps {
  /** The manager this region renders. One region per manager, and one manager per page. */
  manager: ToastManager;
  /** The landmark's accessible name. */
  label?: string;
  /** How many toasts are on screen at once; the rest wait, marked `data-limited`. */
  limit?: number;
  /** Default milliseconds before a toast dismisses itself. `0` keeps every toast until closed. */
  timeout?: number;
  /** The accessible name of each toast's close control. */
  closeLabel?: string;
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m4.5 4.5 7 7" />
      <path d="m11.5 4.5-7 7" />
    </svg>
  );
}

/**
 * `Toast.Title`, `Toast.Description` and `Toast.Action` each render `null` when the toast
 * carries no such field, so all four parts are rendered unconditionally and the manager's
 * options decide what appears.
 */
function ToastList({ closeLabel }: { closeLabel: string }) {
  const { toasts } = BaseToast.useToastManager();
  return toasts.map((toastObject) => (
    <BaseToast.Root key={toastObject.id} toast={toastObject} className={styles.toast}>
      <BaseToast.Content className={styles.content}>
        <BaseToast.Title className={styles.heading} />
        <BaseToast.Description className={styles.description} />
      </BaseToast.Content>
      <BaseToast.Action className={styles.action} />
      <BaseToast.Close className={styles.close} aria-label={closeLabel}>
        <CloseIcon />
      </BaseToast.Close>
    </BaseToast.Root>
  ));
}

/**
 * The whole toast apparatus as one component: provider, portal and viewport together, so no
 * consumer can mount a second viewport by accident. That matters because it is the viewport —
 * not the provider — that renders the `role="region"` landmark, the hidden `role="alert"` mirror
 * for high-priority toasts, and four window-level listeners. Two of them overlap in the same
 * screen corner, and the last-committed one silently wins.
 */
export function ToastRegion({
  manager,
  label = 'Notifications',
  limit = 3,
  timeout = 5000,
  closeLabel = 'Close',
}: ToastRegionProps) {
  return (
    <BaseToast.Provider toastManager={manager.baseManager} limit={limit} timeout={timeout}>
      <BaseToast.Portal>
        <BaseToast.Viewport
          className={[popupStyles.toastLayer, styles.viewport].join(' ')}
          aria-label={label}
        >
          <ToastList closeLabel={closeLabel} />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
```

- [ ] **Step 6: Append to the barrel**

Add to the end of `packages/ui/src/index.ts`:

```ts
export { ToastRegion, createToastManager } from './components/ToastRegion/ToastRegion';
export type {
  ToastRegionProps,
  ToastManager,
  ToastOptions,
  ToastTone,
  ToastAction,
} from './components/ToastRegion/ToastRegion';
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `./node_modules/.bin/vitest run --project ui ToastRegion`
Expected: PASS, 10 tests.

**Then check the expanded stack by hand, because no test here can.** jsdom has no layout, every toast reports `height: 0`, and nothing in this suite asserts a transform — so the one gesture the `[data-expanded]` rule exists for is invisible to `bun run check`. Run `bun run storybook`, open `Overlays/ToastRegion`, press "Raise a toast" three times and hover the stack (or press F6 to jump into the viewport). Expected: the three toasts fan **upward** from the bottom-right corner and their dismiss timers pause. If they slide downward off the bottom of the window, the `translateY` on `.toast[data-expanded]` has lost its negation.

- [ ] **Step 8: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/components/ToastRegion packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src/components/ToastRegion packages/ui/src/index.ts
./node_modules/.bin/stylelint "packages/ui/src/components/ToastRegion/*.css"
bun run typecheck
```

- [ ] **Step 9: Write the changeset**

Create `.changeset/toast-region.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `ToastRegion` and `createToastManager`: the toast provider, portal and viewport as one component, because it is the viewport — not the provider — that renders the notifications landmark and four window-level listeners, and mounting two of those is the failure this shape makes impossible. The manager is a plain object created outside React, so a federated host can hand it to a remote through props and have it work across a separate React root, where context cannot reach. Its payload is `string` rather than `ReactNode` for the same reason: an element authored in a remote would render under the host's CSS.
```

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/ToastRegion packages/ui/src/index.ts .changeset/toast-region.md
git commit -m "feat(ui): add ToastRegion and the toast manager"
```

---

## Task 8: NavMenu wears the shared popup skin

**Files:**

- Modify: `packages/ui/src/components/NavMenu/NavMenu.tsx`
- Modify: `packages/ui/src/components/NavMenu/NavMenu.module.css`
- Modify: `packages/ui/src/components/NavMenu/NavMenu.test.tsx`
- Create: `.changeset/nav-menu-popup-skin.md`

**Interfaces:**

- Consumes: `popupStyles` from Task 3 (`layer` and `surface`).
- Produces: nothing new. `NavMenuProps`, `NavItem` and `LinkRenderProps` are untouched, and no export changes.

**This is a deliberate visual change to a published, live component, which is why it is its own task.** `NavMenu` is the shell's primary navigation on jsrodriguez.dev. Its popup already carries eight of the shared surface's declarations; what it gains here is what it has never had — a viewport clamp with its own scrolling, a transform origin, an entry and exit transition, and Base UI's `[data-instant]` hook. The mobile menu will fade and scale in where it currently appears instantly. `base.css` collapses that under `prefers-reduced-motion`, and the changeset enumerates the rest.

Nothing in the public API moves, but this still ships as a **minor**: `@calcifer-design/ui` is pre-1.0, so a patch reaches every `^0.2.x` consumer silently, and a change to how a live component animates and clamps deserves a version segment that a reader notices. The release is already a minor for the five new components, so the honesty is free. Step 4 lists the full declaration delta; Step 7's changeset repeats it.

Doing this *after* Popover rather than before is the whole argument of decision 1: there was nothing in `NavMenu` worth extracting, because the half of a popup skin it has is the half that is easy.

- [ ] **Step 1: Write the failing test**

Append to the `NavMenu at mobile width` describe block in `packages/ui/src/components/NavMenu/NavMenu.test.tsx`:

```tsx
  it('wears the tier-wide popup skin, so it cannot drift from Menu and Popover', async () => {
    installMatchMedia(false);
    render(<Mobile />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const popup = await screen.findByRole('menu');
    expect(popup).toHaveClass('surface');
    expect(popup).toHaveAttribute('data-popup', 'menu');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui NavMenu`

Expected: FAIL on the new test only — the popup carries `popup`, the component-local class, and no `data-popup` attribute. The other five tests still pass — two in `NavMenu at desktop width`, three in `NavMenu at mobile width`.

- [ ] **Step 3: Point the component at the shared skin**

In `packages/ui/src/components/NavMenu/NavMenu.tsx`, add the import beside the existing stylesheet import:

```tsx
import popupStyles from '../../styles/popup.module.css';
```

and change the positioner and popup elements — everything else in the return stays exactly as it is:

```tsx
          <Menu.Positioner className={popupStyles.layer} side="bottom" align="end" sideOffset={8}>
            <Menu.Popup className={popupStyles.surface} data-popup="menu">
```

- [ ] **Step 4: Delete the rules it no longer needs**

In `packages/ui/src/components/NavMenu/NavMenu.module.css`, delete the `.positioner` rule and the `.popup` rule outright. Keep `.item` and `.item[data-highlighted]`: those are this menu's own, and the tier's `Menu` has its own copy with a touch-target minimum that a nav dropdown does not want.

The shared surface supplies everything the deleted `.popup` did — flex column, `min-width: 12rem` through `data-popup='menu'`, `padding: var(--space-2)`, a hairline border, `--radius-lg`, `--color-surface-raised` and `--elevation-2` — and it supplies more than that, which is the part worth being precise about because this is a live component:

| Added by `.surface` | Effect on the mobile nav |
| ------------------- | ------------------------ |
| `transition-property`/`-duration`/`-timing-function` plus the `[data-starting-style]`/`[data-ending-style]` pair | Fades and scales where it used to appear instantly. Collapsed under `prefers-reduced-motion` by `base.css`. |
| `transform-origin: var(--transform-origin)` | The scale grows out of the trigger rather than the popup's centre. |
| `max-width: var(--available-width)`, `max-height: var(--available-height)`, `overflow-y: auto`, `overscroll-behavior: contain` | The dropdown now clamps to the viewport and scrolls inside itself instead of overflowing the window. |
| `color: var(--color-text)` | Explicit where it was inherited; the computed value does not move. |
| `[data-instant] { transition-property: none }` | Base UI's own escape hatch for a dismissal that must feel immediate. |

The one declaration on `.surface` that would have changed the dropdown's density — `gap: var(--space-2)`, 8px between every item — never reaches it: Task 3's `data-popup='menu'` variant sets `gap: 0` precisely so that `Menu` and `NavMenu` both keep adjacent rows. Everything in that table goes in the changeset.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
./node_modules/.bin/vitest run --project ui NavMenu
bun run test
```

Expected: PASS, 6 NavMenu tests and the whole suite green. If the axe assertions in the two existing NavMenu tests fail, stop: that is a real regression in the shared skin, not a test to adjust.

- [ ] **Step 6: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/components/NavMenu
./node_modules/.bin/eslint packages/ui/src/components/NavMenu
./node_modules/.bin/stylelint "packages/ui/src/components/NavMenu/*.css"
bun run typecheck
```

- [ ] **Step 7: Write the changeset**

Create `.changeset/nav-menu-popup-skin.md`:

```markdown
---
'@calcifer-design/ui': minor
---

`NavMenu`'s dropdown now uses the same popup skin as `Popover`, `Dialog`, `Menu` and `Tooltip` instead of its own copy of half of it. Its props are unchanged, so nothing about this is breaking — but it is a deliberate change to how a published component looks and behaves, which on a pre-1.0 package is a minor rather than a patch, so it does not reach a `^0.2.x` consumer with no signal at all.

What changes: the popup's generated class name; the menu fades and scales as it opens and closes where it used to appear instantly, growing out of its trigger rather than its own centre, and collapsed to nothing under `prefers-reduced-motion` as all of this library's motion is; the dropdown now clamps to the viewport and scrolls inside itself (`max-width`/`max-height` from the positioner, with `overflow-y: auto` and `overscroll-behavior: contain`) instead of overflowing the window; `color` is set explicitly where it was inherited, with no change to the computed value; and Base UI's `[data-instant]` hook now suppresses the transition where Base UI asks it to. Item spacing is unchanged: the shared surface's `gap` is switched off for `data-popup='menu'`.
```

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/NavMenu .changeset/nav-menu-popup-skin.md
git commit -m "refactor(ui): NavMenu wears the shared popup skin"
```

---

## Task 9: Tier 2 is complete — dist coverage, the README, and the whole check

**Files:**

- Modify: `packages/ui/test/dist/ui-dist.test.ts`
- Modify: `README.md:27`

**Interfaces:**

- Consumes: every component from Tasks 3–7, through the built `dist/index.js`, and the two shared stylesheets from Tasks 1 and 3.
- Produces: nothing new.

This task proves the tier survives the Rslib build and reaches the published entry point. The barrel exporting them is not the same claim: the build is bundleless, each component becomes its own module, and the two shared stylesheets become their own dist entries — `dist/styles/a11y.module.js` plus `dist/styles/a11y_module.css`, and the same pair for `popup` — which the existing coverage does not look at, because it walks `dist/components` only.

- [ ] **Step 1: Extend the dist assertions**

In `packages/ui/test/dist/ui-dist.test.ts`, extend the export-name list so it reads:

```ts
    for (const exportName of [
      'Button',
      'Card',
      'Tag',
      'NavMenu',
      'DataTable',
      'PageHeading',
      'Spinner',
      'Skeleton',
      'IconButton',
      'Alert',
      'Avatar',
      'ErrorBoundary',
      'Popover',
      'Dialog',
      'Menu',
      'Tooltip',
      'TooltipProvider',
      'ToastRegion',
      'createToastManager',
    ]) {
      expect(typeof uiModule[exportName], exportName).toBe('function');
    }
```

Every name there is a plain function or a class, and `typeof` a class is `'function'` — which is why this list must never gain a namespace object. It is also why this tier's components are flat single functions rather than compound `Popover.Root`-style exports.

Then append a third test to the same describe block, after the existing `ships base.css and the declarations`:

```ts
  it('emits each shared stylesheet once, as its own dist entry', async () => {
    for (const name of ['a11y', 'popup']) {
      expect((await stat(path.join(distRoot, `styles/${name}.module.js`))).isFile()).toBe(true);
      expect((await stat(path.join(distRoot, `styles/${name}_module.css`))).isFile()).toBe(true);
    }
    // One copy of the rule in the whole package: the reason the shared class is imported from
    // TSX rather than `composes`-d, which would inline it into every consuming stylesheet.
    const popupCss = await readFile(path.join(distRoot, 'styles/popup_module.css'), 'utf8');
    expect(popupCss).toMatch(/\.surface-[A-Za-z0-9_-]{5}\b/);
    const componentCss = await collectCssFiles(path.join(distRoot, 'components'));
    for (const file of componentCss) {
      const css = await readFile(file, 'utf8');
      expect(css, file).not.toContain('clip-path: inset(50%)');
    }
  });
```

- [ ] **Step 2: Build and run the dist tests to verify they pass**

```bash
bun run build
bun run test:dist
```

Expected: PASS. If a name comes back `undefined`, its barrel export is missing — fix that rather than removing the name. If `styles/popup_module.css` is missing, the stylesheet is not being imported from any TSX module, which means a component is referencing it only from CSS.

- [ ] **Step 3: Update the README component list**

In `README.md`, line 27, the `@calcifer-design/ui` row lists the exported components. The new names go after `ErrorBoundary` and before `useMediaQuery` — but prettier pads every cell in a markdown table to the width of the widest one, so replacing that line alone leaves the header, the separator and the `@calcifer-design/tokens` row one column short and `prettier --check` fails. Replace **all four lines**, 24 through 27, with this already-padded block:

```
| Package                   | What it is                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@calcifer-design/tokens` | `tokens` object, `tokensToCss`, `contrastRatio`, `breakpoint`; ships `tokens.css`                                                                                                                                                                                                                                                     |
| `@calcifer-design/ui`     | `Button`, `Tabs`, `Card`, `Tag`, `StatusDot`, `SkipLink`, `LiveRegion`, `PageHeading`, `NavMenu`, `DataTable`, `Spinner`, `Skeleton`, `IconButton`, `Alert`, `Avatar`, `ErrorBoundary`, `Popover`, `Dialog`, `Menu`, `Tooltip`, `TooltipProvider`, `ToastRegion`, `createToastManager`, `useMediaQuery`, `minWidth`; ships `base.css` |
```

- [ ] **Step 4: Format the two files this task touched**

```bash
./node_modules/.bin/prettier --write README.md packages/ui/test/dist/ui-dist.test.ts
```

Task 9 is the last commit before the PR and `bun run check` ends in `prettier --check .`, so this is the step that keeps the branch's final gate green. It is a no-op if the block above was pasted verbatim; run it anyway.

- [ ] **Step 5: Run the whole check**

Run: `bun run check`

Expected: PASS. This runs lint, typecheck, every unit test, the build, the dist tests and a full Storybook build — the same gate CI applies. The Storybook build is the slowest step; expect a few minutes.

If `bun run typecheck` reports missing `*.module.css.d.ts` declarations, run `bun run build` first: those files are generated and gitignored, and `typecheck` regenerates them as its first step.

**`prettier --check .` will also name this plan document, and that is not a failure of the code.** `lint` is `eslint . && stylelint … && prettier --check .`, `.prettierignore` does not cover `docs/`, and prettier walks the working tree whether a file is tracked or not — so `docs/superpowers/plans/2026-09-13-portfolio-mfe-phase-4-plan-b-tier-2-floating-surfaces.md` is checked along with everything else. It is not prettier-formatted: its tables are unpadded, and several `tsx` fences hold fragments indented to show where they belong inside a file, which prettier would flatten to column zero and make unreadable. Plan A avoided both, which is why it is clean. Resolve it whichever way the repository prefers — `./node_modules/.bin/prettier --write` on that one path, accepting the flattened fragments, or a `docs/superpowers/plans/` line in `.prettierignore` — but decide before the PR, and do not read the warning as a problem with Tier 2.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/test/dist/ui-dist.test.ts README.md
git commit -m "test(ui): cover the Tier 2 components and the shared stylesheets in the dist check"
```

- [ ] **Step 7: Open the pull request and merge it**

This is the whole library half of the tier: nine commits, five new components, one refactor, one token. Follow the repository's usual close-out — a whole-branch code review, a simplifier pass, `bun run check`, then merge.

**Then stop and wait.** Merging opens the Version Packages PR; merging *that* stages `@calcifer-design/ui@0.3.0` and `@calcifer-design/tokens@0.2.0` on npm. CI can only stage: the trusted publisher is configured without "Allow npm publish", so a human approves the release with 2FA (`npm stage approve <stage-id>`). **Nothing in Tasks 11–13 can start until *both* approvals land.** Confirm with:

```bash
npm view @calcifer-design/ui version
npm view @calcifer-design/tokens version
```

Expected: `0.3.0` and `0.2.0`. Both, not just the first. Tasks 11 and 12 move each app's own `@calcifer-design/tokens` dependency to `^0.2.0`, because each app imports `tokens.css` from its own copy and `--color-scrim` lives only in 0.2.0 — and `ui@0.3.0` itself depends on `tokens@^0.2.0`, so approving `ui` without `tokens` leaves both app repositories unable to install at all. This is the one step in this plan that a green CI run cannot verify in advance.

---

## The cross-repository half: what is ordered, and what only looks ordered

Tasks 10–13 run in `/Users/calcifer/Code/portfolio-mfe-worktrees/gamma`. Three clocks run at different speeds here and only one of them is a package registry.

**The gate is the npm release, not the contract publish.** `@calcifer-design/contract` has exactly one consumer — this repository, at `workspace:*` — and it can have no others: `nightward` and `ominous` point their `.npmrc` at npmjs, and the CodeArtifact OIDC role in `infra/lib/artifacts-stack.ts` is assumable only by `juansrodz/portfolio-mfe` on `main`. So "publish the contract, then bump every consumer" is a sequence with no consumers to sequence. The contract release is a **trailing consequence** of merging, one merge later, and nothing waits for it. Write that down where the next person will read it, because the natural assumption is the reverse.

**What genuinely constrains the order is the deploy skew.** The shell and each remote deploy separately: a shell carrying a new prop will mount remotes built weeks earlier, and a redeployed remote will be mounted by whatever shell is live. The only thing that survives both directions is `hostToast` being **optional forever**, with each remote branching on the manager's presence rather than on `federated` — `federated` is set by the remote's own Bridge wrapper, so `federated === true && hostToast === undefined` is precisely "mounted by a shell that predates this change", and branching on it would leave that remote talking to nobody.

**The external remotes cost nothing.** `wbw` destructures only `basename`; `ominous` and `nightward` type their host props locally and could not install the contract if they wanted to. An extra key on a props object that a component never destructures is invisible. None of them needs a redeploy for this change, and none of them blocks it.

**Ordering invariants — inverting any of these breaks something:**

1. **The npm release (Task 9's close-out) comes before the shell bump (Task 11), and it is two packages, not one.** The shell cannot import `ToastRegion` from a version that is not published — and `@calcifer-design/ui@0.3.0` itself depends on `@calcifer-design/tokens@^0.2.0`, so approving one without the other leaves `bun install` unable to resolve anything. Both apps also move their own `@calcifer-design/tokens` dependency to `^0.2.0`, because each imports `tokens.css` from its own copy and that is the only route by which `--color-scrim` reaches a browser. The approval is manual, so this is the one hazard a green CI run cannot see coming.
2. **The contract commit precedes the shell commit, inside the same PR.** `const hostProps: HostProps` is an exact annotation; the new key would be an excess-property error for exactly one commit if inverted.
3. **`hostToast` is optional forever, and remotes branch on the manager, never on `federated`.**
4. **Task 13 lands last, and may land as its own PR.** It is the only change here with a runtime failure mode, it is trivially revertible, and per spec §5.3 it is explicitly *not* what makes toast work. That sentence exists so nobody later deletes the manager-passing in the belief that sharing solved it.

---

## Task 10: The contract carries the host's toast manager

**Files:**

- Modify: `docs/superpowers/specs/2026-09-12-portfolio-mfe-phase-4-design-system-remote-design.md` (§12 Errata)
- Modify: `packages/contract/src/remote-app.ts`
- Modify: `packages/contract/src/index.ts`
- Modify: `packages/contract/test/remote-app.test-d.ts`
- Create: `.changeset/host-toast.md`

**Interfaces:**

- Consumes: nothing at runtime. The shape it declares is a structural subset of the `ToastManager` Task 7 produced; no import of `@calcifer-design/ui` or `@base-ui/react` appears anywhere in this package.
- Produces:
  - `HostToastOptions` — `{ title: string; description?: string; tone?: 'info' | 'success' | 'warning' | 'danger'; timeout?: number; priority?: 'low' | 'high'; id?: string }`.
  - `HostToastManager` — `{ add: (options: HostToastOptions) => string; close: (toastId: string) => void; update: (toastId: string, options: Partial<HostToastOptions>) => void }`. `close`'s id is required here and optional on the library's own manager, deliberately.
  - `HostProps.hostToast?: HostToastManager`.
  - Task 11 assigns `@calcifer-design/ui`'s `ToastManager` into that field; Task 12 reads it.

**Why the type is narrower than the object it will hold.** The instinct is to re-export Base UI's `ToastManager` and be done. Two reasons not to. It would give this package — deliberately kept to plumbing — a dependency on a UI library, which every remote that types itself against the contract would then inherit. And narrower is genuinely safer here, inverting the usual instinct: the contract is *the promise the live shell already keeps*, and every method it names is a method some remote may call against a shell built months ago, across a boundary where the two sides share no compilation and TypeScript can see nothing. `add`, `close`, `update` — nothing else. Not `promise()`, whose subscriber-replacement happens synchronously during emit and degrades to a silent no-op without one. Not an action button, which is host-owned UI. `title` and `description` are `string` because a `ReactNode` authored in a remote renders inside the host's React root, under the host's CSS.

The same reasoning narrows `close`'s parameter from optional to required. Base UI's `closeToast` begins `const closeAll = toastId === undefined` and then clears every timer and every toast: a remote calling `close()` would wipe the shell's own "failed to load" notice and every other remote's toasts along with its own. Ids are global to one store, so the interface documents that and takes away the one call that abuses it.

- [ ] **Step 0: Install the worktree**

```bash
bun install
```

From `/Users/calcifer/Code/portfolio-mfe-worktrees/gamma`. This worktree has never been installed — it has no `node_modules` at all — and every command in Tasks 10–13 is `./node_modules/.bin/<tool>`. Without this, Step 3's `vitest run --project contract` fails with "no such file or directory" instead of the type error it is supposed to report, and the first thing an executor will do is start debugging the wrong thing.

Nothing is committed here: `bun.lock` is already in the tree and an install against it changes nothing.

- [ ] **Step 1: Record the Tier 2 errata in the spec, and commit that on its own**

Every departure listed in "Decisions taken up front" is recorded here, in one commit. This is the only step in the plan that can write them — Tasks 1–9 run in `calcifer-design`, which does not contain the spec.

Append to §12 Errata of `docs/superpowers/specs/2026-09-12-portfolio-mfe-phase-4-design-system-remote-design.md`:

```markdown
**§3, dependencies — `Dialog` composes Base UI's `Dialog`, not the native `<dialog>`.** Recorded
while writing Plan B. §3 says "`Dialog` uses native `<dialog>` with `showModal()`"; §2.1 says
Popover's popup, positioner and animation skin is reused by every other component in Tier 2. Both
cannot hold. Base UI's `Dialog.Popup` renders a plain `<div role="dialog">` and brings the focus
trap, the scroll lock, nested-dialog bookkeeping and the same `data-starting-style` /
`data-ending-style` hooks the rest of the tier animates on; `showModal()` would put one component
in the top layer, where the shared `z-index` and scrim do not reach, and would need its own
`::backdrop` animation story. §2.1 wins. The count §3 was making — that most of the 21 need nothing
beyond the platform — is unchanged in substance: Tier 2 was always going to be the Base UI tier.

**§2.1, "Popover's skin is reused by every other component in the tier" — `Toast` is the
exception.** Recorded while writing Plan B. It holds for `Dialog`, `Menu` and `Tooltip`. A toast
stack has no anchor and no positioner, and Base UI drives it through five custom properties of its
own (`--toast-index`, `--toast-offset-y`, `--toast-height`, `--toast-swipe-movement-x/y`).
`ToastRegion` takes exactly one thing from the shared file — its `z-index` — so the tier's stacking
order stays in one place. Sequencing Toast last was right for a different reason than the spec gave.

**§2.1, Tier 2's sheet — Base UI 1.8.0's `Drawer` was assessed and rejected.** Recorded while
writing Plan B. 1.8.0 ships `@base-ui/react/drawer` with swipe-to-dismiss, snap points and an iOS
virtual-keyboard provider. The sheet this tier needs is a bottom-docked dialog on a narrow
viewport, and `Drawer` is a second anatomy with its own parts and state attributes — which is
precisely the "one skin" claim the tier is built on. It is the right answer the day a screen asks
for swipe-to-dismiss, as its own component with its own changeset.

**§5.3, the Toast rule — the damage a second one does belongs to the viewport, not the provider.**
Recorded while writing Plan B, from reading Base UI 1.8.0's source. `Toast.Provider` renders no DOM
at all: a context provider plus a `null`-returning synchroniser. `Toast.Viewport` is what renders
the `role="region" aria-label="Notifications"` landmark, the hidden `role="alert"` mirror for
high-priority toasts, and four window- and document-level listeners. The rule §5.3 states survives
unchanged; the wording is corrected so nobody later concludes that a second bare `Provider` is the
hazard. `@calcifer-design/ui` ships all three parts as one `ToastRegion` component for that reason.

**§9, `Tooltip` — Base UI contributes no ARIA at all.** Recorded while writing Plan B. Its popup
carries no `role="tooltip"`, its trigger gets no `aria-describedby`, and it is disabled on touch
devices. The wrapper therefore requires a `label` and applies it as the trigger's `aria-label` as
well as the tip's text. §5.3's claim about `Tooltip.Provider` is confirmed by source: two contexts
and a timer, no DOM, no portal, no listeners — and it is optional, so the exported `TOOLTIP_DELAY`
is 600 because that is Base UI's own fallback, not a number this library invented.

**§2.1, Tier 2's fifth component — `Toast` ships as `ToastRegion` plus `createToastManager`.**
Recorded while writing Plan B. §2.1's inventory names it `Toast`; no such export exists. The
provider renders no DOM, the viewport renders the `role="region"` landmark and four window-level
listeners, and mounting one without the other is the failure §5.2 and §9 both name — so all three
parts ship as a single `ToastRegion` component nobody can half-mount, with `createToastManager()`
as the paired factory that creates the manager outside React. This matters beyond naming: Plan D's
docs app renders its inventory from §2.1 and from `/storybook/index.json`, and without this note the
two disagree with nothing to reconcile them.

**§2.1, Tier 2 — `NavMenu` is migrated onto the shared skin, and that is a minor.** Recorded while
writing Plan B. `NavMenu` predates the tier and already carried half a popup skin. Rather than leave
two skins in one library, Plan B's Task 8 points it at `src/styles/popup.module.css`. Its props are
untouched, but the live mobile navigation gains an entry and exit transition, a transform origin, a
viewport clamp with its own scrolling, and Base UI's `[data-instant]` hook. `@calcifer-design/ui` is
pre-1.0, where a patch reaches every `^0.2.x` consumer with no signal, so a deliberate change to a
published component's behaviour is released as a minor.

**§5.3, the Toast rule — the contract declares three methods, and `close` requires an id.** Recorded
while writing Plan B. `HostProps.hostToast` is typed as `{ add, close, update }` with `string`
payloads and nothing else: not `promise()`, not an action, not a `ReactNode`. The reason is that the
contract is the promise the **live** shell keeps — a remote deploys on its own clock and may call
these methods against a shell built months earlier, with no compilation shared between them — so
every method named is one that can never be withdrawn. `close` takes a **required** `toastId`
because Base UI's `closeToast` treats `undefined` as "close every toast in the store", which is a
reasonable power for the host that owns the region and an unreasonable one to hand a remote. Ids are
global to the host's store; the interface says so. This is an addition to §5.3's contract, not a
correction of it.

**§5.3, standalone mode — the remote branches on the manager's presence, not on `federated`.**
Recorded while writing Plan B. §5.3 says "standalone mode (a remote run on its own, the existing
`federated` flag) mounts its own toast provider". The flag is the wrong test: `export-app.tsx`
renders `<App {...props} federated />`, so a redeployed remote mounted by a shell that predates
`hostToast` has `federated === true` and no manager — and branching on the flag would hand it a
manager nobody is subscribed to and drop every toast silently. Branching on the manager collapses
standalone and old-shell into one case and satisfies the bullet's intent exactly.

**§8, tokens — the tier adds `--color-scrim`, and three `z-index` literals stay literals.** Recorded
while writing Plan B. `background: rgb(0 0 0 / 40%)` fails the token rule and the only token that
passes it — `var(--color-surface-inverse)` at reduced opacity — inverts between themes, so
`@calcifer-design/tokens@0.2.0` adds `--color-scrim`, themed separately in light and dark. It is a
consumer-visible coupling: an app that imports `tokens.css` from its own dependency must move that
dependency to `^0.2.0`, because the range inside `@calcifer-design/ui` only nests a copy nobody
imports and a missing custom property falls back to `transparent` with no error. The tier's stacking
order — 50 for anchored popups, 60 for the dialog, 70 for toasts — stays as three literals in
`popup.module.css` rather than becoming a `--z-*` scale invented for one tier.
```

```bash
git add docs/superpowers/specs/2026-09-12-portfolio-mfe-phase-4-design-system-remote-design.md
git commit -m "docs(design-system): record the Tier 2 errata"
```

- [ ] **Step 2: Write the failing type test**

Append to `packages/contract/test/remote-app.test-d.ts`:

```ts
describe('HostProps.hostToast', () => {
  it('is optional, so a remote still satisfies the type when a live shell supplies none', () => {
    expectTypeOf({
      hostMessage: 'Mounted by the shell at /projects/showcase',
      onEvent: () => undefined,
      hostReact: null,
    }).toMatchTypeOf<HostProps>();
  });

  it('promises three methods and no more, because each one is a promise a live shell must keep', () => {
    expectTypeOf<keyof HostToastManager>().toEqualTypeOf<'add' | 'close' | 'update'>();
  });

  it("is satisfied by the manager @calcifer-design/ui creates, which carries more than it promises", () => {
    // Declared here rather than imported: this package must not depend on the UI library, and
    // the point of the test is that the structural subset above admits the real thing.
    interface UiToastOptions {
      title: string;
      description?: string;
      tone?: 'info' | 'success' | 'warning' | 'danger';
      timeout?: number;
      priority?: 'low' | 'high';
      id?: string;
      action?: { label: string; onClick: () => void };
    }
    interface UiToastManager {
      add: (options: UiToastOptions) => string;
      close: (toastId?: string) => void;
      update: (toastId: string, options: Partial<UiToastOptions>) => void;
      readonly baseManager: unknown;
    }
    expectTypeOf<UiToastManager>().toMatchTypeOf<HostToastManager>();
  });

  it('carries only data across the seam: no ReactNode, no element, no callback', () => {
    expectTypeOf<HostToastOptions['title']>().toEqualTypeOf<string>();
    expectTypeOf<HostToastOptions['description']>().toEqualTypeOf<string | undefined>();
  });
});
```

and extend the file's type import to (already wrapped the way prettier wants it — the one-line form is 104 characters against a `printWidth` of 100):

```ts
import type {
  HostProps,
  HostToastManager,
  HostToastOptions,
  RemoteAppModule,
} from '../src/remote-app';
```

- [ ] **Step 3: Run the type test to verify it fails**

Run: `./node_modules/.bin/vitest run --project contract`

Expected: FAIL — `HostToastManager` and `HostToastOptions` are not exported from `../src/remote-app`. The contract project runs type tests through `typecheck: { enabled: true }`, so a type error is a test failure here, not a silent pass.

- [ ] **Step 4: Add the types to the contract**

In `packages/contract/src/remote-app.ts`, add above `HostProps`:

```ts
/**
 * What a remote may ask the host to show in its toast region. Data only, and `string` rather
 * than `ReactNode` on purpose: an element authored in a remote would render inside the host's
 * React root and under the host's CSS.
 */
export interface HostToastOptions {
  title: string;
  description?: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  /** Milliseconds before the toast dismisses itself. `0` keeps it until it is closed. */
  timeout?: number;
  /** `high` interrupts: the host mirrors it into a hidden alert region. */
  priority?: 'low' | 'high';
  /** Reusing an id updates that toast in place instead of stacking a second one. */
  id?: string;
}

/**
 * The host's toast manager, as a remote is allowed to see it.
 *
 * Deliberately narrower than the object the host actually passes. This interface is the promise
 * the *live* shell keeps: a remote deploys on its own clock and may call these methods against a
 * shell built months earlier, with no compilation shared between them, so every method named here
 * is one that can never be withdrawn. Three is enough for everything a remote has asked for.
 *
 * Ids are global to the host's store, not scoped to the remote that issued them: `close` and
 * `update` reach any toast in the host's region, including ones the shell itself raised. Pass
 * back an id `add` returned and nothing else.
 */
export interface HostToastManager {
  add: (options: HostToastOptions) => string;
  /**
   * Closes one toast, by the id `add` returned. Required on purpose, where the host's own manager
   * makes it optional: Base UI reads a missing id as "close every toast in the store", which is a
   * reasonable power for the host that owns the region and an unreasonable one to hand a remote.
   */
  close: (toastId: string) => void;
  update: (toastId: string, options: Partial<HostToastOptions>) => void;
}
```

A `(toastId?: string) => void` is assignable to `(toastId: string) => void`, so the manager `@calcifer-design/ui` creates still satisfies this interface unchanged — which is what the third type test in Step 2 asserts.

and add the field to `HostProps`:

```ts
  /**
   * The host's toast manager, when the host has one. Optional forever: the shell and each remote
   * deploy separately, so a remote must run against a shell that predates this field — branch on
   * the manager's presence, never on `federated`, which the remote sets for itself.
   */
  hostToast?: HostToastManager;
```

In `packages/contract/src/index.ts`, extend the type export line:

```ts
export type {
  RemoteAppModule,
  HostProps,
  HostToastManager,
  HostToastOptions,
  RemoteEvent,
} from './remote-app';
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
./node_modules/.bin/vitest run --project contract
bun run typecheck
```

Expected: PASS, 6 type tests in `remote-app.test-d.ts` (the two that were there plus these four).

- [ ] **Step 6: Lint and format**

```bash
./node_modules/.bin/prettier --write packages/contract/src/remote-app.ts packages/contract/src/index.ts packages/contract/test/remote-app.test-d.ts
./node_modules/.bin/eslint packages/contract
```

- [ ] **Step 7: Write the changeset**

Create `.changeset/host-toast.md`:

```markdown
---
'@calcifer-design/contract': minor
---

`HostProps` gains an optional `hostToast`: the host's toast manager, as a remote is allowed to see it. It is optional forever, because the shell and each remote deploy on their own clocks and a remote must keep working against a shell that predates the field. The declared shape is a structural subset of the manager the host actually passes — `add`, `close`, `update`, with string payloads — so the contract stays free of any dependency on a UI library, and so every method it names is one a live shell can keep. `close` requires its id: the ids are global to the host's single store, and an id-less close means "close everything in it".
```

- [ ] **Step 8: Commit**

```bash
git add packages/contract/src/remote-app.ts packages/contract/src/index.ts \
  packages/contract/test/remote-app.test-d.ts .changeset/host-toast.md
git commit -m "feat(contract): the host's toast manager travels with the Bridge props"
```

---

## Task 11: One toast region, owned by the host

**Files:**

- Modify: `apps/shell/package.json`
- Create: `apps/shell/src/toast/host-toast.ts`
- Create: `apps/shell/src/toast/host-toast.test.tsx`
- Modify: `apps/shell/src/routes/__root.tsx`
- Modify: `apps/shell/src/federation/RemoteRoute.tsx`
- Modify: `apps/shell/src/federation/RemoteRoute.test.tsx`

**Interfaces:**

- Consumes: `createToastManager` and `ToastRegion` from `@calcifer-design/ui@^0.3.0` (Task 7), `TooltipProvider` and `TOOLTIP_DELAY` from the same version (Task 6), `--color-scrim` from `@calcifer-design/tokens@^0.2.0` (Task 2), and `HostProps` with its `hostToast` field from Task 10.
- Produces: `hostToastManager`, exported from `apps/shell/src/toast/host-toast.ts` with the type `ToastManager` from `@calcifer-design/ui`. Task 12's showcase reads it only through the Bridge props; nothing imports it across the app boundary.

**This task cannot start before `@calcifer-design/ui@0.3.0` and `@calcifer-design/tokens@0.2.0` are both on npm** — Task 9's Step 7 gate. Check `npm view @calcifer-design/ui version` and `npm view @calcifer-design/tokens version` first.

- [ ] **Step 1: Write the failing test**

Create `apps/shell/src/toast/host-toast.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../../test/axe';
import { renderApp } from '../../test/render';
import { hostToastManager } from './host-toast';

describe('the host toast region', () => {
  it('mounts exactly one notifications landmark for the whole app', async () => {
    const { container } = renderApp('/about');
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    // One is the requirement, not an incidental count: a second viewport would duplicate the
    // landmark and the window-level F6, blur, focus and pointerdown listeners behind it.
    expect(screen.getAllByRole('region', { name: 'Notifications' })).toHaveLength(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows a toast raised through the manager the remotes are handed', async () => {
    renderApp('/about');
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    const identifier = hostToastManager.add({
      title: 'The showcase remote failed to load',
      tone: 'danger',
    });
    expect(await screen.findByText('The showcase remote failed to load')).toBeInTheDocument();
    hostToastManager.close(identifier);
    await waitFor(() =>
      expect(screen.queryByText('The showcase remote failed to load')).not.toBeInTheDocument(),
    );
  });
});
```

In `apps/shell/src/federation/RemoteRoute.test.tsx`, change the mock's returned element so the props the Bridge receives are observable — replace:

```tsx
      return (
        <div data-testid="remote-app">remote mounted with basename {String(props['basename'])}</div>
      );
```

with:

```tsx
      return (
        <div
          data-testid="remote-app"
          data-host-toast={typeof (props['hostToast'] as { add?: unknown } | undefined)?.add}
        >
          remote mounted with basename {String(props['basename'])}
        </div>
      );
```

and append a test to the `RemoteRoute` describe block:

```tsx
  it("hands the remote the host's toast manager, which is the one channel that crosses a React root", async () => {
    const loadModule = vi.fn(
      async () =>
        ({
          default: () => ({ render: async () => undefined, destroy: () => undefined }),
        }) as RemoteAppModule,
    );
    render(<RemoteRoute remote={showcase} loadModule={loadModule} />);
    expect(await screen.findByTestId('remote-app')).toHaveAttribute('data-host-toast', 'function');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
./node_modules/.bin/vitest run --project shell host-toast
./node_modules/.bin/vitest run --project shell RemoteRoute
```

Expected: the first FAILs because `./host-toast` does not exist; the second FAILs on the new test only, with `data-host-toast` reported as `"undefined"` — the string, because nothing is passing the prop yet.

- [ ] **Step 3: Take the published library version — both packages**

In `apps/shell/package.json`, change **two** dependencies:

```json
    "@calcifer-design/tokens": "^0.2.0",
    "@calcifer-design/ui": "^0.3.0",
```

then `bun install`. If the install cannot resolve either, the release has not been approved — stop and go back to Task 9's Step 7 rather than pinning a prerelease.

**The tokens line is not optional and nothing downstream catches its absence.** `entry.client.tsx` imports `@calcifer-design/tokens/tokens.css` from the shell's **own** top-level dependency, and a caret on a 0.x version pins the minor, so `^0.1.1` can never resolve the 0.2.0 that defines `--color-scrim`. Changesets rewriting the range *inside* `@calcifer-design/ui` only nests a second copy of the package that nothing imports. Leave the line alone and every modal `Dialog` and modal `Popover` in the live shell renders over a fully transparent backdrop — the variable is simply undefined, the declaration is invalid at computed-value time, and `background` falls back to `transparent`. No test sees it: the library's own jsdom suites resolve tokens through `workspace:*` and do have the variable, and `bun run check` never loads a stylesheet in a browser.

Verify the file that actually ships:

```bash
grep -c -- '--color-scrim' "$(bun -e "console.log(Bun.resolveSync('@calcifer-design/tokens/tokens.css', './apps/shell'))")"
```

Expected: a non-zero count — the `:root` block plus both dark blocks. Before this step the same command prints `0` and exits 1.

- [ ] **Step 4: Create the host's manager**

Create `apps/shell/src/toast/host-toast.ts`:

```ts
import { createToastManager } from '@calcifer-design/ui';

/**
 * The host's single toast manager, created at module scope rather than in React state.
 *
 * It has to outlive the tree that renders it: `RemoteRoute` remounts its Bridge wrapper on every
 * retry, and a remote holds this exact object for as long as it is mounted. It is also the one
 * thing that crosses the federation boundary — a plain object over a listener set, with no React
 * context and no module identity requirement, because context cannot cross a React root.
 */
export const hostToastManager = createToastManager();
```

- [ ] **Step 5: Mount the region once, and the tooltip provider with it, in the root frame**

In `apps/shell/src/routes/__root.tsx`, add the imports:

```tsx
import { SkipLink, TOOLTIP_DELAY, ToastRegion, TooltipProvider } from '@calcifer-design/ui';
import { hostToastManager } from '../toast/host-toast';
```

(the first replaces the existing `import { SkipLink } from '@calcifer-design/ui';`), then render the region inside `RootFrame`, immediately after the closing `</div>` of the frame and before the devtools block, and wrap the whole returned fragment in the provider:

```tsx
function RootFrame() {
  const registry = useRegistry();
  useRegisterRemotes(registry.data);
  return (
    <TooltipProvider delay={TOOLTIP_DELAY}>
      <SkipLink targetId="main">Skip to content</SkipLink>
      <div className={styles.frame}>
        <Header />
        <main id="main" tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
        <Footer />
      </div>
      <ToastRegion manager={hostToastManager} />
      {Devtools ? (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      ) : null}
    </TooltipProvider>
  );
}
```

The region is safe under prerender: Base UI's toast portal returns `null` until its portal node exists, and that node is created in an effect, so `renderToString` emits nothing and the viewport appears at hydration.

**The provider is here because the shell is the other half of a seam §5.3 asks to be invisible.** Task 6 exports `TOOLTIP_DELAY` "so both sides use one value", and Task 12 mounts a provider in the remote; without one here the shell is the side that never consumes it. What a provider buys is grouping, not the first delay: with one, a second tooltip in the same tree opens instantly once a neighbour has opened; without one, each trigger falls back to Base UI's own 600ms every single time. A pointer crossing from a remote's chrome into the shell's would feel the difference, which is exactly the discontinuity the bullet exists to remove. It costs nothing — Task 6's own test proves the provider renders no DOM, mounts no portal and attaches no listeners — and doing it now means the live shell's root route is edited once rather than twice.

- [ ] **Step 6: Pass the manager to every remote**

In `apps/shell/src/federation/RemoteRoute.tsx`, add the import:

```tsx
import { hostToastManager } from '../toast/host-toast';
```

and add one line to the `hostProps` literal, which keeps its `HostProps` annotation:

```tsx
  const hostProps: HostProps = {
    hostMessage: `Mounted by the shell at ${remote.routeBase}`,
    onEvent: ingestRemoteEvent,
    hostReact: React,
    hostToast: hostToastManager,
  };
```

The annotation is what makes this safe: the Bridge component's own props type is an index signature, so a typo here would otherwise reach a remote as a silently-absent prop.

- [ ] **Step 7: Run the tests to verify they pass**

```bash
./node_modules/.bin/vitest run --project shell host-toast
./node_modules/.bin/vitest run --project shell RemoteRoute
bun run test
bun run test:prerender
```

Expected: all PASS. `test:prerender` proves the region does not break the static build — if it reports a mismatch, the toast portal rendered server-side, which would mean the mount moved outside `RootFrame`.

- [ ] **Step 8: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write apps/shell/src/toast apps/shell/src/routes/__root.tsx apps/shell/src/federation/RemoteRoute.tsx apps/shell/src/federation/RemoteRoute.test.tsx apps/shell/package.json
./node_modules/.bin/eslint apps/shell/src
bun run typecheck
```

- [ ] **Step 9: Commit**

```bash
git add apps/shell/package.json apps/shell/src/toast apps/shell/src/routes/__root.tsx \
  apps/shell/src/federation/RemoteRoute.tsx apps/shell/src/federation/RemoteRoute.test.tsx bun.lock
git commit -m "feat(shell): one toast region, owned by the host"
```

No changeset: every app in this repository is private and versionless, so `changeset status` does not gate them. The contract's changeset from Task 10 is the only one this PR needs.

---

## Task 12: The showcase remote uses the host's manager, or its own

**Files:**

- Modify: `apps/showcase/package.json`
- Modify: `apps/showcase/src/app.tsx`
- Modify: `apps/showcase/src/host/host-store.ts`
- Modify: `apps/showcase/src/pages/Playground.tsx`
- Modify: `apps/showcase/src/app.test.tsx`
- Modify: `apps/showcase/src/pages/Playground.test.tsx`
- Modify: `apps/showcase/test/render.tsx`

**Interfaces:**

- Consumes: `HostProps` with `hostToast` from Task 10 (through `AppProps extends Partial<HostProps>`, which already exists), `createToastManager`, `ToastRegion`, `TooltipProvider`, `TOOLTIP_DELAY` from `@calcifer-design/ui@^0.3.0` (Tasks 6 and 7), and `--color-scrim` from `@calcifer-design/tokens@^0.2.0` (Task 2).
- Produces: `HostState.toast: HostToastManager` and `noHostToast` in `apps/showcase/src/host/host-store.ts`, plus `raiseToast(options: HostToastOptions): string` beside the existing `emitHostEvent`. Nothing outside this app consumes them.

**The branch that makes the two repositories independent.** The remote decides what to do by asking whether it was handed a manager, **not** by asking whether it is federated. `federated` is set by this remote's own Bridge wrapper (`export-app.tsx` renders `<App {...props} federated />`), so `federated === true && hostToast === undefined` is exactly the case of a shell that predates the contract change — and branching on `federated` would leave the remote holding a manager nobody is subscribed to, with every toast silently dropped. Branching on the manager collapses spec §5.3's third bullet into its first: standalone and old-shell are the same case, and both are handled by mounting a region of our own.

§5.3's third bullet says `federated` in so many words, so this is a departure from the spec's literal wording and not only from its intent. Task 10 Step 1 records it in §12 Errata, alongside the rest.

`TooltipProvider` needs no branch at all. It renders no DOM, mounts no portal and attaches no listeners, so it wraps the whole tree unconditionally in both modes — which is the entire point §5.3 was making about nesting being free. Task 11 mounts one in the shell for the same reason and with the same delay constant, so neither side of the seam falls back to an ungrouped 600ms. There is nothing to assert about its presence in a test here beyond the import; the library's own test proves it renders nothing.

- [ ] **Step 1: Write the failing tests**

Append to the `App` describe block in `apps/showcase/src/app.test.tsx`:

```tsx
  it("uses the host's toast manager when the shell supplies one, and mounts no region of its own", async () => {
    const hostToast = { add: vi.fn(() => 'toast-1'), close: vi.fn(), update: vi.fn() };

    render(
      <App
        federated
        hostReact={React}
        hostMessage="hello"
        onEvent={vi.fn()}
        hostToast={hostToast}
      />,
    );

    await waitFor(() => expect(hostStore.state.toast).toBe(hostToast));
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument();
  });

  it('mounts its own region when nothing supplies one, which covers standalone and an older shell alike', async () => {
    render(<App federated hostReact={React} hostMessage="hello" onEvent={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Notifications' })).toBeInTheDocument(),
    );
    hostStore.state.toast.add({ title: 'Ping delivered' });
    expect(await screen.findByText('Ping delivered')).toBeInTheDocument();
  });
```

The second test passes `federated` deliberately: it is the deploy-skew case, and a version of this component that branched on `federated` instead of on the manager would fail it.

Append to the `Playground route` describe block in `apps/showcase/src/pages/Playground.test.tsx`:

```tsx
  it('raises a toast through whichever manager is in play', async () => {
    const add = vi.fn(() => 'toast-1');
    hostStore.setState((state) => ({
      ...state,
      toast: { add, close: vi.fn(), update: vi.fn() },
    }));
    renderRoute('/playground');
    await userEvent.click(await screen.findByRole('button', { name: 'Raise a toast' }));
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Ping delivered', tone: 'success' }),
    );
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
./node_modules/.bin/vitest run --project showcase app
./node_modules/.bin/vitest run --project showcase Playground
```

Expected: both FAIL — `hostToast` is not a prop `App` reads, `hostStore.state.toast` does not exist, and there is no control named "Raise a toast".

- [ ] **Step 3: Take the published library version — both packages**

In `apps/showcase/package.json`, the same two lines Task 11 changed in the shell:

```json
    "@calcifer-design/tokens": "^0.2.0",
    "@calcifer-design/ui": "^0.3.0",
```

then `bun install`. `apps/showcase/src/index.tsx` imports `@calcifer-design/tokens/tokens.css` from this app's own dependency, so `^0.1.1` would leave the standalone showcase without `--color-scrim` exactly as it would the shell. Verify the same way:

```bash
grep -c -- '--color-scrim' "$(bun -e "console.log(Bun.resolveSync('@calcifer-design/tokens/tokens.css', './apps/showcase'))")"
```

Expected: a non-zero count.

- [ ] **Step 4: Give the host store a toast slot**

In `apps/showcase/src/host/host-store.ts`, extend the type import and the state:

```ts
import type { HostToastManager, HostToastOptions, RemoteEvent } from '@calcifer-design/contract';
```

```ts
export interface HostState {
  hostMessage: string;
  onEvent: (event: RemoteEvent) => void;
  hostReact: unknown;
  /** Whichever manager is in play: the host's when mounted by one, otherwise this app's own. */
  toast: HostToastManager;
  /** True when mounted by the shell through the Bridge, false standalone. */
  federated: boolean;
}

/**
 * The manager the store starts with: every call is dropped. It exists so `toast` is never
 * undefined for a component that reads it during the first render, before `App`'s effect has
 * run — the same shape as the `onEvent: () => undefined` above it.
 */
export const noHostToast: HostToastManager = {
  add: () => '',
  close: () => undefined,
  update: () => undefined,
};

export const hostStore = new Store<HostState>({
  hostMessage: '',
  onEvent: () => undefined,
  hostReact: undefined,
  toast: noHostToast,
  federated: false,
});
```

and add, beside `emitHostEvent`:

```ts
export function raiseToast(options: HostToastOptions) {
  return hostStore.state.toast.add(options);
}
```

- [ ] **Step 5: Wire the app**

Replace `apps/showcase/src/app.tsx` with:

```tsx
import type { HostProps } from '@calcifer-design/contract';
import {
  TOOLTIP_DELAY,
  ToastRegion,
  TooltipProvider,
  createToastManager,
} from '@calcifer-design/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { hostStore } from './host/host-store';
import { createShowcaseRouter } from './router';

export interface AppProps extends Partial<HostProps> {
  /** Provided by the Bridge when federated; "/" standalone. */
  basename?: string;
  federated?: boolean;
}

export function App({
  basename = '/',
  federated = false,
  hostMessage,
  onEvent,
  hostReact,
  hostToast,
}: AppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [router] = useState(() => createShowcaseRouter({ basepath: basename }));
  // Created unconditionally and used only when no host supplied one: it is a plain object over a
  // listener set, so an unused one costs nothing, and creating it lazily would make the decision
  // at mount time rather than per render.
  const [fallbackToastManager] = useState(createToastManager);
  const toastManager = hostToast ?? fallbackToastManager;
  // Branch on the manager, never on `federated`: this remote sets `federated` itself, so a shell
  // that predates the toast contract mounts us with `federated` true and no manager — the one
  // case where using the flag would drop every toast on the floor.
  const ownsToastRegion = hostToast === undefined;

  useEffect(() => {
    hostStore.setState((state) => ({
      ...state,
      federated,
      hostMessage: hostMessage ?? state.hostMessage,
      onEvent: onEvent ?? state.onEvent,
      hostReact,
      toast: toastManager,
    }));
  }, [federated, hostMessage, onEvent, hostReact, toastManager]);

  return (
    <TooltipProvider delay={TOOLTIP_DELAY}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {ownsToastRegion ? <ToastRegion manager={fallbackToastManager} /> : null}
      </QueryClientProvider>
    </TooltipProvider>
  );
}
```

- [ ] **Step 6: Give the Playground a control that uses it**

In `apps/showcase/src/pages/Playground.tsx`, extend the host-store import:

```tsx
import { emitHostEvent, hostStore, raiseToast } from '../host/host-store';
```

and replace the single "Ping the shell" button inside the message panel with both controls in a row:

```tsx
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => emitHostEvent('button-press', { id: 'ping' })}>
            Ping the shell
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              raiseToast({
                title: 'Ping delivered',
                description: "Raised through whichever toast region is mounted — the host's, or this app's own.",
                tone: 'success',
              })
            }
          >
            Raise a toast
          </Button>
        </div>
```

`styles.actions` already exists — `Playground.module.css:60` declares exactly `display: flex; flex-wrap: wrap; gap: var(--space-2)` and the form's Register/Reset row already wears it. Reuse it; do not add a second copy. `no-duplicate-selectors` is an error, not a warning, and Step 9's `stylelint "apps/showcase/src/**/*.css"` would fail this task on its own lint step. **The stylesheet is not modified by this task at all.**

- [ ] **Step 7: Cover the new field in the test harness**

In `apps/showcase/test/render.tsx`, extend the import and `resetHostStore` so it still writes a complete `HostState`:

```tsx
import { hostStore, noHostToast } from '../src/host/host-store';
```

```tsx
export function resetHostStore() {
  hostStore.setState(() => ({
    hostMessage: '',
    onEvent: () => undefined,
    hostReact: undefined,
    toast: noHostToast,
    federated: false,
  }));
}
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
./node_modules/.bin/vitest run --project showcase
bun run test
```

Expected: PASS, the whole showcase project and then the whole repository.

- [ ] **Step 9: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write apps/showcase/src/app.tsx apps/showcase/src/host/host-store.ts \
  apps/showcase/src/pages/Playground.tsx apps/showcase/src/app.test.tsx \
  apps/showcase/src/pages/Playground.test.tsx apps/showcase/test/render.tsx \
  apps/showcase/package.json
./node_modules/.bin/eslint apps/showcase
./node_modules/.bin/stylelint "apps/showcase/src/**/*.css"
bun run typecheck
```

- [ ] **Step 10: Commit**

```bash
git add apps/showcase bun.lock
git commit -m "feat(showcase): use the host's toast manager, or mount its own"
```

- [ ] **Step 11: Open the pull request**

Four commits — the errata, the contract, the shell, the showcase — in one PR, because `workspace:*` means there is no publish between them and splitting them would only manufacture a state where the shell supplies a field the contract does not declare. Merging it opens the Version Packages PR; merging *that* publishes `@calcifer-design/contract@0.3.0` to CodeArtifact one merge later, with no consumer waiting on it.

---

## Task 13: `@base-ui/react` becomes a strict shared singleton

**Files:**

- Modify: `package.json` (the workspace catalog)
- Modify: `apps/shell/package.json`, `apps/showcase/package.json`
- Modify: `packages/build-tools/src/shared-dependencies.ts`
- Modify: `packages/build-tools/test/shared-dependencies.test.ts`

**Interfaces:**

- Consumes: nothing from the other tasks.
- Produces: `sharedDependencies['@base-ui/react']` and `sharedDependencies['@base-ui/react/']`, both `{ singleton: true, strictVersion: true, requiredVersion: baseUiVersion }`, and `baseUiVersion` exported beside the existing `reactVersion`.

**Land this last, and consider landing it as its own PR.** Spec §5.3 ends with the sentence this task exists to honour *and* the sentence that keeps it honest: sharing Base UI is a bundle-size and consistency change, and it is **explicitly not what makes toast work**. Put that in the commit body, not only in the spec, so nobody later removes the manager-passing on the belief that this subsumed it. It is also the only change in this plan with a runtime failure mode.

**Two traps, both measured in the runtime's source.** `strictVersion` is a **no-op unless `requiredVersion` is a string** — `runtime-core/dist/utils/share.js` guards on exactly that, then calls `error()` (which throws) for strict and `warn()` otherwise. And `@base-ui/react` is not currently resolvable from the shell or the workspace root at all: it lives only in bun's isolated store, reachable from `@calcifer-design/ui`'s own `node_modules`. Declaring the share without adding the dependency leaves `requiredVersion` undefined and the flag silently does nothing — which is the precise failure this change is meant to prevent. Both apps must therefore take a real dependency on it.

With `shareStrategy: 'loaded-first'` the shell's copy wins the scope, and a remote that does not declare the share keeps its own bundle and never reaches the check — so turning this on here is inert-but-harmless for `wbw`, `ominous` and `nightward` until each adds `@base-ui/react` to its own Vite federation `shared` block. That is a per-remote redeploy on its own clock, and none of it belongs to this plan.

- [ ] **Step 1: Write the failing test**

In `packages/build-tools/test/shared-dependencies.test.ts`, replace the `shares the libraries as non-singletons` test with:

```ts
  it('shares the TanStack libraries as non-singletons', () => {
    for (const name of ['@tanstack/react-router', '@tanstack/react-query']) {
      expect(sharedDependencies[name]).toMatchObject({ singleton: false });
    }
  });

  it('shares Base UI strictly, under both the bare key and the subpath prefix', () => {
    // Every import in the design system is a subpath (`@base-ui/react/popover`, `/dialog`,
    // `/menu`, `/tooltip`, `/toast`), so the bare key alone matches nothing — the same reason
    // `react-dom/` is declared beside `react-dom`.
    for (const name of ['@base-ui/react', '@base-ui/react/']) {
      expect(sharedDependencies[name]).toMatchObject({
        singleton: true,
        strictVersion: true,
        requiredVersion: catalog['@base-ui/react'],
      });
    }
  });

  it('takes the Base UI range from the catalog, so strictVersion has a string to compare', () => {
    // `strictVersion` is a no-op when `requiredVersion` is undefined: the runtime guards on
    // `typeof requiredVersion === 'string'` before it decides between throwing and warning.
    expect(typeof baseUiVersion).toBe('string');
    expect(baseUiVersion).toBe(catalog['@base-ui/react']);
  });
```

and extend the import at the top of that file:

```ts
import { baseUiVersion, reactVersion, sharedDependencies } from '../src/shared-dependencies';
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project build-tools`

Expected: FAIL — `baseUiVersion` is not exported, the catalog has no `@base-ui/react` entry, and the existing declaration says `singleton: false`.

- [ ] **Step 3: Put the range in the workspace catalog**

In the root `package.json`, add the entry to `workspaces.catalog`:

```json
    "catalog": {
      "react": "^19.2.0",
      "react-dom": "^19.2.0",
      "@types/react": "^19.2.0",
      "@types/react-dom": "^19.2.0",
      "@base-ui/react": "^1.8.0"
    }
```

and add the dependency to **both** apps, in `apps/shell/package.json` and `apps/showcase/package.json`, in their `dependencies` blocks:

```json
    "@base-ui/react": "catalog:",
```

Then `bun install`, and verify it is now resolvable from the app the shell builds from — this is the step whose absence would make `strictVersion` silently inert:

```bash
bun -e "console.log(Bun.resolveSync('@base-ui/react/popover', './apps/shell'))"
```

Expected: a path, not `Cannot find module`.

- [ ] **Step 4: Declare the share**

In `packages/build-tools/src/shared-dependencies.ts`, generalise the catalog reader, export the Base UI range, widen the config type and declare both keys:

```ts
function readCatalogVersion(packageName: string): string {
  const rootPackageJson = JSON.parse(
    readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
  ) as RootPackageJson;
  const catalog = rootPackageJson.workspaces?.catalog ?? rootPackageJson.catalog;
  const version = catalog?.[packageName];
  if (!version) {
    throw new Error(`The root package.json workspace catalog has no \`${packageName}\` entry.`);
  }
  return version;
}

/**
 * The React range every federated app negotiates on, taken from the single place the
 * workspace already pins it: the root `package.json` catalog the apps depend on with
 * `"react": "catalog:"`. Hard-coding it here would let the two drift apart silently.
 */
export const reactVersion = readCatalogVersion('react');

/**
 * The Base UI range, from the same catalog and for the same reason. It has to be a string:
 * `strictVersion` is a no-op without it — the Module Federation runtime checks
 * `typeof requiredVersion === 'string'` before it decides between throwing and warning.
 */
export const baseUiVersion = readCatalogVersion('@base-ui/react');

interface SharedDependencyConfig {
  singleton: boolean;
  strictVersion?: boolean;
  requiredVersion?: string;
}
```

and replace the `'@base-ui/react': { singleton: false },` line with:

```ts
  // Every import in `@calcifer-design/ui` is a subpath, so the bare key matches nothing on its
  // own — the trailing-slash entry is what actually covers `@base-ui/react/popover` and its
  // siblings, exactly as `react-dom/` covers `react-dom/client`. `strictVersion` makes a major
  // drift fail loudly, in the remote's own error boundary, instead of producing two Base UI
  // copies whose floating-UI state does not agree.
  '@base-ui/react': { singleton: true, strictVersion: true, requiredVersion: baseUiVersion },
  '@base-ui/react/': { singleton: true, strictVersion: true, requiredVersion: baseUiVersion },
```

The old `readCatalogReactVersion` function is replaced by `readCatalogVersion`; delete it rather than leaving both.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
./node_modules/.bin/vitest run --project build-tools
bun run test
bun run build
```

Expected: PASS, and the build produces manifests that now list Base UI. Confirm:

```bash
grep -o '"@base-ui/react[^"]*"' apps/shell/dist/web/mf-manifest.json | sort -u
```

Expected: both keys. Before this task the same command printed nothing.

- [ ] **Step 6: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write package.json apps/shell/package.json apps/showcase/package.json \
  packages/build-tools/src/shared-dependencies.ts packages/build-tools/test/shared-dependencies.test.ts
./node_modules/.bin/eslint packages/build-tools
bun run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add package.json apps/shell/package.json apps/showcase/package.json \
  packages/build-tools/src/shared-dependencies.ts packages/build-tools/test/shared-dependencies.test.ts bun.lock
git commit -m "perf(federation): share @base-ui/react as a strict singleton

Both the bare key and the `@base-ui/react/` prefix, because every import in
the design system is a subpath and the bare key alone matches nothing.
Both apps take a real dependency on it: strictVersion is a no-op when
requiredVersion is undefined, and Base UI was previously reachable only
from @calcifer-design/ui's own node_modules.

This is a bundle-size and consistency change. It is explicitly not what
makes the host-owned toast region work — that is the manager object passed
through the Bridge props, and removing it on the belief that sharing
solved it would break every remote's toasts silently."
```

---

## Self-Review

Run against the spec after writing, before execution.

**Spec coverage.** §2.1's Tier 2 lists five components in a stated order — `Popover` first and alone (Task 3), then `Dialog` with a sheet variant (Task 4), `Menu` (Task 5), `Tooltip` (Task 6), `Toast` (Task 7) — and this plan follows it, with the shared skin authored in Task 3 as the reason the order exists. §5.1's argument is not re-litigated but is load-bearing in Tasks 7, 11 and 12: the manager crosses the boundary because it is a plain object, and nothing crosses through context. §5.2's claim is implemented as one indivisible `ToastRegion` and asserted by "exactly one notifications landmark" in both repositories. §5.3's three bullets are Tasks 11 (host mounts the single provider, portal and viewport, passes the manager through the Bridge contract, **and mounts a `TooltipProvider` on the delay constant so the host is the other side of that seam rather than an ungrouped fallback**), 12 (the remote mounts its own `Tooltip.Provider`; a remote with no manager — standalone or under a shell that predates the field — mounts its own toast region) and 6 (the delay constant exported from the library); its closing paragraph about `@base-ui/react` as a strict singleton is Task 13, kept separate on the spec's own instruction. Two of those depart from the spec's literal wording — the third bullet's `federated` becomes "no manager", and §2.1's `Toast` ships as `ToastRegion` — and both are recorded in §12 by Task 10 Step 1, which is where **all** of this plan's errata land: the spec lives in `portfolio-mfe`, so Tasks 1–9 cannot reach it. §8's conventions are the Global Constraints and are exercised by every component task. §9's two named requirements: `Alert`'s opt-in live region was Plan A's, and `Toast`'s one-viewport rule is asserted in Task 7 and again in Task 11. §10's rollout — "Plan B — Tier 2, beginning with Popover alone, and implementing the §5.3 provider rule including the Bridge contract change" — is the whole of this document.

**Out of scope, deliberately.** Tier 3 forms and Tier 4 page furniture (§2.1), the docs app and the forced-command migration (§6), and any change to the three external remotes. `wbw`, `ominous` and `nightward` need nothing here: an extra optional prop on a component that never destructures it is invisible, and their Base UI `shared` entries are a per-remote redeploy on their own clocks.

**Type consistency across tasks.** `popupStyles` exports `layer`, `dialogLayer`, `toastLayer`, `surface`, `scrim` (Task 3); Task 4 uses `dialogLayer`, `surface`, `scrim`, Task 5 `layer` and `surface`, Task 6 `layer` and `surface`, Task 7 `toastLayer` only. `PopupSide` and `PopupAlign` are declared in Task 3 and imported by Tasks 5 and 6 with `import type`. `a11yStyles.visuallyHidden` is declared in Task 1 and used by Tasks 3 and 8's existing consumers. `ToastManager`, `ToastOptions` and `createToastManager` are declared in Task 7; Task 10 declares the structural subset `HostToastManager`/`HostToastOptions` that admits them (verified with `tsc --strict`: `add: (options: ToastOptions) => string` is assignable to `add: (options: HostToastOptions) => string` because `HostToastOptions` is assignable to `ToastOptions`); Task 11 assigns the real one into the optional field; Task 12 reads it and stores it. `TOOLTIP_DELAY` is declared in Task 6 and consumed in Task 12. Every `data-popup` value a stylesheet matches — `popover`, `menu`, `tooltip`, `dialog`, `sheet` — is set by a component in Tasks 3, 4, 5, 6 or 8.

**Test-versus-implementation checks, made deliberately.** Popover's test asserts `data-popup="popover"`, which the component sets; the modal test asserts a close control named by `closeLabel`'s default `'Close'`, which the component renders only when `modal !== false`, and the non-modal test asserts its absence. Dialog's test asserts `data-variant` on the popup's `parentElement`, which is the `Dialog.Viewport` the component gives that attribute. Menu's test asserts one separator for the one item carrying `separatorBefore`, and `aria-disabled` on the item carrying `disabled`. Tooltip's test asserts the trigger's accessible name is the `label` the component applies as `aria-label`, and that `TooltipProvider` renders nothing, which its implementation guarantees by rendering only Base UI's provider. ToastRegion's test asserts `data-type` from `tone`, which `toBaseOptions` maps, and reaches the close control by `getByLabelText` because `closeLabel` becomes an `aria-label` on an `aria-hidden` element. **What was actually measured, and what is inference from it.** The evidence base is the spike in the library worktree: the two DOM-dump probes (`baseui-probe.test.tsx`, `baseui-probe2.test.tsx`) and a Popover suite that ran against the spike's own `Popover.tsx`. Everything in "What the probes measured" comes from those runs — including the focus-timing rule, whose one piece of direct evidence is that the spike's bare `expect(popup.contains(document.activeElement)).toBe(true)` fails today without a `waitFor` around it. The spike has **no** test files for `Dialog`, `Menu`, `Tooltip` or `ToastRegion`, `NavMenu.test.tsx` does not yet carry Task 8's assertion, and Task 3's `onOpenChange` test is new — the spike's `PopoverProps.onOpenChange` was still the one-argument `(open: boolean) => void`. Those four suites and the two new tests are written *from* the probe measurements rather than transcribed from a run, and the counts in each "Expected: PASS, N tests" line are the counts of `it` cases in that task's file, `it.each` entries included. A reviewer should treat the probe bullets as evidence and the per-component suites as the first thing execution will falsify.

**Known judgement calls, for the reviewer.** `Popover` paints a scrim for `modal={true}` and deliberately not for `modal="trap-focus"`: Base UI's backdrop is hit-testable except when the popover was opened by hover, and a full-viewport wash that swallows every outside click is the opposite of what `'trap-focus'` documents itself as doing. `HostToastManager.close` requires its id where the library's own manager does not, which is the plan's only narrowing made for authority rather than for dependencies — the alternative, a per-remote wrapper in `RemoteRoute` that tracks the ids it issued, is a mechanism the three-method contract does not otherwise need and was rejected as scope. The stacking order is three literals rather than three new tokens, because a `--z-*` scale invented for one tier is a token set nobody else can use — recorded in the stylesheet rather than in a changelog. `Dialog`'s `footer` is a plain `ReactNode` with no close callback: giving it one means either an `actionsRef` dance or a render prop, and the header's close control already covers the common case. `Tooltip` ships without a stylesheet, which is a first for this library and is exactly what "one skin" should look like. `ToastRegion` exposes `baseManager` on its public type so `ToastRegion` itself can subscribe; it is documented as not part of what a remote is given, and the contract's narrower type is what actually enforces that.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-13-portfolio-mfe-phase-4-plan-b-tier-2-floating-surfaces.md` in `/Users/calcifer/Code/calcifer-design-worktrees/gamma`.

**Order.** Tasks 1–9 are sequential and all in `calcifer-design`: 3 depends on 1 and 2, 4/5/6/7 each depend on 3, 8 depends on 3, and 9 depends on all of them. Task 2 is the only one that could run in parallel with Task 1. Tasks 10–13 are in `portfolio-mfe`: 10 before 11 (a type must exist before the shell assigns into it), 11 before 12 only by convention — they touch different apps — and 13 last, on its own or at the end of the same PR.

**The one gate a green CI run cannot see.** Between Task 9 and Task 11, `@calcifer-design/ui@0.3.0` **and** `@calcifer-design/tokens@0.2.0` must both be approved on npm by a human with 2FA, because the trusted publisher is configured without "Allow npm publish" and CI can only stage. `npm view @calcifer-design/ui version` and `npm view @calcifer-design/tokens version` are the check — the second matters as much as the first, because `ui@0.3.0` depends on `tokens@^0.2.0` and both apps take that dependency directly for their own `tokens.css` import. Everything before that gate is one repository's own business; everything after it is the other's.

**And one prerequisite that is nobody's gate but will stop Task 10 dead:** `/Users/calcifer/Code/portfolio-mfe-worktrees/gamma` has no `node_modules`. Task 10 Step 0 installs it.

**What is not a gate, despite looking like one.** The `@calcifer-design/contract` publish to CodeArtifact. It has exactly one consumer, in the same repository, at `workspace:*`, and the three external remotes cannot install it at all. The release trails the merge by one merge and nothing waits for it.
