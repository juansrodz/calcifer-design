# Phase 4 Plan C — Tier 3, the forms

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the six Tier 3 components — `Field` and `TextInput` together, then `Select`, `Checkbox`, `RadioGroup`, `Switch` — to `@calcifer-design/ui` on one shared field skin, release them as `@calcifer-design/ui@0.4.0`, and put them in front of a visitor through the showcase gallery. At the end of this plan the library can express every form the three consuming apps need and the whosbringingwhat revamp is unblocked.

**Architecture:** Every component in this tier is a thin wrapper over Base UI 1.8.0's `Field`, `Input`, `Select`, `Checkbox`, `Radio`/`RadioGroup` and `Switch` parts, which already supply label association, `aria-describedby` composition, `aria-invalid`, the roving focus of a radio group, a select's typeahead and a switch's keyboard contract. What the wrappers add is the visible state and one consistent anatomy: a shared stylesheet, `src/styles/field.module.css`, holds the frame, the label, the required mark, the description, the error and — the piece three components share — the control box itself, and each component varies it through data attributes Base UI already sets. `Field` is the frame for a native-input control and is what a consumer composes their own textarea or date input into; `Select`, `Checkbox`, `RadioGroup` and `Switch` each own a `Field.Root` internally, because their label anatomy is not a `<label for>` pointing at an `<input>` and composing them inside `Field` produces a measurably wrong accessibility tree. `Select` is the one component that also wears Tier 2's popup skin, under a new `data-popup='select'` variant, at the tier's shared anchored z-index. The validation story is deliberately thin: the error is a prop, so TanStack Form and Zod own validation in the consuming app and the library owns only how an error looks and how it is announced.

**Tech Stack:** React 19, TypeScript, Base UI 1.8.0, CSS Modules, Rslib (bundleless ESM), Storybook 10.6 on `storybook-react-rsbuild`, Vitest 5 + Testing Library + `vitest-axe`, Changesets, Module Federation 2.9, Playwright for the browser smoke.

**Spec:** `/Users/calcifer/Code/portfolio-mfe-worktrees/gamma/docs/superpowers/specs/2026-09-12-portfolio-mfe-phase-4-design-system-remote-design.md`. Sections 2.1 (Tier 3), 3, 5.3 (as it constrains a library component), 8, 9, 10 item 3, and the §12 errata that touch conventions, Base UI or naming are the ones this plan implements. The spec is the binding authority; where this plan departs from it, the departure is argued in "Decisions taken up front" below and is **already recorded** in the spec's §12 Errata — see "The errata are already written" after that section.

**Worktrees — this plan spans two repositories:**

| Tasks | Repository                                  | Worktree                                               | Branch                                                                         |
| ----- | ------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| 1–7   | `calcifer-design` (the library)             | `/Users/calcifer/Code/calcifer-design-worktrees/gamma` | `gamma/tier-3-forms`, branched from `main` at `10a56f0` (the 0.3.0 release)    |
| 8–9   | `portfolio-mfe` (the host and the showcase) | `/Users/calcifer/Code/portfolio-mfe-worktrees/gamma`   | `gamma/storybook-remote`, which carries the spec-docs commits on top of `main` |

Do not create another worktree in either repository. Both already exist.

**Step 0, before Task 1: install the library worktree.** `/Users/calcifer/Code/calcifer-design-worktrees/gamma` has **no `node_modules` at all**. Every command in Tasks 1–7 is either a package script or `./node_modules/.bin/<tool>`, and none of them resolves before this runs:

```bash
bun install
```

From the library worktree root. `bun.lock` is already in the tree and an install against it changes nothing, so nothing is committed by this step. The worktree is otherwise clean and sits on `10a56f0`, the `chore(release): version packages` commit that published `@calcifer-design/ui@0.3.0` and `@calcifer-design/tokens@0.2.0`; there is no spike to clear, unlike Plan B.

**Precondition on the other repository: Plan B's Tasks 10–13 land before Task 8 of this plan.** That is the `portfolio-mfe` half of Tier 2 — `packages/contract`'s `hostToast`/`HostToastManager`, `apps/shell/src/toast/host-toast.ts`, the single `ToastRegion` in `__root.tsx`, the showcase's host-or-own manager branch, and `@base-ui/react` as a strict shared singleton. Task 8 of this plan bumps the same two `package.json` files Plan B's Tasks 11 and 12 bump, and it expects to find `"@calcifer-design/ui": "^0.3.0"` and `"@calcifer-design/tokens": "^0.2.0"` there. **Do not redo any of Plan B's portfolio work and do not re-record its errata.** If `apps/shell/src/toast/host-toast.ts` does not exist when Task 8 starts, stop: Plan B's second half has not merged, and Task 8's starting state is wrong.

---

## Global Constraints

Copied from the spec and from both repositories' own rules. Every task's requirements implicitly include this section.

- **No single-letter identifiers anywhere**, including arrow-function parameters and loop variables. ESLint enforces it in both repositories (`id-length` minimum 2, `exceptions: []`). Unused parameters must be prefixed `_` (`argsIgnorePattern: '^_'`).
- **`npx`, `bunx` and `bun x` are blocked.** Run tools as `./node_modules/.bin/<tool>` from the worktree root, or through a package script.
- **Never run `prettier --write .`, `bun run format`, or any format command over a tree.** Format only the files you touched, by explicit path.
- **Commits carry no `Co-Authored-By` and no "generated by" trailer.**
- Do not run `git add -A` or `git commit -a`. Stage the files you changed, by explicit path.
- **Component shape:** `export function Name({ ...destructured with inline defaults }: NameProps)` — a named function declaration. No `forwardRef`, no `memo`, no `defaultProps`, no arrow-const components.
- **Types:** `export interface NameProps` beside the component. Union aliases are exported only when something else reuses them; one-off unions stay inline on the prop.
- **Variants are data attributes**, never composed class names. The boolean idiom is `condition ? '' : undefined`.
- **Barrel:** `packages/ui/src/index.ts` gains an adjacent value/type export pair per component, **appended** rather than alphabetised.
- **Naming follows the library's own precedents:** `heading`/`headingLevel` (Alert, Card, ErrorBoundary, Popover, Dialog), never `title`/`titleLevel`; `side: 'bottom' | 'end'` (Dialog's sheet). Tier 3 introduces `label`, `description` and `error`, and uses those three words consistently across all six components — never `helperText`, `hint`, `errorMessage` or `validationMessage`. Identifiers name what they are.
- **Every CSS value for a token-governed property must be a `var(--token)`.** Stylelint's `scale-unlimited/declaration-strict-value` governs, in full: every property ending `color`, `background`, `fill`, `stroke`, `outline-color`, `border-color`, `font-size`, `font-family`, `line-height`, `letter-spacing`, every `margin*` and `padding*` longhand and shorthand, `gap`/`row-gap`/`column-gap`, `border-radius`, `box-shadow`, `transition-duration`, `transition-timing-function`, every `border*` longhand and shorthand, `outline`, `animation-duration`, `animation-timing-function`, `transition`, `text-shadow`. `ignoreVariables: true`, `ignoreFunctions: false`, `expandShorthand: true`. `1px` and `solid` are allowed on `border*` and `outline` only; `max(var(--…), …)` is allowed on `padding` and `padding-inline` only.
- **Motion is the longhand triple**, never `transition:` — the shorthand is rejected three times over, because `expandShorthand` reads the property name inside it as a value.
- `z-index`, `max-height`, `max-width`, `min-width`, `width`, `height`, `inset`, `transform`, `transform-origin`, `opacity`, `overflow*`, `overscroll-behavior`, `transition-property`, `transition-behavior`, `accent-color`, `appearance`, `cursor` and `user-select` are **not** governed; bare values are fine there.
- `@keyframes` names are kebab-case. `@media (min-width: 48rem)` prefix notation only, never `(width >= 48rem)`, and never a `max-width` query. The allowed widths are `@calcifer-design/tokens`' `breakpoint` values and `packages/tokens/test/breakpoints.test.ts` globs **every** `{apps,packages}/**/*.module.css` to enforce it — so each new stylesheet this plan writes joins that data-driven suite automatically, and a width query outside the scale fails a test in a package this plan otherwise never touches.
- **`*.module.css.d.ts` files are gitignored and generated.** Never write one by hand and never commit one. `bun run --filter @calcifer-design/ui build` regenerates them; `bun run test` does not need them (Vitest resolves CSS Modules itself with `classNameStrategy: 'non-scoped'`, so `styles.control` is the string `'control'` in tests, and `fieldStyles.frame` is `'frame'`).
- **Tier 3 stories live under the `Forms/` group** (`title: 'Forms/<Name>'`), a new group beside the existing `Primitives/`, `Navigation/`, `Data/` and `Overlays/`. `argTypes` appear only for enum props, as `{ control: 'radio', options: [...] }`. Callback args use `fn()` from `storybook/test`.
- **Every component ships a `Dark` story**, `{ globals: { theme: 'dark' } }`, which is how `.storybook/preview.tsx`'s theme decorator is driven per story (it writes `document.documentElement.dataset.theme`). This is spec §9's "dark-mode pass" made explicit; Tiers 1 and 2 relied on the toolbar control and shipped no such story. `Dark` is **not** composed into the unit tests — the decorator mutates `document.documentElement` and the mutation outlives the test that caused it.
- **Each component task ends with `bun run typecheck`, explicitly.** On Plans A and B, `prettier`, `eslint` and `stylelint` all passed on code `tsc` rejected.
- CI gates a changeset on every touched published package (`changeset status --since=origin/main`). `@calcifer-design/ui` and `@calcifer-design/tokens` are published; the apps and `@calcifer-design/build-tools` are private and versionless, so they need none. **This plan writes no tokens changeset** — see Decision 8.

**Commands, verified working from each worktree root** — from the library worktree once Step 0's `bun install` has run, and from the `portfolio-mfe` worktree, which Plan B's Task 10 already installed:

| Purpose                                            | Command                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| One library component's tests                      | `./node_modules/.bin/vitest run --project ui <Name>`                                   |
| One library test file, with console output         | `./node_modules/.bin/vitest run --project ui <Name> --silent=false --reporter=verbose` |
| Every library unit test                            | `bun run test`                                                                         |
| Library lint (ESLint + Stylelint + Prettier check) | `bun run lint`                                                                         |
| Library typecheck (builds tokens and ui first)     | `bun run typecheck`                                                                    |
| Format one file                                    | `./node_modules/.bin/prettier --write <path>`                                          |
| Everything library CI runs                         | `bun run check`                                                                        |
| One portfolio app's tests                          | `./node_modules/.bin/vitest run --project showcase <Name>`                             |
| Portfolio typecheck / lint / unit tests            | `bun run typecheck`, `bun run lint`, `bun run test`                                    |
| Portfolio browser smoke                            | `bun run smoke`                                                                        |

---

## Decisions taken up front

The spec describes Tier 3 in two sentences. Everything below is a question it leaves open, or an answer it gives that the measurements in the next section contradict. Each is settled here with the alternative that was weighed, and each is recorded in the spec's §12 Errata.

**Decision 1: `Field` frames a native-input control. `Select`, `Checkbox`, `RadioGroup` and `Switch` each own a `Field.Root` internally and take `label`, `description` and `error` as their own props.**

The obvious design — one `Field` wrapper that every Tier 3 control is composed into — produces a measurably wrong accessibility tree for three of the five controls, and Base UI's own API says so in two places.

- **RadioGroup.** With a `Field.Label` above a `RadioGroup`, Base UI gives **every** `Radio.Root` an `aria-labelledby` pointing at the group's label, and gives every radio's wrapping `<label>` the **same** `id`, derived from the one control id `Field.Root` owns. Measured: two radios reading "Public" and "Private" both come back from `getByRole('radio', { name: 'Public' })`, which is the query failing rather than the markup being fine. The fix is `Field.Item`, which scopes a control id per option — and `Field.Item` is a part the caller composes, not something a generic `Field` wrapper can insert around an opaque `children`.
- **Select.** `Field.Label`'s own documentation says to pass `nativeLabel={false}` when the control is a `<button>` — "to avoid inheriting label behaviors on `<button>` controls (such as `<Select.Trigger>`…), including avoiding `:hover` on the button when hovering the label, and preventing clicks on the label from firing on the button". A generic `Field` cannot know whether its child renders a button.
- **Checkbox and Switch.** Their anatomy is a `<label>` that **wraps** the control and the text, on one row. A stacked label above a 20px box is not the control those two are.

The alternative considered was a `control` discriminator on `Field` (`control?: 'input' | 'button' | 'inline' | 'group'`) that switched all of this. It is four behaviours behind one enum, it still cannot insert a `Field.Item` per option, and every caller would have to know which value their child wants — which is the wrapper failing at the one thing a wrapper exists to do. The cost of this decision is that the label/description/error markup appears in five files; Decision 2 is what keeps that from being five skins.

**Decision 2: one shared stylesheet, `packages/ui/src/styles/field.module.css`, exactly as Tier 2 shares `popup.module.css`.**

It holds `frame`, `inlineFrame`, `label`, `required`, `optionLabel`, `legend`, `description`, `error`, `control` and `options`. Every Tier 3 component imports it from TSX; nothing `composes:` it, for the reason `a11y.module.css` records — `composes` copies the whole rule into every consuming stylesheet at build time, and stylelint rejects it outright (`property-no-unknown`, `value-keyword-case`). The variants live in this one file rather than in each component's own stylesheet for the same reason Tier 2's do: two single-class rules in two separately emitted stylesheets tie on specificity, and which one wins would then depend on the consumer's bundle order.

`.control` is the load-bearing member. `TextInput`'s `<input>`, `Select`'s trigger `<button>` and — by way of `TextInput`'s `render` prop, Decision 4 — a consumer's own `<textarea>` or `<input type="date">` all wear it, which is what makes three different elements read as one control.

**Decision 3: `required` travels from `Field` to its control through a small internal context, not through a prop repeated on both.**

`Field` needs `required` to draw the visible mark; the control needs it to carry the attribute. Base UI's `Field.Root` has `name`, `disabled` and `validate` but no `required`, so there is nothing to ride. Repeating the prop — `<Field label="Email" required><TextInput required /></Field>` — is two places to say one thing and one place to get it wrong silently: a mark with no attribute, or an attribute with no mark. `Field.tsx` therefore declares `FieldRequiredContext` (default `false`) and exports `useFieldRequired()` beside the component; `TextInput` reads it. Neither the context nor the hook is added to the barrel, so neither is part of the published surface — the same treatment `src/icons/CloseIcon.tsx` gets.

`TextInput` consequently has **no** `required` prop. That is the point.

**Decision 4: the escape hatch for a control this tier does not ship is `TextInput`'s `render` prop, not a seventh export.**

Spec §2.3 settles that "a native `<input type="date">` inside `Field` covers the one real date need in sight", and the whosbringingwhat revamp spec (§9.4) commits that repository to building its own textarea, image upload and date control "with the library's tokens and Field's markup contract". Both need a way to put an arbitrary element into the field's wiring. `TextInput` already extends Base UI's `Input`, which takes `render`, so `<TextInput render={<textarea rows={4} />} />` gets the control skin, the label association, the `aria-describedby`, the `aria-invalid` and the disabled state with nothing new exported.

The alternative was a `FieldControl` companion export wrapping Base UI's `Field.Control` — four lines, and a seventh name in a tier the spec sized at six. `render` costs nothing and is the composition Base UI already documents.

**Decision 5: `Select` takes an `options` array of `{ value: string; label: string; disabled?: boolean }` and a `string` value, not a generic value type and not compound children.**

`Menu`'s `MenuItem[]` is the library's precedent for a list-shaped wrapper and this follows it. Base UI's `SelectRoot` is generic over `Value` and supports object values through `itemToStringValue`/`itemToStringLabel`; carrying that generic through the wrapper would make `SelectProps` generic, which makes the barrel's `export type { SelectProps }` a generic type consumers must parameterise, and every one of the two selects the wbw revamp names (`ItemSidePanel`, `SuggestionsModal`) chooses a category string. A form submits strings. If a screen later needs an object value, `itemToStringValue` is how it comes back, and this note is why it was not there from the start.

`value` and `defaultValue` are `string | null` and `onValueChange` reports `string | null`, because Base UI reports `null` for a cleared select and a wrapper that narrowed that to `string` would be lying about a state the component can be in.

**Decision 6: `Select` wears Tier 2's popup skin under a new `data-popup='select'` variant, at the shared anchored z-index 50, with `alignItemWithTrigger` turned off.**

The variant is three declarations appended to `popup.module.css`: `gap: 0` (a list of options is adjacent rows, like `menu`), `min-width: var(--anchor-width)` (a dropdown at least as wide as its trigger — `SelectPositioner` sets `--anchor-width` on itself, confirmed in `select/positioner/SelectPositionerCssVars.js`), and `padding: var(--space-1)`. It is a variant rather than a reuse of `data-popup='menu'` because `menu`'s `min-width: 12rem` is a fixed dropdown width and a select's is its trigger's.

The positioner wears `popupStyles.layer`, so a select popup sits at `z-index: 50` — the same layer as every other anchored popup and the same layer as a dialog. `popup.module.css` already records why that is deliberate: every Base UI portal is appended to `document.body` when it opens and removed when it closes, so at equal z-index the open order decides, and a select opened from inside an already-open dialog is appended after it and paints above it. That is exactly the case the wbw revamp produces — a category select inside `EventModal`. Toasts stay at 70, above both.

`alignItemWithTrigger` defaults to `true` in `select/positioner/SelectPositioner.js:53`; that is the native-macOS behaviour where the popup overlays the trigger with the selected item on top of it. It is switched off here so a select behaves like every other anchored surface in the library: below its trigger, growing out of `--transform-origin`, honouring `side`, `align` and `sideOffset`. The alternative — keeping it — would make `Select` the one component in the library whose `side` prop does nothing.

**Decision 7: the error is a prop, and Base UI's validation is not used.**

`Field.Root` ships `validate`, `validationMode` and `validationDebounceTime`. None is exposed. The consuming apps validate with Zod through TanStack Form (whosbringingwhat revamp spec §5), and a library that owned a second validation engine would make the field's message and the form's message two different truths. So: `error?: string`, its presence puts the field in the error state, and `Field.Root` takes `invalid={error !== undefined}` — which is Base UI's own documented path, "Useful when the field state is controlled by an external library".

This has a measured consequence the naive rendering gets wrong. `<Field.Error match>` **always renders**, including when the field is valid: `match` is documented as "Specifying `true` will always show the error message, and lets external libraries control the visibility". Measured — a `Field.Root` with no `invalid` still emits the error `<div>` and still lists its id in the control's `aria-describedby`. So every component in this tier renders `Field.Error` **conditionally**, and there is a test for it in each.

**Decision 8: Tier 3 adds no token, so there is no tokens changeset and `@calcifer-design/tokens` stays at 0.2.0.**

The field skin needs an input surface, a resting border, a focus colour, an error colour, an error border and an error wash. All six exist: `--color-surface-input`, `--color-border-strong`, `--color-focus`, `--color-danger`, `--color-danger-border`, `--color-danger-surface`, in both themes. Plan B's Task 2 is the shape this would have taken if one had been missing, and it is worth saying that none is — because a token added for a component makes the component's release useless to any consumer who does not also take the token release, which is the coupling Plan B's Task 2 wrote down at length. Tier 3 escapes it entirely: Task 8 bumps `@calcifer-design/ui` alone and leaves `@calcifer-design/tokens` at `^0.2.0` in both apps.

**Decision 9: `TextInput` ships no start or end adornment in this tier, and that is an open question rather than an omission.**

The whosbringingwhat revamp spec §7.1 names "a show/hide password toggle" on the first screen ported. An adornment means the control box becomes a flex row wrapping the input, the focus ring moves from the input to the wrapper (`:focus-within`), and `.control` stops being one element three components can wear — the change touches Decision 2's whole basis. It is not built here. The consumer's fallback is a toggle button beside the field rather than inside it. Listed for the user in the report accompanying this plan; if the answer is "build it", it is a minor on top of 0.4.0 and not a change to this plan.

## The errata are already written

Plan B recorded its departures as a step inside its first `portfolio-mfe` task, because that is where the spec lives. This plan's errata were appended to the spec's §12 **when the plan was written**, in the `portfolio-mfe` gamma worktree, as the commit `docs(design-system): errata recorded while writing plan C`. **No task in this plan writes an erratum**, and Task 8 must not re-record them. They are, in the order they appear in §12:

1. **§3, dependencies — "`Checkbox` and `RadioGroup` are native inputs" is no longer true**, and Tier 3 is Base UI end to end.
2. **§2.1, Tier 3 — `Field` is not the frame for all six** (Decision 1).
3. **§2.1 and §3 — Tier 3 adds a second shared stylesheet and a `data-popup='select'` variant** (Decisions 2 and 6).
4. **§2.3 — the escape hatch for a date, a textarea or a file input is `TextInput`'s `render`** (Decision 4).
5. **§9 — the dark-mode pass is a per-story `globals: { theme: 'dark' }`** from Tier 3 onwards.
6. **§10 — Plan C ships before Plan D after all**, and what that does to Plan D's Tier 3 slot.

---

## What the probes measured

Every claim below was produced by running Base UI 1.8.0 in this repository's own jsdom setup — `./node_modules/.bin/vitest run --project ui <probe>` against a throwaway test file, since deleted — not read from documentation. Tasks depend on them; a test written against the intuition instead of the measurement fails.

**1. `Field.Root` + `Field.Label` + `Input` + `Field.Description` + `Field.Error match`, with `invalid`, emits:**

```html
<div data-invalid="">
  <label data-invalid="" id="…1" for="…0">Email</label>
  <input
    data-invalid=""
    id="…0"
    required=""
    aria-invalid="true"
    name="email"
    aria-labelledby="…1"
    aria-describedby="…3 …4"
  />
  <p data-invalid="" id="…3">We only use it to sign you in.</p>
  <div data-invalid="" id="…4">That address is not valid.</div>
</div>
```

So: the label is associated **twice**, by `for` and by `aria-labelledby`; `aria-describedby` is the description and the error **joined, in DOM order**; `aria-invalid="true"` comes from `Field.Root`'s `invalid`; and `data-invalid` lands on the root, the label, the control, the description and the error, which is what the stylesheet styles against. `getByLabelText('Email')` returns the `<input>`.

**2. Without `invalid`, the error still renders.** The same tree minus `invalid` still emits `<div id="…9">Required.</div>` and still lists its id in `aria-describedby`. `match` means "always show". This is Decision 7's measurement and the reason every wrapper renders `Field.Error` conditionally.

**3. `Field.Root disabled` puts `disabled=""` on the input and `data-disabled` on root, label and control.** `Field.Root`'s `disabled` takes precedence over the control's own, which is why Tier 3's components accept `disabled` at the wrapper and never on the inner control.

**4. `Checkbox.Root` renders `<span role="checkbox" tabindex="0" aria-checked>` plus a hidden `<input type="checkbox" aria-hidden="true" tabindex="-1">` with Base UI's own inline visually-hidden styles.** `indeterminate` gives `aria-checked="mixed"` and `data-indeterminate`. `required` gives `aria-required="true"` on the span. `Field.Root invalid` gives `aria-invalid="true"` on both the span and the hidden input.

**5. `Switch.Root` renders `<span role="switch" aria-checked>` with the same hidden input.** Space toggles it and Enter toggles it — both, measured, which is what spec §9's keyboard floor asks for.

**6. A `RadioGroup` inside a `Field.Root` that has a `Field.Label` names every radio after the group.** Measured, twice: with `Field.Label` rendering a `<label>` and with `nativeLabel={false}` rendering a `<span>`. Every `Radio.Root` comes out with `aria-labelledby` pointing at the field's label, and every wrapping `<label>` and every hidden `<input>` shares one `id`.

**7. `Field.Item` fixes it completely.** One `Field.Item` per option, each holding a `Field.Label` that wraps the `Radio.Root` and the option text, gives each radio its own `id`, its own `<label for>` and its own name. Measured on the group named by a plain `<span id>` that the `RadioGroup` points at with `aria-labelledby`:

```html
<span id="…0">Visibility</span>
<div role="radiogroup" aria-labelledby="…0" aria-describedby="…d">
  <div>
    <label id="…4" for="…3"
      ><span role="radio" aria-checked="true" aria-labelledby="…4" …>…</span
      ><input id="…3" type="radio" value="public" checked />Public</label
    >
  </div>
  <div>
    <label id="…9" for="…8"
      ><span role="radio" aria-checked="false" aria-labelledby="…9" …>…</span
      ><input id="…8" type="radio" value="private" />Private</label
    >
  </div>
</div>
<p id="…d">Who can see it.</p>
```

`getByRole('radiogroup', { name: 'Visibility' })` matches, `getAllByRole('radio', { name: 'Public' })` has length 1, `ArrowUp` from the second radio checks the first, clicking the option text selects it, and `axeDocument()` is clean.

**8. `Select.Trigger` is `role="combobox"` with `aria-haspopup="listbox"` and `aria-expanded`.** `Select.List` is the `role="listbox"`, with `id="<triggerId>-list"`; `Select.Item` is `role="option"` with `aria-selected` and `data-highlighted`. `Field.Label` with `nativeLabel={false}` names it, and `getByLabelText('Category')` returns the combobox. Typing `des` with the list open moves focus to the "Desserts" option — Base UI's typeahead — and `Enter` commits it and closes.

**9. `Field.Root invalid` does NOT put `aria-invalid` on a `Select.Trigger`.** Measured: the button gets `data-invalid=""` and no `aria-invalid`, where an `Input` in the same position gets both. Passing `aria-invalid="true"` to `Select.Trigger` explicitly does reach the DOM. So `Select` sets it itself, and Task 2 has a test whose only job is to keep that true.

**10. `Input`'s `onValueChange` fires once per keystroke with the new string.** Typing `ab` into a controlled `<Input value="" onValueChange={…} />` yields `["a", "b"]`, with no React controlled-input warning. This is what makes the TanStack Form adapter in Task 6 a five-line function.

---

## File structure

### Repository 1 — `calcifer-design` (Tasks 1–7)

**Created:**

| File                                                           | Responsibility                                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `packages/ui/src/styles/field.module.css`                      | The tier's shared skin: frame, label, required mark, description, error, and the control box. |
| `packages/ui/src/components/Field/Field.tsx`                   | The frame for a native-input control, plus the internal `required` context.                   |
| `packages/ui/src/components/Field/Field.stories.tsx`           | Stacked, described, error, required, disabled, a rendered `<textarea>`, dark.                 |
| `packages/ui/src/components/Field/Field.test.tsx`              | Label association, `aria-describedby`, `aria-invalid`, the conditional error, axe.            |
| `packages/ui/src/components/TextInput/TextInput.tsx`           | The `<input>` on the shared control skin; `render` is the escape hatch.                       |
| `packages/ui/src/components/TextInput/TextInput.stories.tsx`   | Types, placeholder, controlled, read-only, dark.                                              |
| `packages/ui/src/components/TextInput/TextInput.test.tsx`      | Controlled value, required from context, keyboard, disabled affordance, axe.                  |
| `packages/ui/src/components/Select/Select.tsx`                 | Trigger on the control skin, popup on the Tier 2 skin, options from an array.                 |
| `packages/ui/src/components/Select/Select.module.css`          | The trigger's value row, its chevron, and the option row.                                     |
| `packages/ui/src/components/Select/Select.stories.tsx`         | Default, placeholder, disabled option, error, open-on-load, dark, a keyboard play story.      |
| `packages/ui/src/components/Select/Select.test.tsx`            | Label association, keyboard navigation, typeahead, `aria-invalid`, axe over the document.     |
| `packages/ui/src/components/Checkbox/Checkbox.tsx`             | Inline field: a wrapping label, the box, the indicator.                                       |
| `packages/ui/src/components/Checkbox/Checkbox.module.css`      | The box, the tick, the indeterminate bar.                                                     |
| `packages/ui/src/components/Checkbox/Checkbox.stories.tsx`     | Checked, indeterminate, described, error, disabled, dark.                                     |
| `packages/ui/src/components/Checkbox/Checkbox.test.tsx`        | `aria-checked="mixed"`, space, required, error wiring, axe.                                   |
| `packages/ui/src/components/RadioGroup/RadioGroup.tsx`         | A group named by a plain element; one `Field.Item` per option.                                |
| `packages/ui/src/components/RadioGroup/RadioGroup.module.css`  | The option row, the dot, the horizontal orientation.                                          |
| `packages/ui/src/components/RadioGroup/RadioGroup.stories.tsx` | Default, horizontal, disabled option, error, dark.                                            |
| `packages/ui/src/components/RadioGroup/RadioGroup.test.tsx`    | One name per radio, arrow keys, click-the-label, error wiring, axe.                           |
| `packages/ui/src/components/Switch/Switch.tsx`                 | Inline field: a wrapping label, the track, the thumb.                                         |
| `packages/ui/src/components/Switch/Switch.module.css`          | The track, the thumb and its transition.                                                      |
| `packages/ui/src/components/Switch/Switch.stories.tsx`         | On, off, described, disabled, dark.                                                           |
| `packages/ui/src/components/Switch/Switch.test.tsx`            | `role="switch"`, space, enter, disabled affordance, axe.                                      |
| `packages/ui/src/components/Field/form-adapter.test.tsx`       | One assembled form and the TanStack-Form-shaped field adapter, with no such dependency.       |
| `.changeset/field-and-text-input.md` … `.changeset/switch.md`  | One per component task, listed in each task.                                                  |

**Modified:**

| File                                      | Change                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/ui/src/styles/popup.module.css` | A `data-popup='select'` variant (Task 2).                                    |
| `packages/ui/src/index.ts`                | Value/type export pairs appended per component.                              |
| `packages/ui/test/dist/ui-dist.test.ts`   | The six new names, and `field` added to the shared-stylesheet list (Task 7). |
| `README.md:24-27`                         | The component list (Task 7).                                                 |

### Repository 2 — `portfolio-mfe` (Tasks 8–9)

**Modified:**

| File                                                   | Change                                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `apps/showcase/package.json`                           | `@calcifer-design/ui` to `^0.4.0`.                                                |
| `apps/shell/package.json`                              | `@calcifer-design/ui` to `^0.4.0`, so the workspace resolves one copy.            |
| `apps/showcase/src/pages/ComponentsGallery.tsx`        | A "Forms" card holding all six components as one real form.                       |
| `apps/showcase/src/pages/ComponentsGallery.module.css` | A `.form` column for that card.                                                   |
| `apps/showcase/src/pages/ComponentsGallery.test.tsx`   | The new section, its label association and its error wiring.                      |
| `scripts/smoke.ts`                                     | The forms section is asserted and axe-checked on `/projects/showcase/components`. |

Nothing in `apps/shell/src`, `packages/contract` or `packages/build-tools` changes. Tier 3 has no provider, no portal owned by the host and no Bridge props contract — spec §5.3 binds `Toast` and `Tooltip` and nothing in this tier. A `Select` portals its popup to `document.body` from inside the remote's own React root, which is a DOM concern and not a context one, so it works across the federation boundary with no host cooperation at all. That is worth stating because it is the first question §5.3 provokes about any new floating surface.

---

## Task 1: `Field` and `TextInput`, and the skin the whole tier wears

**Files:**

- Create: `packages/ui/src/styles/field.module.css`
- Create: `packages/ui/src/components/Field/Field.tsx`
- Create: `packages/ui/src/components/Field/Field.stories.tsx`
- Create: `packages/ui/src/components/Field/Field.test.tsx`
- Create: `packages/ui/src/components/TextInput/TextInput.tsx`
- Create: `packages/ui/src/components/TextInput/TextInput.stories.tsx`
- Create: `packages/ui/src/components/TextInput/TextInput.test.tsx`
- Create: `.changeset/field-and-text-input.md`
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: nothing from earlier tasks. `var(--color-surface-input)`, `--color-border-strong`, `--color-danger`, `--color-danger-border`, `--color-danger-surface`, `--color-text-subtle` and `--size-touch` all already exist in `@calcifer-design/tokens@0.2.0` (Decision 8).
- Produces:
  - `packages/ui/src/styles/field.module.css`, whose exports are `frame`, `inlineFrame`, `label`, `legend`, `required`, `optionLabel`, `options`, `description`, `error` and `control` (all `string`). Tasks 2–5 import it as `import fieldStyles from '../../styles/field.module.css';`.
  - `Field` and `FieldProps` — `{ label: string; name?: string; description?: ReactNode; error?: string; required?: boolean; disabled?: boolean; children: ReactNode }`.
  - `useFieldRequired(): boolean`, exported from `Field.tsx` and **not** from the barrel. Task 1's `TextInput` is its only consumer in this plan.
  - `TextInput` and `TextInputProps`, plus `TextInputType` (`'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'date' | 'number'`). Tasks 6, 8 and 9 use them.

**They are one task because `Field` has no independently testable deliverable.** A frame with no control cannot prove label association, cannot prove `aria-describedby` and cannot prove a focus ring. Spec §2.1 says "`Field` and `TextInput` together" and this is the mechanical reason it is right.

- [ ] **Step 1: Write the shared stylesheet**

Create `packages/ui/src/styles/field.module.css`:

```css
/* The one field skin for Tier 3. `Field` authors it; `Select`, `Checkbox`, `RadioGroup` and
   `Switch` wear it unchanged, and vary it only through the data attributes Base UI already
   sets on the parts — `data-invalid`, `data-disabled`, `data-checked`, `data-indeterminate`.
   The variants live here rather than in each component's own stylesheet for the reason
   `popup.module.css` records: two single-class rules in two separately emitted stylesheets tie
   on specificity, and which one won would then depend on the consumer's bundle order.

   `.control` is the load-bearing member. `TextInput`'s <input>, `Select`'s trigger <button>
   and a consumer's own <textarea> rendered through `TextInput`'s `render` prop all wear it, so
   three different elements read as one control. A component stylesheet that also needs to say
   something about the control declares only properties this rule does not — see
   `Select.module.css`'s `.trigger`. */

.frame {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* A checkbox and a switch put their label beside the control, not above it, so the frame is a
   column of rows rather than a column of blocks and the gap is tighter. */
.inlineFrame {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: var(--leading-snug);
}

/* A radio group's name is not a <label>: it is a plain element the group points at with
   `aria-labelledby`, because a <label> would steal every radio's accessible name. Same type. */
.legend {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: var(--leading-snug);
}

.label[data-disabled],
.legend[data-disabled] {
  color: var(--color-text-muted);
}

/* Decorative: `aria-hidden` in the markup, because the control's own `required` attribute is
   what carries the requirement into the accessibility tree, and an asterisk read aloud after
   every label is noise. */
.required {
  color: var(--color-danger);
}

/* The row a checkbox, a radio or a switch shares with its text. The gap is the control's
   breathing room, and `cursor: pointer` is on the whole row because the whole row is a label. */
.optionLabel {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text);
  font-size: var(--text-md);
  line-height: var(--leading-snug);
  cursor: pointer;
}

.optionLabel[data-disabled] {
  cursor: not-allowed;
  color: var(--color-text-muted);
}

/* The list a radio group's options sit in. `RadioGroup` writes `data-orientation` on the same
   element, and the attribute makes the horizontal rule more specific than the base one, so the
   two can never depend on source order. */
.options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.options[data-orientation='horizontal'] {
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-prose);
}

.error {
  color: var(--color-danger);
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
}

.control {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--size-touch);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface-input);
  color: var(--color-text);
  font-size: var(--text-md);
  line-height: var(--leading-snug);
  transition-property: border-color, background-color;
  transition-duration: var(--motion-duration-1);
  transition-timing-function: var(--motion-ease);
}

.control::placeholder {
  color: var(--color-text-subtle);
}

/* base.css already draws the ring on every `:focus-visible`; this adds the border the ring
   sits against, so a focused field reads as focused and not merely outlined. */
.control:focus-visible {
  border-color: var(--color-accent);
}

.control[data-invalid] {
  border-color: var(--color-danger-border);
  background: var(--color-danger-surface);
}

.control[data-disabled] {
  cursor: not-allowed;
  opacity: 0.55;
}
```

- [ ] **Step 2: Write the stories**

Create `packages/ui/src/components/Field/Field.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from '../TextInput/TextInput';
import { Field } from './Field';

const meta = {
  title: 'Forms/Field',
  component: Field,
  args: {
    label: 'Email',
    name: 'email',
    children: <TextInput type="email" placeholder="you@example.com" />,
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Described: Story = {
  args: { description: 'We only use it to sign you in.' },
};

export const Required: Story = {
  args: { required: true, description: 'We only use it to sign you in.' },
};

export const WithError: Story = {
  args: {
    description: 'We only use it to sign you in.',
    error: 'Enter an email address.',
  },
};

export const Disabled: Story = { args: { disabled: true } };

/** The escape hatch spec §2.3 and the whosbringingwhat revamp both need: any element, fully
    wired, wearing the control skin. A textarea here; a date or file input is the same shape. */
export const RenderedTextarea: Story = {
  args: {
    label: 'Notes',
    name: 'notes',
    description: 'Anything the host should know.',
    children: <TextInput render={<textarea rows={4} />} />,
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { description: 'We only use it to sign you in.', error: 'Enter an email address.' },
};
```

Create `packages/ui/src/components/TextInput/TextInput.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Field } from '../Field/Field';
import { TextInput } from './TextInput';

const meta = {
  title: 'Forms/TextInput',
  component: TextInput,
  args: { placeholder: 'you@example.com', onValueChange: fn() },
  argTypes: {
    type: {
      control: 'radio',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'date', 'number'],
    },
  },
  decorators: [
    (Story) => (
      <Field label="Email" name="email">
        <Story />
      </Field>
    ),
  ],
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Email: Story = { args: { type: 'email' } };
export const Password: Story = { args: { type: 'password', placeholder: undefined } };
export const Date: Story = { args: { type: 'date', placeholder: undefined } };
export const ReadOnly: Story = { args: { defaultValue: 'sebastian@example.com', readOnly: true } };
export const Dark: Story = { globals: { theme: 'dark' } };
```

`Date` shadows the global `Date` inside this module. That is deliberate and harmless — Storybook names a story after its export and nothing in this file constructs a date — but it is the one place in the library where a story name is also a global, so it is called out rather than discovered.

- [ ] **Step 3: Write the failing tests**

Create `packages/ui/src/components/Field/Field.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { TextInput } from '../TextInput/TextInput';
import { Field } from './Field';
import * as stories from './Field.stories';

// `Dark` is deliberately not composed: the preview decorator writes
// `document.documentElement.dataset.theme` and the mutation outlives the test that caused it.
const { Default, Described, Required, WithError, Disabled, RenderedTextarea } =
  composeStories(stories);

describe('Field', () => {
  it.each([
    ['Default', Default],
    ['Described', Described],
    ['Required', Required],
    ['WithError', WithError],
    ['Disabled', Disabled],
    ['RenderedTextarea', RenderedTextarea],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('associates the label with the control, so a caller can find it by its label', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('describes the control with the description', () => {
    render(<Described />);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'We only use it to sign you in.',
    );
  });

  it('renders no error node and marks nothing invalid when no error is given', () => {
    render(<Described />);
    const control = screen.getByLabelText('Email');
    expect(control).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Enter an email address.')).not.toBeInTheDocument();
  });

  it('marks the control invalid and describes it with the error and the description together', () => {
    render(<WithError />);
    const control = screen.getByLabelText('Email');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    // Base UI joins every registered describer into one `aria-describedby`, in DOM order.
    expect(control).toHaveAccessibleDescription(
      'We only use it to sign you in. Enter an email address.',
    );
  });

  it('marks the control required without putting an asterisk in its accessible name', () => {
    render(<Required />);
    const control = screen.getByLabelText('Email');
    expect(control).toBeRequired();
    expect(control).toHaveAccessibleName('Email');
  });

  it('disables the control and says so on the frame, so the skin can dim it', () => {
    render(<Disabled />);
    const control = screen.getByLabelText('Email');
    expect(control).toBeDisabled();
    expect(control).toHaveAttribute('data-disabled');
  });

  it('wires a caller-rendered element exactly as it wires its own input', () => {
    render(<RenderedTextarea />);
    const control = screen.getByLabelText('Notes');
    expect(control.tagName).toBe('TEXTAREA');
    expect(control).toHaveClass('control');
    expect(control).toHaveAccessibleDescription('Anything the host should know.');
  });

  it('takes a name for form submission', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
  });

  it('reaches the control with the keyboard and refuses a disabled one', async () => {
    render(
      <>
        <Field label="Email" name="email">
          <TextInput type="email" />
        </Field>
        <Field label="Locked" name="locked" disabled>
          <TextInput />
        </Field>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    // A disabled control is not in the tab order at all, so the next tab leaves the form.
    await userEvent.tab();
    expect(screen.getByLabelText('Locked')).not.toHaveFocus();
  });
});
```

Create `packages/ui/src/components/TextInput/TextInput.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Field } from '../Field/Field';
import { TextInput } from './TextInput';
import * as stories from './TextInput.stories';

const { Default, Email, Password, ReadOnly } = composeStories(stories);

describe('TextInput', () => {
  it.each([
    ['Default', Default],
    ['Email', Email],
    ['Password', Password],
    ['ReadOnly', ReadOnly],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('wears the shared control skin', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).toHaveClass('control');
  });

  it('reports every keystroke as the new value', async () => {
    const onValueChange = vi.fn();
    render(
      <Field label="Email" name="email">
        <TextInput value="" onValueChange={onValueChange} />
      </Field>,
    );
    await userEvent.type(screen.getByLabelText('Email'), 'ab');
    expect(onValueChange.mock.calls.map((call) => call[0])).toEqual(['a', 'b']);
  });

  it('takes its required state from the field, not from a prop of its own', () => {
    render(
      <Field label="Email" name="email" required>
        <TextInput />
      </Field>,
    );
    expect(screen.getByLabelText('Email')).toBeRequired();
  });

  it('is not required outside a field, where there is no frame to ask', () => {
    render(<TextInput aria-label="Loose" />);
    expect(screen.getByLabelText('Loose')).not.toBeRequired();
  });

  it('accepts typing and reports the typed value when uncontrolled', async () => {
    render(
      <Field label="Email" name="email">
        <TextInput defaultValue="" />
      </Field>,
    );
    const control = screen.getByLabelText('Email');
    await userEvent.type(control, 'hello');
    expect(control).toHaveValue('hello');
  });

  it('does not apply its own type when the caller renders a different element', () => {
    render(
      <Field label="Notes" name="notes">
        <TextInput render={<textarea />} />
      </Field>,
    );
    expect(screen.getByLabelText('Notes')).not.toHaveAttribute('type');
  });
});
```

`TextInput` outside a `Field` needs an accessible name of its own, which is why that one test passes `aria-label`. `TextInputProps` does not declare it; it reaches the DOM through the rest spread in Step 5 — and this is the only place in the tier that relies on that, because every other use is inside a field.

- [ ] **Step 4: Run the tests to verify they fail**

```bash
./node_modules/.bin/vitest run --project ui Field
./node_modules/.bin/vitest run --project ui TextInput
```

Expected: FAIL for both — `Failed to resolve import "./Field"` and `"./TextInput"`.

- [ ] **Step 5: Write the two components**

Create `packages/ui/src/components/Field/Field.tsx`:

```tsx
import { Field as BaseField } from '@base-ui/react/field';
import { createContext, useContext, type ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';

/**
 * Carries `required` from the frame to the control inside it.
 *
 * Base UI's `Field.Root` propagates `name` and `disabled` to whatever control is beneath it but
 * has no `required` of its own, so without this the prop would have to be written twice — once
 * on `Field` for the visible mark and once on the control for the attribute — which is two
 * places to say one thing and one place to get it silently wrong. Internal: neither this
 * context nor the hook below is exported from `src/index.ts`, exactly as `icons/CloseIcon` is
 * internal, so neither is part of the published surface.
 */
const FieldRequiredContext = createContext(false);

/** Internal. Read by `TextInput`; not exported from the barrel. */
export function useFieldRequired(): boolean {
  return useContext(FieldRequiredContext);
}

export interface FieldProps {
  /** The visible label, and the control's accessible name. */
  label: string;
  /**
   * Identifies the field when a form is submitted. It takes precedence over any `name` the
   * control carries, which is why no control in this tier has one.
   */
  name?: string;
  /** Sits under the control and joins the control's `aria-describedby`. */
  description?: ReactNode;
  /**
   * The validation message. Its presence — not its content — is the error state: the frame
   * becomes `invalid`, the control gets `aria-invalid="true"` and the message joins the
   * control's `aria-describedby`. Validation itself belongs to the consuming app; the library
   * owns only how an error looks and how it is announced.
   */
  error?: string;
  /**
   * Draws the required mark and puts `required` on the control. Note that a native `required`
   * also arms the browser's own validation bubble on submit; a form driven by TanStack Form or
   * any other library should carry `noValidate` on the `<form>`, as such forms normally do.
   */
  required?: boolean;
  disabled?: boolean;
  /**
   * The control. `TextInput` is the one this tier ships for it; anything else Base UI's field
   * context reaches works too, and `TextInput`'s `render` prop is how a caller's own element —
   * a `<textarea>`, an `<input type="file">` — gets the same wiring and the same skin.
   *
   * `Select`, `Checkbox`, `RadioGroup` and `Switch` are **not** composed in here: each owns its
   * own field frame, because a `<label for>` above a control is not the anatomy any of them has.
   */
  children: ReactNode;
}

export function Field({
  label,
  name,
  description,
  error,
  required = false,
  disabled = false,
  children,
}: FieldProps) {
  return (
    <BaseField.Root
      className={fieldStyles.frame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      <BaseField.Label className={fieldStyles.label}>
        {label}
        {required ? (
          <span className={fieldStyles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </BaseField.Label>
      <FieldRequiredContext.Provider value={required}>{children}</FieldRequiredContext.Provider>
      {description === undefined ? null : (
        <BaseField.Description className={fieldStyles.description}>
          {description}
        </BaseField.Description>
      )}
      {/* Conditional, and it has to be. `Field.Error match` means "always show", so a version
          of this that rendered it unconditionally would put an empty error node in every
          field's `aria-describedby`. Measured. */}
      {error === undefined ? null : (
        <BaseField.Error className={fieldStyles.error} match>
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}
```

Create `packages/ui/src/components/TextInput/TextInput.tsx`:

```tsx
import { Input as BaseInput } from '@base-ui/react/input';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { useFieldRequired } from '../Field/Field';
import fieldStyles from '../../styles/field.module.css';

export type TextInputType =
  'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'date' | 'number';

export interface TextInputProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'className' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'required' | 'name' | 'disabled'
> {
  /** Ignored when `render` is given: the caller's element brings its own. */
  type?: TextInputType;
  value?: string;
  defaultValue?: string;
  /** Base UI reports the new value directly; there is no event to read `.target.value` off. */
  onValueChange?: (value: string) => void;
  /**
   * Render a different element in place of the `<input>`, keeping the field wiring and the
   * control skin: a `<textarea rows={4} />`, an `<input type="file" />`, a masked input. This
   * is the tier's escape hatch for a control the library does not ship.
   */
  render?: ReactElement;
}

export function TextInput({
  type = 'text',
  value,
  defaultValue,
  onValueChange,
  render,
  ...rest
}: TextInputProps) {
  // `name`, `disabled` and the id come from the surrounding `Field.Root` through Base UI's own
  // context, and `Field.Root`'s values take precedence over a control's, so none of them is a
  // prop here. `required` is the exception: `Field.Root` has no such prop to propagate.
  const required = useFieldRequired();
  return (
    <BaseInput
      {...rest}
      className={fieldStyles.control}
      type={render === undefined ? type : undefined}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      required={required}
      render={render}
    />
  );
}
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
./node_modules/.bin/vitest run --project ui Field
./node_modules/.bin/vitest run --project ui TextInput
```

Expected: PASS — 15 tests in `Field.test.tsx` and 10 in `TextInput.test.tsx`, 25 in all.

If `toHaveAccessibleDescription('We only use it to sign you in. Enter an email address.')` fails with the two halves in the other order, the description and the error are being rendered in the wrong order inside `Field.Root` — Base UI joins registered describers in DOM order, so the fix is the JSX order, not the assertion.

- [ ] **Step 7: Append the exports to the barrel**

At the end of `packages/ui/src/index.ts` — appended, not alphabetised:

```ts
export { Field } from './components/Field/Field';
export type { FieldProps } from './components/Field/Field';
export { TextInput } from './components/TextInput/TextInput';
export type { TextInputProps, TextInputType } from './components/TextInput/TextInput';
```

`useFieldRequired` is deliberately absent.

- [ ] **Step 8: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/styles/field.module.css packages/ui/src/components/Field/Field.tsx packages/ui/src/components/Field/Field.stories.tsx packages/ui/src/components/Field/Field.test.tsx packages/ui/src/components/TextInput/TextInput.tsx packages/ui/src/components/TextInput/TextInput.stories.tsx packages/ui/src/components/TextInput/TextInput.test.tsx packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src
./node_modules/.bin/stylelint packages/ui/src/styles/field.module.css
bun run typecheck
```

Expected: no output from eslint and stylelint; `typecheck` ends with the per-workspace runs passing. `typecheck` is what generates `packages/ui/src/styles/field.module.css.d.ts`; it is gitignored and must not be staged.

- [ ] **Step 9: Write the changeset**

Create `.changeset/field-and-text-input.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `Field` and `TextInput`, the first two Tier 3 form components, on a new shared field skin (`src/styles/field.module.css`). `Field` supplies the label, the required mark, the description and the error message, and wires all four into the control's accessible name and description through Base UI's `Field`. `TextInput` is the native input on that skin; its `render` prop puts any other element — a `<textarea>`, a date or file input — into the same wiring, which is how a consumer builds a control the library does not ship.

The error is a prop, not a validation engine: `error` present means invalid, so Zod, TanStack Form or anything else stays the single source of truth for what is wrong.
```

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/styles/field.module.css packages/ui/src/components/Field packages/ui/src/components/TextInput packages/ui/src/index.ts .changeset/field-and-text-input.md
git commit -m "feat(ui): add Field and TextInput on a shared field skin"
```

---

## Task 2: `Select`, on both shared skins

**Files:**

- Create: `packages/ui/src/icons/ChevronDownIcon.tsx`
- Create: `packages/ui/src/icons/CheckIcon.tsx`
- Create: `packages/ui/src/components/Select/Select.tsx`
- Create: `packages/ui/src/components/Select/Select.module.css`
- Create: `packages/ui/src/components/Select/Select.stories.tsx`
- Create: `packages/ui/src/components/Select/Select.test.tsx`
- Create: `.changeset/select.md`
- Modify: `packages/ui/src/styles/popup.module.css` (append the `data-popup='select'` variant)
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: `fieldStyles` from Task 1 (`frame`, `label`, `required`, `description`, `error`, `control`), `popupStyles` from Tier 2 (`layer`, `surface`), and the two type aliases Tier 2 produced (`import type { PopupAlign, PopupSide } from '../Popover/Popover';`).
- Produces: `Select`, `SelectProps` and `SelectOption` (`{ value: string; label: string; disabled?: boolean }`). Tasks 6, 8 and 9 use them. Also `ChevronDownIcon` and `CheckIcon` in `src/icons/`, internal like `CloseIcon` and absent from the barrel.

**The four things this task exists to get right**, each measured rather than assumed:

1. **`aria-invalid` does not arrive on its own.** `Field.Root invalid` gives the trigger `data-invalid` and nothing else, where an `Input` in the same position gets `aria-invalid="true"` too. So `Select` sets it, and a test exists whose only job is to keep that true.
2. **The label must not be a native `<label>`.** Base UI's own `nativeLabel` documentation names `<Select.Trigger>` as the case: a native label pointing at a button makes the button `:hover` when the label is hovered and makes a click on the label fire the button. `nativeLabel={false}` with `render={<span />}` keeps the association — `getByLabelText('Category')` still returns the combobox — and drops the behaviour.
3. **`alignItemWithTrigger` defaults to `true`** (`select/positioner/SelectPositioner.js:53`), which is the native-macOS overlay where the popup covers the trigger. Off, per Decision 6, so `side`, `align` and `sideOffset` mean what they mean everywhere else in the library.
4. **The open-state attribute on the chevron is `data-popup-open`, not `data-open`.** Measured. `data-open` is what the _popup_ gets; a rotation rule written against `data-open` on the icon silently never fires.

- [ ] **Step 1: Add the `select` popup variant**

Append to `packages/ui/src/styles/popup.module.css`, after the `data-popup='sheet'` rules and before the `[data-starting-style]` block:

```css
/* A select's list is adjacent rows, like a menu's — so `gap: 0` for the same reason. Its width
   is its trigger's rather than a fixed dropdown width, which is the one thing that makes it a
   separate variant: `SelectPositioner` publishes `--anchor-width` on itself (confirmed in
   `select/positioner/SelectPositionerCssVars.js`) and it inherits into the popup. The `max()`
   floor matters in jsdom and in any environment with no layout, where the custom property
   resolves to `0px`. */
.surface[data-popup='select'] {
  gap: 0;
  min-width: max(var(--anchor-width), 10rem);
  padding: var(--space-1);
}
```

`min-width` is not a token-governed property, so the bare `10rem` is allowed; `padding` is, and `var(--space-1)` satisfies it.

- [ ] **Step 2: Write the two icons**

Create `packages/ui/src/icons/ChevronDownIcon.tsx`:

```tsx
/**
 * The chevron on a `Select` trigger. Internal, exactly as `CloseIcon` is: the barrel does not
 * export it, so consumers bring their own icon set. It is decorative — Base UI marks
 * `Select.Icon` `aria-hidden` itself — and declares no size; the control that holds it sizes it.
 */
export function ChevronDownIcon() {
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
      <path d="m4 6.25 4 4 4-4" />
    </svg>
  );
}
```

Create `packages/ui/src/icons/CheckIcon.tsx`:

```tsx
/**
 * The tick inside a selected `Select` option and a ticked `Checkbox`. Internal, like
 * `CloseIcon` and `ChevronDownIcon`; decorative in both places, because the option's text and
 * the checkbox's label carry the meaning.
 */
export function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}
```

- [ ] **Step 3: Write the stories**

Create `packages/ui/src/components/Select/Select.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { Select } from './Select';

const meta = {
  title: 'Forms/Select',
  component: Select,
  args: {
    label: 'Category',
    name: 'category',
    options: [
      { value: 'mains', label: 'Mains' },
      { value: 'sides', label: 'Sides' },
      { value: 'desserts', label: 'Desserts' },
      { value: 'drinks', label: 'Drinks', disabled: true },
    ],
    onValueChange: fn(),
  },
  argTypes: {
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Chosen: Story = { args: { defaultValue: 'sides' } };
export const Described: Story = { args: { description: 'Where the item shows up on the list.' } };
export const Required: Story = { args: { required: true } };
export const WithError: Story = { args: { error: 'Choose a category.' } };
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: 'dark' }, args: { error: 'Choose a category.' } };

/** Opens from the keyboard and checks the highlight lands on an option, so arrows work at once. */
export const KeyboardOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('combobox', { name: 'Category' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(await screen.findByRole('option', { name: 'Mains' })).toHaveFocus();
  },
};
```

- [ ] **Step 4: Write the failing test**

Create `packages/ui/src/components/Select/Select.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Select } from './Select';
import * as stories from './Select.stories';

const { Default, Chosen, Described, Required, WithError, Disabled } = composeStories(stories);

const options = [
  { value: 'mains', label: 'Mains' },
  { value: 'sides', label: 'Sides' },
  { value: 'desserts', label: 'Desserts' },
];

describe('Select', () => {
  it.each([
    ['Default', Default],
    ['Chosen', Chosen],
    ['Described', Described],
    ['Required', Required],
    ['WithError', WithError],
    ['Disabled', Disabled],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('associates its label with the trigger even though the trigger is a button', () => {
    render(<Default />);
    expect(screen.getByLabelText('Category')).toHaveAttribute('role', 'combobox');
  });

  it('shows the placeholder until something is chosen, then the option label', () => {
    const { rerender } = render(<Default />);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Select…');
    rerender(<Chosen />);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Sides');
  });

  it('marks the trigger as a listbox owner and keeps the options out of the document until it opens', async () => {
    render(<Default />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(await screen.findByRole('option', { name: 'Mains' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('picks an option with the keyboard and reports its value', async () => {
    const onValueChange = vi.fn();
    render(
      <Select label="Category" name="category" options={options} onValueChange={onValueChange} />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const mains = await screen.findByRole('option', { name: 'Mains' });
    // The highlight lands a frame after the listbox mounts; pressing Enter before it does sends
    // the key back to the trigger, which closes the popup and selects nothing.
    await waitFor(() => expect(mains).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('sides', expect.anything()));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('jumps to an option by typing its first letters', async () => {
    render(<Select label="Category" name="category" options={options} />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('option', { name: 'Mains' });
    await userEvent.keyboard('des');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Desserts' })).toHaveFocus());
  });

  it('marks a disabled option in the accessibility tree and does not choose it', async () => {
    const onValueChange = vi.fn();
    render(
      <Select
        label="Category"
        name="category"
        options={[...options, { value: 'drinks', label: 'Drinks', disabled: true }]}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Category' }));
    const drinks = await screen.findByRole('option', { name: 'Drinks' });
    expect(drinks).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(drinks);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('sets aria-invalid on the trigger itself, because Base UI does not', () => {
    render(<WithError />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAccessibleDescription('Choose a category.');
  });

  it('leaves aria-invalid off when there is no error', () => {
    render(<Described />);
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toHaveAccessibleDescription('Where the item shows up on the list.');
  });

  it('disables the trigger and keeps it out of the tab order', () => {
    render(<Disabled />);
    expect(screen.getByRole('combobox', { name: 'Category' })).toBeDisabled();
  });

  it('marks the popup so the shared Tier 2 skin can style it', async () => {
    render(<Default />);
    await userEvent.click(screen.getByRole('combobox', { name: 'Category' }));
    const listbox = await screen.findByRole('listbox');
    // The listbox is `Select.List`; the surface that wears the skin is its parent, `Select.Popup`.
    expect(listbox.parentElement).toHaveAttribute('data-popup', 'select');
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui Select`
Expected: FAIL — `Failed to resolve import "./Select"`.

- [ ] **Step 6: Write the stylesheet**

Create `packages/ui/src/components/Select/Select.module.css`:

```css
/* Select adds only what the two shared skins cannot know: the trigger's value row, its chevron
   and the option row. The control box is `field.module.css`'s `.control`; the popup surface,
   the viewport clamp and the entry transition are `popup.module.css` under
   `data-popup='select'`. Every declaration in `.trigger` is one `.control` does not make, so
   the two class names on the same element can never tie on specificity and leave the winner to
   the consumer's bundle order. */
.trigger {
  justify-content: space-between;
  gap: var(--space-3);
  text-align: start;
  cursor: pointer;
}

.value {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.value[data-placeholder] {
  color: var(--color-text-subtle);
}

/* `data-popup-open`, not `data-open` — measured. `data-open` is what the popup carries; the
   icon carries `data-popup-open`, and a rotation written against the other one never fires. */
.icon {
  display: inline-flex;
  flex: none;
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
  transition-property: transform;
  transition-duration: var(--motion-duration-1);
  transition-timing-function: var(--motion-ease);
}

.icon[data-popup-open] {
  transform: rotate(180deg);
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: var(--size-touch);
  padding-inline: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-md);
  cursor: pointer;
  user-select: none;
}

/* Base UI's roving highlight, not `:hover`: it follows the keyboard as well as the pointer. */
.option[data-highlighted] {
  background: var(--color-surface-2);
}

.option[data-disabled] {
  cursor: not-allowed;
  opacity: 0.45;
}

.indicator {
  display: inline-flex;
  flex: none;
  width: 1rem;
  height: 1rem;
  color: var(--color-accent);
}
```

- [ ] **Step 7: Write the component**

Create `packages/ui/src/components/Select/Select.tsx`:

```tsx
import { Field as BaseField } from '@base-ui/react/field';
import { Select as BaseSelect } from '@base-ui/react/select';
import type { ReactNode } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import fieldStyles from '../../styles/field.module.css';
import popupStyles from '../../styles/popup.module.css';
import type { PopupAlign, PopupSide } from '../Popover/Popover';
import styles from './Select.module.css';

export interface SelectOption {
  /** Submitted with the form, and what `value`/`onValueChange` speak in. */
  value: string;
  /** The visible text, on the option and — once chosen — on the trigger. */
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** The visible label, and the trigger's accessible name. */
  label: string;
  options: SelectOption[];
  /** Identifies the field when a form is submitted. */
  name?: string;
  /** Sits under the trigger and joins its `aria-describedby`. */
  description?: ReactNode;
  /** The validation message. Its presence is the error state — see `Field`. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Shown on the trigger while nothing is chosen. */
  placeholder?: string;
  /**
   * `null` is a real state — a select that has been cleared — so it is in the type rather than
   * narrowed away. Use with `onValueChange` for a controlled select; `defaultValue` otherwise.
   */
  value?: string | null;
  defaultValue?: string | null;
  /** Base UI calls this as `(value, eventDetails)`; the second argument is passed through. */
  onValueChange?: (value: string | null, eventDetails: unknown) => void;
  side?: PopupSide;
  align?: PopupAlign;
  /** Gap between the trigger and the popup, in pixels. */
  sideOffset?: number;
}

export function Select({
  label,
  options,
  name,
  description,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select…',
  value,
  defaultValue,
  onValueChange,
  side = 'bottom',
  align = 'start',
  sideOffset = 6,
}: SelectProps) {
  const invalid = error !== undefined;
  return (
    <BaseField.Root className={fieldStyles.frame} name={name} disabled={disabled} invalid={invalid}>
      {/* `nativeLabel={false}` with a `<span>`: Base UI names `<Select.Trigger>` as the case
          this prop exists for. A native `<label for>` pointing at a button makes the button
          hover when the label is hovered and makes a click on the label fire it. The
          association survives — `getByLabelText` still finds the combobox. */}
      <BaseField.Label className={fieldStyles.label} nativeLabel={false} render={<span />}>
        {label}
        {required ? (
          <span className={fieldStyles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </BaseField.Label>
      {/* `items` is what makes the trigger show "Sides" rather than "sides": Base UI resolves
          the chosen value to its label through this list. The explicit `<string>` pins the
          generic, which would otherwise infer `any` from the `items` array's own signature. */}
      <BaseSelect.Root<string>
        items={options}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        required={required}
      >
        <BaseSelect.Trigger
          className={[fieldStyles.control, styles.trigger].join(' ')}
          // Measured: `Field.Root invalid` gives this button `data-invalid` and no
          // `aria-invalid`, where an `Input` in the same position gets both.
          aria-invalid={invalid ? true : undefined}
        >
          <BaseSelect.Value className={styles.value} placeholder={placeholder} />
          <BaseSelect.Icon className={styles.icon}>
            <ChevronDownIcon />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            className={popupStyles.layer}
            side={side}
            align={align}
            sideOffset={sideOffset}
            // Off, so the popup sits below its trigger and grows out of it like every other
            // anchored surface in the library. Base UI defaults it to `true`, which overlays
            // the popup on the trigger and makes `side` and `align` mean nothing.
            alignItemWithTrigger={false}
          >
            <BaseSelect.Popup className={popupStyles.surface} data-popup="select">
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    className={styles.option}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className={styles.indicator}>
                      <CheckIcon />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
      {description === undefined ? null : (
        <BaseField.Description className={fieldStyles.description}>
          {description}
        </BaseField.Description>
      )}
      {error === undefined ? null : (
        <BaseField.Error className={fieldStyles.error} match>
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}
```

`disabled` reaches the trigger through `Field.Root`, whose `disabled` takes precedence over a control's own — measured, the button comes out `disabled=""` with `tabindex="-1"` — so it is not passed to `BaseSelect.Root` a second time.

- [ ] **Step 8: Run the test to verify it passes**

Run: `./node_modules/.bin/vitest run --project ui Select`
Expected: PASS, 16 tests.

If the typeahead test fails with focus still on "Mains", the list did not have focus when the letters were typed — the `await screen.findByRole('option', …)` before it is what gives Base UI the frame it needs, and removing it is what breaks it.

- [ ] **Step 9: Append the exports to the barrel**

```ts
export { Select } from './components/Select/Select';
export type { SelectProps, SelectOption } from './components/Select/Select';
```

- [ ] **Step 10: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/icons/ChevronDownIcon.tsx packages/ui/src/icons/CheckIcon.tsx packages/ui/src/styles/popup.module.css packages/ui/src/components/Select/Select.tsx packages/ui/src/components/Select/Select.module.css packages/ui/src/components/Select/Select.stories.tsx packages/ui/src/components/Select/Select.test.tsx packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src
./node_modules/.bin/stylelint packages/ui/src/components/Select/Select.module.css packages/ui/src/styles/popup.module.css
bun run typecheck
```

- [ ] **Step 11: Write the changeset**

Create `.changeset/select.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `Select`: a labelled, described, validatable select built on Base UI's `Select`, wearing the Tier 3 field skin on its trigger and the Tier 2 popup skin on its list. Options are an array of `{ value, label, disabled? }` and values are strings, because that is what a form submits. Keyboard navigation, typeahead and collision-aware positioning come from Base UI; `aria-invalid` on the trigger does not, so this wrapper sets it.
```

- [ ] **Step 12: Commit**

```bash
git add packages/ui/src/icons/ChevronDownIcon.tsx packages/ui/src/icons/CheckIcon.tsx packages/ui/src/styles/popup.module.css packages/ui/src/components/Select packages/ui/src/index.ts .changeset/select.md
git commit -m "feat(ui): add Select on the field and popup skins"
```

---

## Task 3: `Checkbox`

**Files:**

- Create: `packages/ui/src/icons/MinusIcon.tsx`
- Create: `packages/ui/src/components/Checkbox/Checkbox.tsx`
- Create: `packages/ui/src/components/Checkbox/Checkbox.module.css`
- Create: `packages/ui/src/components/Checkbox/Checkbox.stories.tsx`
- Create: `packages/ui/src/components/Checkbox/Checkbox.test.tsx`
- Create: `.changeset/checkbox.md`
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: `fieldStyles` from Task 1 (`inlineFrame`, `optionLabel`, `required`, `description`, `error`) and `CheckIcon` from Task 2.
- Produces: `Checkbox` and `CheckboxProps`. Tasks 6, 8 and 9 use them.

**What is different about this one.** A checkbox is an **inline** field: the `<label>` wraps the control and the text on one row, rather than sitting above it. `Field.Root` is still the frame — it is what supplies the id, the `aria-describedby` and the disabled state — but the label is `fieldStyles.optionLabel`, not `fieldStyles.label`, and the frame is `fieldStyles.inlineFrame`. Measured: `Checkbox.Root` renders a `<span role="checkbox" tabindex="0" aria-checked>` plus a hidden `<input type="checkbox" aria-hidden="true" tabindex="-1">` carrying Base UI's own inline visually-hidden styles, so there is nothing for `a11y.module.css` to do here and no second focusable element to worry about. `required` becomes `aria-required="true"` on the span; `Field.Root invalid` becomes `aria-invalid="true"` on the span **and** `data-invalid` on it, which is what the stylesheet styles against.

- [ ] **Step 1: Write the minus icon**

Create `packages/ui/src/icons/MinusIcon.tsx`:

```tsx
/**
 * The bar inside an indeterminate `Checkbox`. Internal, like the library's other icons; the
 * checkbox's own `aria-checked="mixed"` carries the state, so this is decorative.
 */
export function MinusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 8h8" />
    </svg>
  );
}
```

- [ ] **Step 2: Write the stories**

Create `packages/ui/src/components/Checkbox/Checkbox.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  args: { label: 'Bring a dish', name: 'bringing', onCheckedChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { label: 'Select all items', indeterminate: true } };
export const Described: Story = {
  args: { description: 'We will list you next to the dish on the event page.' },
};
export const Required: Story = { args: { label: 'Accept the house rules', required: true } };
export const WithError: Story = {
  args: { label: 'Accept the house rules', required: true, error: 'You must accept to join.' },
};
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultChecked: true } };
```

- [ ] **Step 3: Write the failing test**

Create `packages/ui/src/components/Checkbox/Checkbox.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Checkbox } from './Checkbox';
import * as stories from './Checkbox.stories';

const { Default, Checked, Indeterminate, Described, Required, WithError, Disabled } =
  composeStories(stories);

describe('Checkbox', () => {
  it.each([
    ['Default', Default],
    ['Checked', Checked],
    ['Indeterminate', Indeterminate],
    ['Described', Described],
    ['Required', Required],
    ['WithError', WithError],
    ['Disabled', Disabled],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is named by its label, on the same row', () => {
    render(<Default />);
    expect(screen.getByRole('checkbox', { name: 'Bring a dish' })).toBeInTheDocument();
  });

  it('reports a mixed state as mixed, not as unchecked', () => {
    render(<Indeterminate />);
    expect(screen.getByRole('checkbox', { name: 'Select all items' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  });

  it('ticks with the space key and reports the new state', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Bring a dish" name="bringing" onCheckedChange={onCheckedChange} />);
    const box = screen.getByRole('checkbox', { name: 'Bring a dish' });
    box.focus();
    await userEvent.keyboard(' ');
    expect(box).toHaveAttribute('aria-checked', 'true');
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('ticks by clicking the label text, because the whole row is the label', async () => {
    render(<Default />);
    await userEvent.click(screen.getByText('Bring a dish'));
    expect(screen.getByRole('checkbox', { name: 'Bring a dish' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('marks itself required in the accessibility tree', () => {
    render(<Required />);
    expect(screen.getByRole('checkbox', { name: 'Accept the house rules' })).toHaveAttribute(
      'aria-required',
      'true',
    );
  });

  it('marks itself invalid and is described by the error', () => {
    render(<WithError />);
    const box = screen.getByRole('checkbox', { name: 'Accept the house rules' });
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAccessibleDescription('You must accept to join.');
    expect(box).toHaveAttribute('data-invalid');
  });

  it('renders no error node and marks nothing invalid when no error is given', () => {
    render(<Described />);
    const box = screen.getByRole('checkbox', { name: 'Bring a dish' });
    expect(box).not.toHaveAttribute('aria-invalid');
    expect(box).toHaveAccessibleDescription('We will list you next to the dish on the event page.');
  });

  it('refuses the keyboard and the pointer when disabled', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox label="Bring a dish" name="bringing" disabled onCheckedChange={onCheckedChange} />,
    );
    const box = screen.getByRole('checkbox', { name: 'Bring a dish' });
    expect(box).toHaveAttribute('data-disabled');
    await userEvent.click(box);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui Checkbox`
Expected: FAIL — `Failed to resolve import "./Checkbox"`.

- [ ] **Step 5: Write the stylesheet**

Create `packages/ui/src/components/Checkbox/Checkbox.module.css`:

```css
/* Checkbox adds the box and the mark inside it; the row, the label type, the description and
   the error are `field.module.css`. Base UI renders the real <input> hidden beside the box with
   inline styles of its own, so there is nothing here that hides anything. */
.box {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-input);
  color: var(--color-accent-text);
  cursor: pointer;
  transition-property: background-color, border-color;
  transition-duration: var(--motion-duration-1);
  transition-timing-function: var(--motion-ease);
}

.box[data-checked],
.box[data-indeterminate] {
  border-color: var(--color-accent);
  background: var(--color-accent);
}

.box[data-invalid] {
  border-color: var(--color-danger-border);
}

.box[data-disabled] {
  cursor: not-allowed;
  opacity: 0.55;
}

.indicator {
  display: inline-flex;
  width: 0.875rem;
  height: 0.875rem;
}
```

- [ ] **Step 6: Write the component**

Create `packages/ui/src/components/Checkbox/Checkbox.tsx`:

```tsx
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Field as BaseField } from '@base-ui/react/field';
import type { ReactNode } from 'react';
import { CheckIcon } from '../../icons/CheckIcon';
import { MinusIcon } from '../../icons/MinusIcon';
import fieldStyles from '../../styles/field.module.css';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  /** The text beside the box, and the checkbox's accessible name. */
  label: string;
  /** Identifies the field when a form is submitted. */
  name?: string;
  /** Sits under the row and joins the checkbox's `aria-describedby`. */
  description?: ReactNode;
  /** The validation message. Its presence is the error state — see `Field`. */
  error?: string;
  /** Controlled. Pair it with `onCheckedChange`; use `defaultChecked` for an uncontrolled box. */
  checked?: boolean;
  defaultChecked?: boolean;
  /**
   * Neither ticked nor unticked: `aria-checked="mixed"`, and a bar instead of a tick. The
   * "select all" state above a list of boxes.
   */
  indeterminate?: boolean;
  /** Base UI calls this as `(checked, eventDetails)`; the second argument is passed through. */
  onCheckedChange?: (checked: boolean, eventDetails: unknown) => void;
  required?: boolean;
  disabled?: boolean;
}

export function Checkbox({
  label,
  name,
  description,
  error,
  checked,
  defaultChecked,
  indeterminate = false,
  onCheckedChange,
  required = false,
  disabled = false,
}: CheckboxProps) {
  return (
    <BaseField.Root
      className={fieldStyles.inlineFrame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      {/* The label wraps the control and the text: that is the whole difference between this
          frame and `Field`'s, and it is why a checkbox is not composed inside `Field`. */}
      <BaseField.Label className={fieldStyles.optionLabel}>
        <BaseCheckbox.Root
          className={styles.box}
          checked={checked}
          defaultChecked={defaultChecked}
          indeterminate={indeterminate}
          onCheckedChange={onCheckedChange}
          required={required}
        >
          <BaseCheckbox.Indicator className={styles.indicator}>
            {indeterminate ? <MinusIcon /> : <CheckIcon />}
          </BaseCheckbox.Indicator>
        </BaseCheckbox.Root>
        {label}
      </BaseField.Label>
      {description === undefined ? null : (
        <BaseField.Description className={fieldStyles.description}>
          {description}
        </BaseField.Description>
      )}
      {error === undefined ? null : (
        <BaseField.Error className={fieldStyles.error} match>
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `./node_modules/.bin/vitest run --project ui Checkbox`
Expected: PASS, 15 tests.

- [ ] **Step 8: Append the exports to the barrel**

```ts
export { Checkbox } from './components/Checkbox/Checkbox';
export type { CheckboxProps } from './components/Checkbox/Checkbox';
```

- [ ] **Step 9: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/icons/MinusIcon.tsx packages/ui/src/components/Checkbox/Checkbox.tsx packages/ui/src/components/Checkbox/Checkbox.module.css packages/ui/src/components/Checkbox/Checkbox.stories.tsx packages/ui/src/components/Checkbox/Checkbox.test.tsx packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src
./node_modules/.bin/stylelint packages/ui/src/components/Checkbox/Checkbox.module.css
bun run typecheck
```

- [ ] **Step 10: Write the changeset**

Create `.changeset/checkbox.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `Checkbox`: an inline field whose label wraps the box and the text on one row, with a mixed (`aria-checked="mixed"`) state for the "select all" case, a required marking, and the same `description`/`error` props as the rest of Tier 3.
```

- [ ] **Step 11: Commit**

```bash
git add packages/ui/src/icons/MinusIcon.tsx packages/ui/src/components/Checkbox packages/ui/src/index.ts .changeset/checkbox.md
git commit -m "feat(ui): add Checkbox"
```

---

## Task 4: `RadioGroup`

**Files:**

- Create: `packages/ui/src/components/RadioGroup/RadioGroup.tsx`
- Create: `packages/ui/src/components/RadioGroup/RadioGroup.module.css`
- Create: `packages/ui/src/components/RadioGroup/RadioGroup.stories.tsx`
- Create: `packages/ui/src/components/RadioGroup/RadioGroup.test.tsx`
- Create: `.changeset/radio-group.md`
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: `fieldStyles` from Task 1 (`frame`, `legend`, `required`, `options`, `optionLabel`, `description`, `error`).
- Produces: `RadioGroup`, `RadioGroupProps` and `RadioOption` (`{ value: string; label: string; disabled?: boolean }`). Tasks 8 and 9 use them.

**This is the task the probes exist for, and the naive version is wrong in a way that passes axe.** Measured, twice: a `RadioGroup` inside a `Field.Root` that carries a `Field.Label` — whether that label renders a `<label>` or, with `nativeLabel={false}`, a `<span>` — gives **every** `Radio.Root` an `aria-labelledby` pointing at the group's label and gives every option's wrapping `<label>` and hidden `<input>` the same `id`, because `Field.Root` owns exactly one control id. Both radios then answer to `getByRole('radio', { name: 'Public' })`, a screen reader reads both as "Visibility", and `axeDocument()` reports nothing.

Two things fix it together, and both are in the implementation below:

1. **The group's name is a plain `<span id>`** that the `RadioGroup` points at with `aria-labelledby`, not a `Field.Label`. An explicit `aria-labelledby` on the group survives Base UI's prop merge — measured.
2. **Each option is wrapped in `Field.Item`**, which scopes a control id per option. Base UI's own description of the part is "Groups individual items in a checkbox group or radio group with a label and description." Measured with it in place: each radio has its own `id`, its own `<label for>` and its own name; `getAllByRole('radio', { name: 'Public' })` has length 1; `ArrowUp` from the second radio checks the first; clicking the option text selects it; the group's `aria-describedby` still carries the description.

- [ ] **Step 1: Write the stories**

Create `packages/ui/src/components/RadioGroup/RadioGroup.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { RadioGroup } from './RadioGroup';

const meta = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
  args: {
    label: 'Who can see this event',
    name: 'visibility',
    defaultValue: 'link',
    options: [
      { value: 'public', label: 'Anyone with the address' },
      { value: 'link', label: 'Anyone with the link' },
      { value: 'invited', label: 'Invited people only' },
      { value: 'archived', label: 'Nobody — archived', disabled: true },
    ],
    onValueChange: fn(),
  },
  argTypes: { orientation: { control: 'radio', options: ['vertical', 'horizontal'] } },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Horizontal: Story = {
  args: {
    label: 'Portion size',
    name: 'portion',
    orientation: 'horizontal',
    defaultValue: 'medium',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  },
};
export const Described: Story = {
  args: { description: 'You can change this at any time from the event page.' },
};
export const Required: Story = { args: { required: true, defaultValue: undefined } };
export const WithError: Story = {
  args: { required: true, defaultValue: undefined, error: 'Choose who can see the event.' },
};
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: 'dark' } };
```

- [ ] **Step 2: Write the failing test**

Create `packages/ui/src/components/RadioGroup/RadioGroup.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { RadioGroup } from './RadioGroup';
import * as stories from './RadioGroup.stories';

const { Default, Horizontal, Described, Required, WithError, Disabled } = composeStories(stories);

const options = [
  { value: 'public', label: 'Anyone with the address' },
  { value: 'link', label: 'Anyone with the link' },
  { value: 'invited', label: 'Invited people only' },
];

describe('RadioGroup', () => {
  it.each([
    ['Default', Default],
    ['Horizontal', Horizontal],
    ['Described', Described],
    ['Required', Required],
    ['WithError', WithError],
    ['Disabled', Disabled],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('names the group, and names each radio after its own option', () => {
    render(<Default />);
    expect(screen.getByRole('radiogroup', { name: 'Who can see this event' })).toBeInTheDocument();
    // Exactly one each. The composition this replaces named every radio after the group, so
    // all four answered to the first option's name and this length was 4.
    expect(screen.getAllByRole('radio', { name: 'Anyone with the address' })).toHaveLength(1);
    expect(screen.getAllByRole('radio', { name: 'Invited people only' })).toHaveLength(1);
  });

  it('moves the selection with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        label="Who can see this event"
        name="visibility"
        options={options}
        defaultValue="link"
        onValueChange={onValueChange}
      />,
    );
    const chosen = screen.getByRole('radio', { name: 'Anyone with the link' });
    chosen.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Invited people only' })).toBeChecked(),
    );
    expect(onValueChange).toHaveBeenLastCalledWith('invited', expect.anything());
  });

  it('selects by clicking the option text, because each option is its own label', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        label="Who can see this event"
        name="visibility"
        options={options}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByText('Invited people only'));
    expect(onValueChange).toHaveBeenCalledWith('invited', expect.anything());
  });

  it('puts one tab stop on the group, not one per radio', async () => {
    render(<Default />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Anyone with the link' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Anyone with the address' })).not.toHaveFocus();
  });

  it('marks a disabled option and does not select it', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        label="Who can see this event"
        name="visibility"
        options={[...options, { value: 'archived', label: 'Nobody — archived', disabled: true }]}
        onValueChange={onValueChange}
      />,
    );
    const archived = screen.getByRole('radio', { name: 'Nobody — archived' });
    expect(archived).toBeDisabled();
    await userEvent.click(archived);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('describes the group with its description, and with the error when there is one', () => {
    const { rerender } = render(<Described />);
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(
      'You can change this at any time from the event page.',
    );
    rerender(<WithError />);
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(
      'Choose who can see the event.',
    );
  });

  it('renders no error node when no error is given', () => {
    render(<Described />);
    expect(screen.queryByText('Choose who can see the event.')).not.toBeInTheDocument();
  });

  it('lays the options out along the axis it is told to', () => {
    render(<Horizontal />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-orientation', 'horizontal');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui RadioGroup`
Expected: FAIL — `Failed to resolve import "./RadioGroup"`.

- [ ] **Step 4: Write the stylesheet**

Create `packages/ui/src/components/RadioGroup/RadioGroup.module.css`:

```css
/* RadioGroup adds the dot and its mark. The group's name, the option row, the option list's
   direction, the description and the error are all `field.module.css`. */
.dot {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: var(--color-surface-input);
  cursor: pointer;
  transition-property: background-color, border-color;
  transition-duration: var(--motion-duration-1);
  transition-timing-function: var(--motion-ease);
}

.dot[data-checked] {
  border-color: var(--color-accent);
  background: var(--color-accent);
}

/* Inferred rather than measured: `RadioRootState extends FieldRootState`, which is the same
   shape that puts `data-invalid` on a `Checkbox.Root` under an invalid field — that one was
   measured. If this rule proves dead, the error message below the group is still the signal,
   and nothing else depends on it. */
.dot[data-invalid] {
  border-color: var(--color-danger-border);
}

.dot[data-disabled] {
  cursor: not-allowed;
  opacity: 0.55;
}

.mark {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-full);
  background: var(--color-accent-text);
}
```

- [ ] **Step 5: Write the component**

Create `packages/ui/src/components/RadioGroup/RadioGroup.tsx`:

```tsx
import { Field as BaseField } from '@base-ui/react/field';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { useId, type ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';
import styles from './RadioGroup.module.css';

export interface RadioOption {
  /** Submitted with the form, and what `value`/`onValueChange` speak in. */
  value: string;
  /** The visible text, and that one radio's accessible name. */
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Names the group. Rendered as a plain element, not a `<label>` — see the note below. */
  label: string;
  options: RadioOption[];
  /** Identifies the field when a form is submitted. */
  name?: string;
  /** Sits under the options and joins the group's `aria-describedby`. */
  description?: ReactNode;
  /** The validation message. Its presence is the error state — see `Field`. */
  error?: string;
  /** Controlled. Pair it with `onValueChange`; use `defaultValue` for an uncontrolled group. */
  value?: string;
  defaultValue?: string;
  /** Base UI calls this as `(value, eventDetails)`; the second argument is passed through. */
  onValueChange?: (value: string, eventDetails: unknown) => void;
  required?: boolean;
  disabled?: boolean;
  /** `horizontal` wraps the options along a row; the arrow keys work on both axes either way. */
  orientation?: 'vertical' | 'horizontal';
}

export function RadioGroup({
  label,
  options,
  name,
  description,
  error,
  value,
  defaultValue,
  onValueChange,
  required = false,
  disabled = false,
  orientation = 'vertical',
}: RadioGroupProps) {
  const labelId = useId();
  return (
    <BaseField.Root
      className={fieldStyles.frame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      {/* Deliberately NOT a `Field.Label`. Measured: a `Field.Label` anywhere in this frame —
          native or rendered as a span — gives every `Radio.Root` an `aria-labelledby` pointing
          at it and gives every option the one control id `Field.Root` owns, so every radio ends
          up named after the group and sharing an id with its siblings. A plain element the
          group points at with `aria-labelledby` keeps the group named and leaves each option's
          own name alone. */}
      <span className={fieldStyles.legend} id={labelId}>
        {label}
        {required ? (
          <span className={fieldStyles.required} aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      <BaseRadioGroup<string>
        className={fieldStyles.options}
        data-orientation={orientation}
        aria-labelledby={labelId}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        required={required}
      >
        {options.map((option) => (
          // `Field.Item` is what scopes a control id per option. Without it every option's
          // label and hidden input share one id — the other half of the measurement above.
          <BaseField.Item key={option.value} disabled={option.disabled}>
            <BaseField.Label className={fieldStyles.optionLabel}>
              <BaseRadio.Root className={styles.dot} value={option.value}>
                <BaseRadio.Indicator className={styles.mark} />
              </BaseRadio.Root>
              {option.label}
            </BaseField.Label>
          </BaseField.Item>
        ))}
      </BaseRadioGroup>
      {description === undefined ? null : (
        <BaseField.Description className={fieldStyles.description}>
          {description}
        </BaseField.Description>
      )}
      {error === undefined ? null : (
        <BaseField.Error className={fieldStyles.error} match>
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `./node_modules/.bin/vitest run --project ui RadioGroup`
Expected: PASS, 14 tests.

If `getAllByRole('radio', { name: 'Anyone with the address' })` comes back with more than one element, the `Field.Item` wrapper was dropped or a `Field.Label` was reintroduced around the group's name. That is the failure this task is built to prevent, and the fix is never the assertion.

- [ ] **Step 7: Append the exports to the barrel**

```ts
export { RadioGroup } from './components/RadioGroup/RadioGroup';
export type { RadioGroupProps, RadioOption } from './components/RadioGroup/RadioGroup';
```

- [ ] **Step 8: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/components/RadioGroup/RadioGroup.tsx packages/ui/src/components/RadioGroup/RadioGroup.module.css packages/ui/src/components/RadioGroup/RadioGroup.stories.tsx packages/ui/src/components/RadioGroup/RadioGroup.test.tsx packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src
./node_modules/.bin/stylelint packages/ui/src/components/RadioGroup/RadioGroup.module.css
bun run typecheck
```

- [ ] **Step 9: Write the changeset**

Create `.changeset/radio-group.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `RadioGroup`: a named group of radio options with arrow-key navigation, a vertical or horizontal layout, and the tier's `description`/`error` props. The group's name is a plain element the group points at rather than a `<label>`, and each option is scoped by a `Field.Item` — without both, Base UI names every radio after the group and gives them one shared id.
```

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/RadioGroup packages/ui/src/index.ts .changeset/radio-group.md
git commit -m "feat(ui): add RadioGroup"
```

---

## Task 5: `Switch`

**Files:**

- Create: `packages/ui/src/components/Switch/Switch.tsx`
- Create: `packages/ui/src/components/Switch/Switch.module.css`
- Create: `packages/ui/src/components/Switch/Switch.stories.tsx`
- Create: `packages/ui/src/components/Switch/Switch.test.tsx`
- Create: `.changeset/switch.md`
- Modify: `packages/ui/src/index.ts` (append)

**Interfaces:**

- Consumes: `fieldStyles` from Task 1 (`inlineFrame`, `optionLabel`, `description`, `error`).
- Produces: `Switch` and `SwitchProps`. Tasks 8 and 9 use them.

**Anatomy and keyboard, both measured.** `Switch.Root` renders `<span role="switch" tabindex="0" aria-checked>` plus the same hidden input a checkbox has. **Space toggles it and Enter toggles it** — both, which is exactly what spec §9's keyboard floor asks a wrapper to prove rather than assume.

**It takes `error` and draws nothing for it.** The prop is here for symmetry across the tier — a required toggle ("accept the rules") is a real case and a caller should not have to reach for a different component to show its message. The track itself carries no error styling: a switch's state is binary and visible, so the message below it is the signal. That is a deliberate omission, not an oversight, and it is why there is no `.track[data-invalid]` rule below.

- [ ] **Step 1: Write the stories**

Create `packages/ui/src/components/Switch/Switch.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Switch } from './Switch';

const meta = {
  title: 'Forms/Switch',
  component: Switch,
  args: { label: 'Email me when someone joins', name: 'notify', onCheckedChange: fn() },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Described: Story = {
  args: { description: 'One message per event, never a digest.' },
};
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
export const WithError: Story = { args: { required: true, error: 'Turn this on to continue.' } };
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultChecked: true } };
```

- [ ] **Step 2: Write the failing test**

Create `packages/ui/src/components/Switch/Switch.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Switch } from './Switch';
import * as stories from './Switch.stories';

const { Default, On, Described, Disabled, WithError } = composeStories(stories);

describe('Switch', () => {
  it.each([
    ['Default', Default],
    ['On', On],
    ['Described', Described],
    ['Disabled', Disabled],
    ['WithError', WithError],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('is a switch, named by its label', () => {
    render(<Default />);
    const toggle = screen.getByRole('switch', { name: 'Email me when someone joins' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles with space and with enter', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Notify me" name="notify" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Notify me' });
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
  });

  it('toggles by clicking the label text, because the whole row is the label', async () => {
    render(<Default />);
    await userEvent.click(screen.getByText('Email me when someone joins'));
    expect(screen.getByRole('switch', { name: 'Email me when someone joins' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('is described by its description', () => {
    render(<Described />);
    expect(
      screen.getByRole('switch', { name: 'Email me when someone joins' }),
    ).toHaveAccessibleDescription('One message per event, never a digest.');
  });

  it('shows the error message and describes the switch with it', () => {
    render(<WithError />);
    expect(
      screen.getByRole('switch', { name: 'Email me when someone joins' }),
    ).toHaveAccessibleDescription('Turn this on to continue.');
  });

  it('renders no error node when no error is given', () => {
    render(<Described />);
    expect(screen.queryByText('Turn this on to continue.')).not.toBeInTheDocument();
  });

  it('refuses the pointer when disabled and says so, so the skin can dim it', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Notify me" name="notify" disabled onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Notify me' });
    expect(toggle).toHaveAttribute('data-disabled');
    await userEvent.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `./node_modules/.bin/vitest run --project ui Switch`
Expected: FAIL — `Failed to resolve import "./Switch"`.

- [ ] **Step 4: Write the stylesheet**

Create `packages/ui/src/components/Switch/Switch.module.css`:

```css
/* Switch adds the track and the thumb; the row, the label type, the description and the error
   are `field.module.css`. There is deliberately no `[data-invalid]` rule — a switch's state is
   binary and visible, so the message below it is the error signal. */
.track {
  display: inline-flex;
  flex: none;
  align-items: center;
  width: 2.5rem;
  height: 1.5rem;
  padding: var(--space-1);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: var(--color-surface-3);
  cursor: pointer;
  transition-property: background-color, border-color;
  transition-duration: var(--motion-duration-1);
  transition-timing-function: var(--motion-ease);
}

.track[data-checked] {
  border-color: var(--color-accent);
  background: var(--color-accent);
}

.track[data-disabled] {
  cursor: not-allowed;
  opacity: 0.55;
}

.thumb {
  width: 1rem;
  height: 1rem;
  border-radius: var(--radius-full);
  background: var(--color-surface-raised);
  box-shadow: var(--elevation-1);
  transition-property: transform;
  transition-duration: var(--motion-duration-1);
  transition-timing-function: var(--motion-ease);
}

/* The travel is the track's inner width minus the thumb: 2.5rem − 2×1px border − 2×space-1
   padding − 1rem thumb. base.css collapses the transition under prefers-reduced-motion. */
.thumb[data-checked] {
  transform: translateX(0.875rem);
}
```

- [ ] **Step 5: Write the component**

Create `packages/ui/src/components/Switch/Switch.tsx`:

```tsx
import { Field as BaseField } from '@base-ui/react/field';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { ReactNode } from 'react';
import fieldStyles from '../../styles/field.module.css';
import styles from './Switch.module.css';

export interface SwitchProps {
  /** The text beside the track, and the switch's accessible name. */
  label: string;
  /** Identifies the field when a form is submitted. */
  name?: string;
  /** Sits under the row and joins the switch's `aria-describedby`. */
  description?: ReactNode;
  /**
   * The validation message. It is rendered and announced; the track itself is not restyled,
   * because a switch's state is binary and already visible.
   */
  error?: string;
  /** Controlled. Pair it with `onCheckedChange`; use `defaultChecked` for an uncontrolled one. */
  checked?: boolean;
  defaultChecked?: boolean;
  /** Base UI calls this as `(checked, eventDetails)`; the second argument is passed through. */
  onCheckedChange?: (checked: boolean, eventDetails: unknown) => void;
  required?: boolean;
  disabled?: boolean;
}

export function Switch({
  label,
  name,
  description,
  error,
  checked,
  defaultChecked,
  onCheckedChange,
  required = false,
  disabled = false,
}: SwitchProps) {
  return (
    <BaseField.Root
      className={fieldStyles.inlineFrame}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      <BaseField.Label className={fieldStyles.optionLabel}>
        <BaseSwitch.Root
          className={styles.track}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          required={required}
        >
          <BaseSwitch.Thumb className={styles.thumb} />
        </BaseSwitch.Root>
        {label}
      </BaseField.Label>
      {description === undefined ? null : (
        <BaseField.Description className={fieldStyles.description}>
          {description}
        </BaseField.Description>
      )}
      {error === undefined ? null : (
        <BaseField.Error className={fieldStyles.error} match>
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `./node_modules/.bin/vitest run --project ui Switch`
Expected: PASS, 12 tests.

- [ ] **Step 7: Append the exports to the barrel**

```ts
export { Switch } from './components/Switch/Switch';
export type { SwitchProps } from './components/Switch/Switch';
```

- [ ] **Step 8: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/components/Switch/Switch.tsx packages/ui/src/components/Switch/Switch.module.css packages/ui/src/components/Switch/Switch.stories.tsx packages/ui/src/components/Switch/Switch.test.tsx packages/ui/src/index.ts
./node_modules/.bin/eslint packages/ui/src
./node_modules/.bin/stylelint packages/ui/src/components/Switch/Switch.module.css
bun run typecheck
```

- [ ] **Step 9: Write the changeset**

Create `.changeset/switch.md`:

```markdown
---
'@calcifer-design/ui': minor
---

Add `Switch`: an inline on/off field with `role="switch"`, toggled by space and by enter, with the tier's `description` and `error` props. Tier 3 is complete with it — `Field`, `TextInput`, `Select`, `Checkbox`, `RadioGroup` and `Switch`.
```

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/components/Switch packages/ui/src/index.ts .changeset/switch.md
git commit -m "feat(ui): add Switch"
```

---

## Task 6: One whole form, and the TanStack Form adapter proved without the dependency

**Files:**

- Create: `packages/ui/src/components/Field/FormExample.stories.tsx`
- Create: `packages/ui/src/components/Field/FormExample.test.tsx`
- Create: `.changeset/form-example.md`

**Interfaces:**

- Consumes: `Field`, `TextInput`, `Select`, `Checkbox`, `RadioGroup`, `Switch` and `Button` — every component of the tier plus one from the library's oldest.
- Produces: nothing exported. Both files match the Rslib entry glob's exclusions (`!./src/**/*.test.{ts,tsx}`, `!./src/**/*.stories.{ts,tsx}`), so neither reaches `dist`, and nothing here is part of the published surface.

**Why this is its own task.** Two claims in this plan are only true if something exercises them together. The first is spec §6.3's "components in composition … a real form, rather than one isolated control per row" — six components that each pass their own test can still be six different-looking things on one page. The second is the claim that decided the whole API: that a TanStack Form field adapter is **trivial**, because `error` is a string prop and the control reports its value directly. An adapter that turned out to need thirty lines would mean Decision 7 was wrong, and this is the task that would find out.

**No dependency is added.** `@tanstack/react-form` is not installed, not a peer dependency and not imported. The story declares the _shape_ TanStack Form's `<form.Field>` render prop hands its child — `{ name, state: { value, meta: { errors, isTouched } }, handleChange, handleBlur }` — and a twenty-line `useExampleForm` hook that produces objects of that shape. If the real library's shape ever drifts, the adapter here is a structural type and the consuming app's compiler is what notices; this file's job is to prove the wiring exists, not to track a version.

- [ ] **Step 1: Write the story**

Create `packages/ui/src/components/Field/FormExample.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { RadioGroup } from '../RadioGroup/RadioGroup';
import { Select } from '../Select/Select';
import { Switch } from '../Switch/Switch';
import { TextInput } from '../TextInput/TextInput';
import { Field } from './Field';

/**
 * The shape TanStack Form's `<form.Field>` render prop hands its child. Declared here rather
 * than imported: `@calcifer-design/ui` takes no dependency on a form library, and this is a
 * structural type, so the real `FieldApi` satisfies it without either side knowing.
 */
interface FormFieldApi<Value> {
  name: string;
  state: { value: Value; meta: { errors: string[]; isTouched: boolean } };
  handleChange: (value: Value) => void;
  handleBlur: () => void;
}

/**
 * The adapter, in full. This is the claim Decision 7 rests on: because `error` is a string and
 * the controls report their value directly, connecting a form library to a Tier 3 field is a
 * projection with no state of its own.
 *
 * An error is shown only once the field has been touched, which is a form-library convention
 * rather than a library one — `Field` shows whatever `error` it is given.
 */
function adaptFormField<Value>(fieldApi: FormFieldApi<Value>) {
  const firstError = fieldApi.state.meta.isTouched ? fieldApi.state.meta.errors[0] : undefined;
  return {
    fieldProps: { name: fieldApi.name, error: firstError },
    controlProps: {
      value: fieldApi.state.value,
      onValueChange: fieldApi.handleChange,
      onBlur: fieldApi.handleBlur,
    },
  };
}

type ExampleValues = {
  email: string;
  category: string;
  portion: string;
  notes: string;
  bringing: boolean;
  notify: boolean;
};

const initialValues: ExampleValues = {
  email: '',
  category: '',
  portion: 'medium',
  notes: '',
  bringing: false,
  notify: true,
};

/** Stands in for `useForm` + a Zod resolver. Twenty lines, and no dependency. */
function useExampleForm() {
  const [values, setValues] = useState<ExampleValues>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errorsFor = (name: keyof ExampleValues): string[] => {
    if (name === 'email' && !values.email.includes('@')) {
      return ['Enter an email address.'];
    }
    if (name === 'category' && values.category === '') {
      return ['Choose a category.'];
    }
    return [];
  };

  function field<Name extends keyof ExampleValues>(name: Name): FormFieldApi<ExampleValues[Name]> {
    return {
      name,
      state: {
        value: values[name],
        meta: { errors: errorsFor(name), isTouched: touched[name] === true },
      },
      handleChange: (value) => setValues((current) => ({ ...current, [name]: value })),
      handleBlur: () => setTouched((current) => ({ ...current, [name]: true })),
    };
  }

  const markAllTouched = () =>
    setTouched(Object.fromEntries(Object.keys(initialValues).map((name) => [name, true])));

  return {
    values,
    field,
    markAllTouched,
    hasErrors: () => errorsFor('email').length + errorsFor('category').length > 0,
  };
}

interface ExampleFormProps {
  /** Called with the collected values when the form validates. */
  onSubmitValues?: (values: ExampleValues) => void;
}

function ExampleForm({ onSubmitValues }: ExampleFormProps) {
  const form = useExampleForm();
  const email = adaptFormField(form.field('email'));
  const category = adaptFormField(form.field('category'));
  const portion = adaptFormField(form.field('portion'));
  const notes = adaptFormField(form.field('notes'));

  return (
    // `noValidate`, because `required` on a control also arms the browser's own validation
    // bubble and the form library owns validation here. Every form driven by a form library
    // wants this, which is why `Field`'s `required` prop documents it.
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.markAllTouched();
        if (!form.hasErrors()) {
          onSubmitValues?.(form.values);
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '28rem' }}
    >
      <Field label="Email" required {...email.fieldProps}>
        <TextInput type="email" placeholder="you@example.com" {...email.controlProps} />
      </Field>

      <Select
        label="Category"
        required
        placeholder="Pick one"
        options={[
          { value: 'mains', label: 'Mains' },
          { value: 'sides', label: 'Sides' },
          { value: 'desserts', label: 'Desserts' },
        ]}
        {...category.fieldProps}
        value={category.controlProps.value}
        onValueChange={(value) => form.field('category').handleChange(value ?? '')}
      />

      <RadioGroup
        label="Portion size"
        orientation="horizontal"
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
        {...portion.fieldProps}
        value={portion.controlProps.value}
        onValueChange={(value) => form.field('portion').handleChange(value)}
      />

      <Field label="Notes" {...notes.fieldProps}>
        <TextInput render={<textarea rows={3} />} {...notes.controlProps} />
      </Field>

      <Checkbox
        label="I am bringing a dish"
        name="bringing"
        checked={form.values.bringing}
        onCheckedChange={(checked) => form.field('bringing').handleChange(checked)}
      />

      <Switch
        label="Email me when someone joins"
        name="notify"
        description="One message per event, never a digest."
        checked={form.values.notify}
        onCheckedChange={(checked) => form.field('notify').handleChange(checked)}
      />

      <Button type="submit">Save</Button>
    </form>
  );
}

const meta = {
  title: 'Forms/A whole form',
  component: ExampleForm,
  args: { onSubmitValues: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ExampleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dark: Story = { globals: { theme: 'dark' } };
```

The inline `style` on the `<form>` is the one place in the library that uses one, and it is deliberate: this is a story, not a component, and inventing a stylesheet for an example that never ships would put a class name in `dist` for no consumer.

- [ ] **Step 2: Write the failing test**

Create `packages/ui/src/components/Field/FormExample.test.tsx`:

```tsx
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import * as stories from './FormExample.stories';

const { Default } = composeStories(stories);

describe('a whole Tier 3 form', () => {
  it('has no axe violations', async () => {
    render(<Default />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('puts every Tier 3 component on one form', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Portion size' })).toBeInTheDocument();
    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
    expect(screen.getByRole('checkbox', { name: 'I am bringing a dish' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Email me when someone joins' })).toBeInTheDocument();
  });

  it('shows nothing as invalid before the field has been touched', () => {
    render(<Default />);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Enter an email address.')).not.toBeInTheDocument();
  });

  it('surfaces the adapter error on the field once the form is submitted', async () => {
    const onSubmitValues = vi.fn();
    render(<Default onSubmitValues={onSubmitValues} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const email = screen.getByLabelText('Email');
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    expect(email).toHaveAccessibleDescription('Enter an email address.');
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(onSubmitValues).not.toHaveBeenCalled();
  });

  it('clears the error as the value becomes valid, with no work from the caller', async () => {
    render(<Default />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const email = screen.getByLabelText('Email');
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    await userEvent.type(email, 'sebastian@example.com');
    await waitFor(() => expect(email).not.toHaveAttribute('aria-invalid'));
  });

  it('collects every control into one value object when the form validates', async () => {
    const onSubmitValues = vi.fn();
    render(<Default onSubmitValues={onSubmitValues} />);
    await userEvent.type(screen.getByLabelText('Email'), 'sebastian@example.com');
    await userEvent.click(screen.getByRole('combobox', { name: 'Category' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Sides' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Large' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'I am bringing a dish' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Email me when someone joins' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onSubmitValues).toHaveBeenCalledWith({
        email: 'sebastian@example.com',
        category: 'sides',
        portion: 'large',
        notes: '',
        bringing: true,
        notify: false,
      }),
    );
  });
});
```

- [ ] **Step 3: Run the test to verify it fails, then passes**

```bash
./node_modules/.bin/vitest run --project ui FormExample
```

Expected on the first run, before Step 1's file exists: FAIL, `Failed to resolve import "./FormExample.stories"`. With both files in place: PASS, 6 tests.

This is the one task in the plan where the test is written **after** the thing it tests, and the reason is worth stating: the story _is_ the implementation here, there is no production code to drive out, and a failing test against a story that does not exist teaches nothing. If the last test fails on the `category` value, the `Select`'s `onValueChange` is reporting `null` rather than `''` — which is the `string | null` of Decision 5 doing exactly what it is documented to do, and the `?? ''` in the story is where it is handled.

- [ ] **Step 4: Lint, format and typecheck**

```bash
./node_modules/.bin/prettier --write packages/ui/src/components/Field/FormExample.stories.tsx packages/ui/src/components/Field/FormExample.test.tsx
./node_modules/.bin/eslint packages/ui/src
bun run typecheck
```

- [ ] **Step 5: Write the changeset**

Create `.changeset/form-example.md`:

```markdown
---
'@calcifer-design/ui': patch
---

Add a Storybook example that composes all six Tier 3 components into one form, with the field adapter a form library such as TanStack Form needs — about ten lines, because `error` is a string prop and every control reports its value directly. The example and its test ship in the repository only; neither reaches `dist`.
```

A patch, not a minor: nothing is added to the published surface. The changeset exists because CI gates one on every touched published package and `packages/ui` is touched.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/Field/FormExample.stories.tsx packages/ui/src/components/Field/FormExample.test.tsx .changeset/form-example.md
git commit -m "docs(ui): compose the Tier 3 components into one form with a form-library adapter"
```

---

## Task 7: Tier 3 is complete — dist coverage, the README, and the whole check

**Files:**

- Modify: `packages/ui/test/dist/ui-dist.test.ts`
- Modify: `README.md:24-27`

**Interfaces:**

- Consumes: every component from Tasks 1–5, through the built `dist/index.js`, and `field.module.css` from Task 1.
- Produces: nothing new.

This task proves the tier survives the Rslib build and reaches the published entry point. The barrel exporting the components is not the same claim: the build is bundleless, each component becomes its own module, and the new shared stylesheet becomes its own dist entry — `dist/styles/field.module.js` plus `dist/styles/field_module.css` — which the existing coverage does not look at, because it walks `dist/components` only and its shared-stylesheet list names `a11y` and `popup`.

- [ ] **Step 1: Extend the dist assertions**

In `packages/ui/test/dist/ui-dist.test.ts`, extend the export-name list in the first test so it reads:

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
  'Field',
  'TextInput',
  'Select',
  'Checkbox',
  'RadioGroup',
  'Switch',
]) {
  expect(typeof uiModule[exportName], exportName).toBe('function');
}
```

Every name there is a plain function, and this list must never gain a namespace object — which is why this tier's components are flat single functions rather than compound `Select.Root`-style exports.

Then, in the `emits each shared stylesheet once, as its own dist entry` test, change the loop's list from `['a11y', 'popup']` to:

```ts
for (const name of ['a11y', 'popup', 'field']) {
```

and append to the same test, after the existing `popupCss` assertion:

```ts
const fieldCss = await readFile(path.join(distRoot, 'styles/field_module.css'), 'utf8');
expect(fieldCss).toMatch(/\.control-[A-Za-z0-9_-]{5}\b/);
// One copy of the control box in the whole package: `TextInput`'s input and `Select`'s
// trigger wear the same emitted rule rather than each shipping its own.
const componentCss = await collectCssFiles(path.join(distRoot, 'components'));
for (const file of componentCss) {
  const css = await readFile(file, 'utf8');
  expect(css, file).not.toContain('var(--color-surface-input)');
}
```

`collectCssFiles` and `componentCss` already exist in that test; if the appended block redeclares `componentCss`, fold the new loop into the existing one rather than declaring it twice.

- [ ] **Step 2: Build and run the dist tests to verify they pass**

```bash
bun run build
bun run test:dist
```

Expected: PASS. If a name comes back `undefined`, its barrel export is missing — fix that rather than removing the name. If `styles/field_module.css` is missing, the stylesheet is not imported from any TSX module, which means a component is referencing it only from CSS.

- [ ] **Step 3: Update the README component list**

In `README.md`, the `@calcifer-design/ui` row lists the exported components. Prettier pads every cell in a markdown table to the width of the widest one, so replacing that one line leaves the header, the separator and the `@calcifer-design/tokens` row short and `prettier --check` fails. Replace **all four lines, 24 through 27**, then let prettier repad them in Step 4 — the six new names go after `createToastManager` and before `TOOLTIP_DELAY`:

```
| Package | What it is |
| --- | --- |
| `@calcifer-design/tokens` | `tokens` object, `tokensToCss`, `contrastRatio`, `breakpoint`; ships `tokens.css` |
| `@calcifer-design/ui` | `Button`, `Tabs`, `Card`, `Tag`, `StatusDot`, `SkipLink`, `LiveRegion`, `PageHeading`, `NavMenu`, `DataTable`, `Spinner`, `Skeleton`, `IconButton`, `Alert`, `Avatar`, `ErrorBoundary`, `Popover`, `Dialog`, `Menu`, `Tooltip`, `TooltipProvider`, `ToastRegion`, `createToastManager`, `Field`, `TextInput`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `TOOLTIP_DELAY`, `useMediaQuery`, `minWidth`; ships `base.css` |
```

- [ ] **Step 4: Format the files this task touched, and this plan**

```bash
./node_modules/.bin/prettier --write README.md packages/ui/test/dist/ui-dist.test.ts docs/superpowers/plans/2026-09-18-portfolio-mfe-phase-4-plan-c-tier-3-forms.md
```

`bun run lint` ends in `prettier --check .`, `.prettierignore` does not cover `docs/`, and prettier walks the working tree whether a file is tracked or not — so this plan document is checked along with everything else. It was written prettier-clean and this is a no-op; run it anyway, because Step 5 fails on it otherwise. (Plan B hit exactly this and its Task 9 records it.)

- [ ] **Step 5: Run the whole check**

Run: `bun run check`

Expected: PASS. This runs lint, typecheck, every unit test, the build, the dist tests and a full Storybook build — the same gate CI applies. The Storybook build is the slowest step; expect a few minutes. Its last lines are the three summaries, in this order:

```
✓ built in <n>s
Test Files  N passed (N)
     Tests  M passed (M)
```

followed by the Storybook build's `info => Output directory: .../storybook-static`. Any `✗` before that is a failure regardless of the exit code you think you saw.

If `bun run typecheck` reports missing `*.module.css.d.ts` declarations, run `bun run build` first: those files are generated and gitignored, and `typecheck` regenerates them as its first step.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/test/dist/ui-dist.test.ts README.md docs/superpowers/plans/2026-09-18-portfolio-mfe-phase-4-plan-c-tier-3-forms.md
git commit -m "test(ui): cover the Tier 3 components and the field stylesheet in the dist check"
```

- [ ] **Step 7: Open the pull request and merge it**

This is the whole library half of the tier: seven commits, six new components, one shared stylesheet, three internal icons, one popup variant and no token. Follow the repository's usual close-out — a whole-branch code review, a simplifier pass, `bun run check`, then merge. Spec §10 requires both the review and the simplifier pass before a tier counts as done.

- [ ] **Step 8: The release gate — stop here and wait for the user**

**This is a human gate and the only one in the plan.** Merging opens the Version Packages PR; merging _that_ stages `@calcifer-design/ui@0.4.0` on npm. CI can only stage: the trusted publisher is configured without "Allow npm publish", so a human approves the release with 2FA, and the 2FA is the **user's**, not an agent's:

```bash
npm stage approve <stage-id>
```

The machine's default registry is a work CodeArtifact instance, so every `npm` command against npmjs needs `--registry https://registry.npmjs.org` passed explicitly.

**Nothing in Tasks 8–9 can start until that approval lands.** Confirm with:

```bash
npm view --registry https://registry.npmjs.org @calcifer-design/ui version
```

Expected: `0.4.0`. `@calcifer-design/tokens` is **not** part of this release and stays at `0.2.0` — Decision 8 — so there is only one approval to wait for this time, unlike Tier 2.

---

## The cross-repository half

Tasks 8 and 9 run in `/Users/calcifer/Code/portfolio-mfe-worktrees/gamma`, on `gamma/storybook-remote`. They are ordered after Task 7's release gate for one reason and only one: `@calcifer-design/ui@0.4.0` must exist on npm before an app can install it. Nothing else about them is blocked.

They are **two** tasks rather than one because a reviewer can reasonably approve the gallery and reject the smoke, or the reverse: the first is product surface in a remote, the second is a deploy gate that runs a real browser and can hold a release back. They share a starting state and nothing else.

Neither task writes an erratum — this plan's errata are already in the spec, recorded when it was written.

---

## Task 8: Both apps take `@calcifer-design/ui@^0.4.0`, and the showcase gallery grows a form

**Files:**

- Modify: `apps/showcase/package.json`
- Modify: `apps/shell/package.json`
- Modify: `bun.lock`
- Modify: `apps/showcase/src/pages/ComponentsGallery.tsx`
- Modify: `apps/showcase/src/pages/ComponentsGallery.module.css`
- Modify: `apps/showcase/src/pages/ComponentsGallery.test.tsx`

**Interfaces:**

- Consumes: `Field`, `TextInput`, `Select`, `Checkbox`, `RadioGroup` and `Switch` from `@calcifer-design/ui@^0.4.0` (Tasks 1–5), plus the existing `Card` and `PageHeading`.
- Produces: a `Forms` section on `/projects/showcase/components`, with an `h3` reading "Forms", a labelled text field, a labelled select, a radio group, a checkbox and a switch. Task 9 asserts them from a real browser.

**Both apps move, not just the one that uses the components.** `@calcifer-design/ui` is bundled into each app rather than shared across the federation boundary, so two versions in one workspace would technically install. They would also mean the shell and the showcase remote ship two copies of `base.css`'s companion component CSS with different content hashes — the exact drift the shared-tokens story exists to prevent, and invisible until a visitor sees two different button shadows on one page. One version, in both apps, every time.

`@calcifer-design/tokens` stays at `^0.2.0` in both. Tier 3 added no token (Decision 8), and `ui@0.4.0` declares `tokens@^0.2.0`, so there is nothing to move.

- [ ] **Step 1: Confirm the starting state**

```bash
grep -n "calcifer-design/ui\|calcifer-design/tokens" apps/shell/package.json apps/showcase/package.json
ls apps/shell/src/toast/host-toast.ts
```

Expected: `"@calcifer-design/ui": "^0.3.0"` and `"@calcifer-design/tokens": "^0.2.0"` in both files, and `host-toast.ts` present. If `ui` reads `^0.2.1`, **stop** — Plan B's Tasks 11–12 have not merged and this task's starting state is wrong. Do not "fix" it by jumping straight to `^0.4.0`: Plan B's own changes to `__root.tsx`, `RemoteRoute.tsx` and the showcase's host store are what that bump belongs to.

- [ ] **Step 2: Write the failing test**

Append two cases to the `Components route` describe block in `apps/showcase/src/pages/ComponentsGallery.test.tsx`, and add `Forms` to the existing section-name loop so its array reads `['Buttons', 'Tags and status', 'Cards', 'Tabs', 'Forms']`:

```tsx
it('renders a real form, with every control labelled', async () => {
  renderRoute('/components');
  await waitFor(() =>
    expect(screen.getByRole('heading', { level: 3, name: 'Forms' })).toBeInTheDocument(),
  );
  expect(screen.getByLabelText('Your name')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Category' })).toBeInTheDocument();
  expect(screen.getByRole('radiogroup', { name: 'Portion size' })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: 'I am bringing a dish' })).toBeInTheDocument();
  expect(screen.getByRole('switch', { name: 'Email me when someone joins' })).toBeInTheDocument();
});

it('shows the error state, because a gallery that only shows the happy path shows half a component', async () => {
  renderRoute('/components');
  const nameField = await screen.findByLabelText('Your name');
  // The name starts empty, which is the error state, and typing clears it — so the gallery
  // demonstrates both without a button to press.
  expect(nameField).toHaveAttribute('aria-invalid', 'true');
  expect(nameField).toHaveAccessibleDescription('Tell us who is bringing it.');
  await userEvent.type(nameField, 'Sebastian');
  await waitFor(() => expect(nameField).not.toHaveAttribute('aria-invalid'));
});
```

The file's imports grow by one line — `import userEvent from '@testing-library/user-event';`.

The existing `renders every gallery section and passes axe` test runs `axe(container)`, which walks only what `render()` returned. The select's popup portals to `document.body` and is therefore outside it — that is fine here, because nothing in this test opens the select, and the library's own `Select.test.tsx` covers the open popup with `axeDocument()`. Task 9 is what checks the rendered page in a real browser.

- [ ] **Step 3: Run the test to verify it fails**

```bash
./node_modules/.bin/vitest run --project showcase ComponentsGallery
```

Expected: FAIL — `Unable to find an accessible element with the role "heading" and name "Forms"`.

- [ ] **Step 4: Bump both apps**

In `apps/showcase/package.json` and `apps/shell/package.json`, change one line each:

```json
    "@calcifer-design/ui": "^0.4.0",
```

Then:

```bash
bun install
grep -n '"version"' node_modules/@calcifer-design/ui/package.json
```

Expected: `"version": "0.4.0"`. If it resolves to 0.3.x, the release has not been approved — Task 7 Step 8 — and nothing below will compile.

- [ ] **Step 5: Write the gallery section**

In `apps/showcase/src/pages/ComponentsGallery.tsx`, extend the import to:

```tsx
import {
  Button,
  Card,
  Checkbox,
  Field,
  PageHeading,
  RadioGroup,
  Select,
  StatusDot,
  Switch,
  Tabs,
  Tag,
  TextInput,
} from '@calcifer-design/ui';
import { useState } from 'react';
import styles from './ComponentsGallery.module.css';
```

Add this component above `ComponentsGallery`:

```tsx
/**
 * The form is stateful because a form that cannot be typed into demonstrates a picture of a
 * form. It starts with an empty name, which is its error state, so a visitor sees the invalid
 * styling and the message without having to submit anything — and sees them clear as they type.
 */
function FormsCard() {
  const [guestName, setGuestName] = useState('');
  const [category, setCategory] = useState<string | null>('sides');
  const [portion, setPortion] = useState('medium');
  const [bringing, setBringing] = useState(true);
  const [notify, setNotify] = useState(false);

  return (
    <Card heading="Forms">
      <div className={styles.form}>
        <Field
          label="Your name"
          name="name"
          required
          error={guestName.trim() === '' ? 'Tell us who is bringing it.' : undefined}
        >
          <TextInput value={guestName} onValueChange={setGuestName} placeholder="Sebastian" />
        </Field>
        <Select
          label="Category"
          name="category"
          description="Where the dish shows up on the list."
          options={[
            { value: 'mains', label: 'Mains' },
            { value: 'sides', label: 'Sides' },
            { value: 'desserts', label: 'Desserts' },
            { value: 'drinks', label: 'Drinks', disabled: true },
          ]}
          value={category}
          onValueChange={setCategory}
        />
        <RadioGroup
          label="Portion size"
          name="portion"
          orientation="horizontal"
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
          value={portion}
          onValueChange={setPortion}
        />
        <Checkbox
          label="I am bringing a dish"
          name="bringing"
          checked={bringing}
          onCheckedChange={setBringing}
        />
        <Switch
          label="Email me when someone joins"
          name="notify"
          checked={notify}
          onCheckedChange={setNotify}
        />
      </div>
    </Card>
  );
}
```

and render it as the last child of the existing `<div className={styles.grid}>`, after the `Tabs` card:

```tsx
<FormsCard />
```

`setGuestName`, `setCategory`, `setPortion`, `setBringing` and `setNotify` are passed directly as the change handlers. Each of the library's callbacks is `(value, eventDetails)`; a `Dispatch<SetStateAction<T>>` accepts the first argument and ignores the second, and `T` is assignable to `SetStateAction<T>`, so this typechecks with no wrapper lambda.

- [ ] **Step 6: Add the form column to the stylesheet**

Append to `apps/showcase/src/pages/ComponentsGallery.module.css`:

```css
/* The gallery's other cards lay their contents out as a wrapping row; a form is a column, and
   the gap is wider than `.row`'s because each field already carries its own internal spacing. */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
./node_modules/.bin/vitest run --project showcase ComponentsGallery
```

Expected: PASS, 3 tests.

If the axe test now reports `label` or `form-field-multiple-labels`, a control has been given both a wrapper label and its own — check that nothing in `FormsCard` wraps a component in an extra `<label>`. Tier 3 components supply their own.

- [ ] **Step 8: Lint, format, typecheck and run the whole suite**

```bash
./node_modules/.bin/prettier --write apps/showcase/src/pages/ComponentsGallery.tsx apps/showcase/src/pages/ComponentsGallery.module.css apps/showcase/src/pages/ComponentsGallery.test.tsx apps/shell/package.json apps/showcase/package.json
./node_modules/.bin/eslint apps/showcase
./node_modules/.bin/stylelint apps/showcase/src/pages/ComponentsGallery.module.css
bun run typecheck
bun run test
```

Expected: every project passes. `bun run test` rather than the one project, because the version bump touches the shell as well and its prerender and route tests render the same library.

- [ ] **Step 9: Commit**

```bash
git add apps/shell/package.json apps/showcase/package.json bun.lock apps/showcase/src/pages/ComponentsGallery.tsx apps/showcase/src/pages/ComponentsGallery.module.css apps/showcase/src/pages/ComponentsGallery.test.tsx
git commit -m "feat(showcase): show the Tier 3 form components in the gallery"
```

No changeset: `@calcifer-design/shell` and `@calcifer-design/showcase` are private and versionless, and `packages/contract` — the only published package in this repository — is untouched.

---

## Task 9: The browser smoke covers the gallery's form

**Files:**

- Modify: `scripts/smoke.ts`

**Interfaces:**

- Consumes: the `Forms` section Task 8 produced.
- Produces: nothing importable. It adds three checks to the deploy gate.

**Why this is worth a task of its own.** `scripts/smoke.ts` is the gate `deploy.yml` runs against the live site before a release is kept, and it is the only place in either repository where axe runs in a **real browser with real layout and real computed colours**. `packages/ui/test/axe.ts` disables the `color-contrast` rule in so many words, because jsdom cannot resolve a custom property well enough to check it — so a form field whose placeholder, error text or disabled state fails contrast in the dark theme is invisible to every test written in Tasks 1–6. This is the check that would catch it, at both viewports, on the one route in the fleet that renders all six components.

The route is already visited: `runChecks` navigates to `/projects/showcase/components` and asserts the `Components` heading. It is not in `PAGES`, so it gets neither the overflow check nor axe today. Both are added here.

- [ ] **Step 1: Widen the route type**

`expectAxeClean` takes `pathname: SmokePage`, and `REMOTE_SUBTREES` is keyed by the same union, so the sub-route cannot be passed to it as written. In `scripts/smoke.ts`, after the `SmokePage` type alias, add:

```ts
/** A sub-route that is checked on its own rather than as one of the pages the loop walks. */
const SUB_ROUTES = ['/projects/showcase/components'] as const;
type SmokeRoute = SmokePage | (typeof SUB_ROUTES)[number];
```

and change the two annotations that need it:

```ts
const REMOTE_SUBTREES: Partial<Record<SmokeRoute, string>> = {
  '/projects/wbw': 'main .wbw',
};
```

```ts
async function expectAxeClean(page: Page, viewport: string, pathname: SmokeRoute) {
```

Nothing else changes: `SETTLED_CONTENT` stays keyed by `SmokePage`, because the sub-route's settled content is the heading the existing check already waits for.

- [ ] **Step 2: Add the three checks**

In `runChecks`, replace the existing remote sub-route block:

```ts
// Remote sub-route renders inside the shell.
await page.goto(`${baseUrl}/projects/showcase/components`);
await expectText(page, viewport.name, 'remote sub-route renders', 'main h2', 'Components');
```

with:

```ts
// Remote sub-route renders inside the shell, and it is the one route in the fleet that
// renders every Tier 3 form component — so it is where axe runs against real layout and real
// computed colours, which is the coverage the library's own jsdom tests cannot give
// (`packages/ui/test/axe.ts` disables `color-contrast` and says why).
await page.goto(`${baseUrl}/projects/showcase/components`);
await expectText(page, viewport.name, 'remote sub-route renders', 'main h2', 'Components');
await expectText(page, viewport.name, 'the gallery shows a real form', 'main h3', 'Forms');
await expectText(
  page,
  viewport.name,
  'the form field is labelled in the live DOM',
  'main label',
  'Your name',
);
await expectNoHorizontalOverflow(page, viewport.name, '/projects/showcase/components');
await expectAxeClean(page, viewport.name, '/projects/showcase/components');
```

`expectNoHorizontalOverflow` already takes its `pathname` as a plain `string`, so it needs no widening.

- [ ] **Step 3: Run the smoke**

```bash
bun run smoke
```

Expected: the build, then two viewport runs, each logging the new lines among the rest:

```
✓ [mobile] remote sub-route renders
✓ [mobile] the gallery shows a real form
✓ [mobile] the form field is labelled in the live DOM
✓ [mobile] no horizontal overflow on /projects/showcase/components
✓ [mobile] axe on /projects/showcase/components
```

and the same five for `desktop`, with the run ending in no failure summary and exit code 0.

`bun run smoke` builds first and takes several minutes. `bun run smoke:run` alone reuses the last build, which is what to use while iterating on the script itself.

**If `axe on /projects/showcase/components` reports `color-contrast`**, that is this task doing its job and it is a **library** fix, not a smoke fix: a Tier 3 token pairing does not meet contrast in one of the two themes. Do not exclude the rule, do not exclude the subtree. Take the reported nodes back to `packages/ui/src/styles/field.module.css` — `--color-text-subtle` on `--color-surface-input` for the placeholder and `--color-danger` on `--color-danger-surface` for the error text are the two pairings this tier introduces that `packages/tokens/test/contrast.test.ts` does not already assert, because that suite iterates explicit lists. Adding the pairing to those lists is the durable fix and it is a `tokens` change, which means a tokens changeset and a second release — so it is a finding to take to the user, not a step to improvise.

- [ ] **Step 4: Run the checks this repository gates on**

```bash
./node_modules/.bin/prettier --write scripts/smoke.ts
./node_modules/.bin/eslint scripts
bun run typecheck
```

Expected: clean. The typecheck is the one that matters here — `SmokeRoute` narrowing is exactly the kind of change that compiles in the editor and fails on `Partial<Record<…>>` indexing.

- [ ] **Step 5: Commit**

```bash
git add scripts/smoke.ts
git commit -m "test(smoke): check the gallery's form and run axe on the components sub-route"
```

- [ ] **Step 6: Open the pull request and merge it**

Two commits. The same close-out as the library half — a whole-branch code review, a simplifier pass, `bun run check`, then merge. Note in the PR body that `bun run check` does **not** run the smoke; `bun run smoke` is a separate command and Step 3 is the only place it runs.

**Tier 3 is done when this merges.** The whosbringingwhat revamp's precondition — "Tier 2 through Dialog, plus Tier 3, both published _and_ `npm stage approve`d" (its spec §9.3) — is met at that point, and its Login screen is unblocked.

---

## Self-Review

Run against the spec with fresh eyes after the plan was complete. Three checks, and what each found.

### 1. Spec coverage

| Spec                               | Requirement                                                                       | Where it lands                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| §2.1 Tier 3                        | `Field` and `TextInput` **together**                                              | Task 1, and the note that says why they cannot be split                            |
| §2.1 Tier 3                        | then `Select`                                                                     | Task 2                                                                             |
| §2.1 Tier 3                        | `Checkbox`                                                                        | Task 3                                                                             |
| §2.1 Tier 3                        | `RadioGroup`                                                                      | Task 4                                                                             |
| §2.1 Tier 3                        | `Switch`                                                                          | Task 5                                                                             |
| §2.1 Tier 3                        | "the library can express every form the three consuming apps need"                | Task 6, one form holding all six                                                   |
| §2.1 Tier 2                        | Popover's skin is reused by the tier                                              | Task 2, `data-popup='select'` on `popup.module.css`                                |
| §2.3                               | a native `<input type="date">` inside `Field`; no calendar                        | Task 1, `TextInputType` includes `'date'`; Decision 4 for everything else          |
| §3                                 | Base UI 1.8.0 stays; dependencies added case by case with a recorded reason       | No task adds a dependency. Task 6 declares the form-library shape structurally.    |
| §3                                 | "`Checkbox` and `RadioGroup` are native inputs"                                   | **Contradicted.** Erratum 1.                                                       |
| §5.3                               | the provider rule                                                                 | "The cross-repository half" and the File structure note: Tier 3 mounts no provider |
| §8                                 | file layout, function shape, `NameProps`, barrel, data-attribute variants         | Global Constraints, and every component task's files list                          |
| §8                                 | no single-letter identifiers                                                      | Global Constraints; no identifier in this plan is shorter than four characters     |
| §9                                 | stories, unit tests, dark-mode pass, keyboard check                               | Every component task: a `Dark` story and a keyboard test in each                   |
| §9                                 | axe                                                                               | `axeDocument()` over every story, in every component task                          |
| §9                                 | focus ring, disabled affordance, error state are the author's responsibility      | `field.module.css` `:focus-visible`/`[data-disabled]`/`[data-invalid]`, Tasks 1–5  |
| §9 (forms floor)                   | label association, `aria-describedby`, `aria-invalid`, required marking           | Task 1 tests 2–6; repeated per component in Tasks 2–5                              |
| §9 (forms floor)                   | Select keyboard navigation and typeahead                                          | Task 2, two dedicated tests                                                        |
| §9 (forms floor)                   | RadioGroup arrow keys                                                             | Task 4                                                                             |
| §9 (forms floor)                   | Switch space and enter                                                            | Task 5                                                                             |
| §9 (forms floor)                   | Checkbox indeterminate                                                            | Task 3                                                                             |
| §10 item 3                         | "Plan C — Tier 3. whosbringingwhat is unblocked at the end of this."              | Task 9 Step 6                                                                      |
| §10                                | each plan ends with a whole-branch review, a simplifier pass, a full check, merge | Task 7 Step 7 and Task 9 Step 6                                                    |
| §12, Base UI is the foundation     | no second headless library                                                        | Every component composes Base UI 1.8.0 parts                                       |
| §12, `heading`/`headingLevel`      | naming precedents, applied library-wide                                           | Global Constraints; Tier 3 adds `label`/`description`/`error` and nothing else     |
| §12, `IconButton` uses Base UI too | the count of platform-only components                                             | Erratum 1 continues the correction into Tier 3                                     |
| §6.3                               | "components in composition — a real form"                                         | Task 6; erratum 6 says what that does to Plan D's placeholder                      |

**Gaps found and closed during the review:**

- **`field.module.css` had a `.options` class with no horizontal variant**, while Task 4's `RadioGroup` wrote `data-orientation="horizontal"` and Task 4's test asserted it. The rule was added to Task 1's stylesheet. Without it the attribute would have been inert and the test would have passed anyway, which is the worst version of the bug.
- **Spec §9's "dark-mode pass" had no mechanism.** Tiers 1 and 2 relied on Storybook's toolbar, which no test and no CI step exercises. Every component task now ships a `Dark` story with `globals: { theme: 'dark' }`, and the Global Constraints say why it is excluded from `composeStories` in the unit tests. Recorded as erratum 5.
- **Spec §2.1 sizes Tier 3 at six components and says nothing about how they compose.** Decision 1 settles it and erratum 2 records it; without that, an executor reading only the spec would have written the one-`Field`-wraps-everything version the probes showed to be wrong.

### 2. Placeholder scan

Searched for `TBD`, `TODO`, `implement later`, `fill in`, `appropriate error handling`, `add validation`, `handle edge cases`, `write tests for the above`, `similar to Task`, and for any code step with prose but no code block.

- No occurrence of any of them. Every code step carries the full file or the full replacement block.
- The one step that describes rather than shows is Task 8 Step 5's "render it as the last child of the existing `<div className={styles.grid}>`" — and it is followed by the literal line to insert. Left as is: the surrounding file is 58 lines in the repository and reproducing it whole would obscure the one-line change.
- Task 7 Step 1's instruction to "fold the new loop into the existing one rather than declaring it twice" is a conditional, not a placeholder: both branches are fully specified.

### 3. Type consistency

Checked every name that crosses a task boundary.

- `fieldStyles` is the import identifier in Tasks 1–5, always from `'../../styles/field.module.css'`. Its members — `frame`, `inlineFrame`, `label`, `legend`, `required`, `optionLabel`, `options`, `description`, `error`, `control` — are declared in Task 1's stylesheet and every use in Tasks 2–5 is one of those ten. `options` is used only by Task 4; `control` only by Tasks 1 and 2; `inlineFrame` only by Tasks 3 and 5.
- `popupStyles.layer` and `popupStyles.surface` in Task 2 match the exports Plan B's Task 3 produced. `data-popup='select'` is added in Task 2 Step 1 and consumed in Task 2 Step 7, in the same task.
- `PopupSide` and `PopupAlign` are imported in Task 2 from `'../Popover/Popover'`, which is where Plan B's Task 3 exports them; verified against the shipped `packages/ui/src/index.ts`.
- `useFieldRequired` is declared in Task 1's `Field.tsx` and consumed in Task 1's `TextInput.tsx`; it appears nowhere else and is absent from every barrel snippet.
- `SelectOption` and `RadioOption` both carry `{ value: string; label: string; disabled?: boolean }`, identically. `MenuItem` in Tier 2 uses `id` rather than `value` because a menu item is an action with no value — the divergence is deliberate and the two never meet.
- Every callback in the tier is `(value, eventDetails: unknown)` or `(checked, eventDetails: unknown)`. Task 8 passes `useState` setters straight into all five of them and the plan states why that typechecks.
- The `error` prop is `string | undefined` on all six components, never `ReactNode`, because `Field.Error`'s children are announced and a node would let a caller put a control inside an error message. `description` is `ReactNode` on all six.
- `onSubmitValues` in Task 6 is declared on `ExampleFormProps` and used in Task 6's test with the same name.
- `SmokeRoute` in Task 9 is declared in Step 1 and used in Step 1's two annotations and Step 2's call; `SmokePage` keeps every use it already had.

**One inconsistency found and fixed:** Task 6's story passed `onValueChange={category.controlProps.onValueChange}` to `Select` in a first draft, where `Select`'s callback reports `string | null` and the adapter's `handleChange` takes `string`. It now goes through `(value) => form.field('category').handleChange(value ?? '')`, and the Step 3 note names that exact failure so an executor who hits it knows it is Decision 5 working rather than a bug.

---
