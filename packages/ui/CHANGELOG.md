# @calcifer-design/ui

## 0.3.0

### Minor Changes

- b69d18d: Add `Dialog`: a modal surface in two variants — centred, and a sheet docked to the bottom edge or, with `side="end"`, a full-height panel on the trailing edge — on the same popup skin as `Popover`. Escape always closes it, because Base UI treats that as non-negotiable and offers no prop to turn it off; `dismissOnOutsidePress` covers the case a caller actually needs to control. Focus moves to the header's close control on open and back to the trigger on close.

  Its backdrop is `var(--color-scrim)`, new in `@calcifer-design/tokens@0.2.0`: an app that imports `tokens.css` from its own top-level dependency needs that dependency at `^0.2.0`, or the dialog opens over a fully transparent page.

- 5523c8f: Add `Menu`: a list of actions anchored to a trigger, on the same popup skin as `Popover`, with roving focus, typeahead and optional separators supplied by Base UI. `modal` defaults to `false` rather than Base UI's `true`: a menu hanging off a toolbar button has no business locking page scroll, and `NavMenu` already made the same call.
- c467959: `NavMenu`'s dropdown now uses the same popup skin as `Popover`, `Dialog`, `Menu` and `Tooltip` instead of its own copy of half of it. Its props are unchanged, so nothing about this is breaking — but it is a deliberate change to how a published component looks and behaves, which on a pre-1.0 package is a minor rather than a patch, so it does not reach a `^0.2.x` consumer with no signal at all.

  What changes: the popup's generated class name; the menu fades and scales as it opens and closes where it used to appear instantly, growing out of its trigger rather than its own centre, and collapsed to nothing under `prefers-reduced-motion` as all of this library's motion is; the dropdown now clamps to the viewport and scrolls inside itself (`max-width`/`max-height` from the positioner, with `overflow-y: auto` and `overscroll-behavior: contain`) instead of overflowing the window; `color` is set explicitly where it was inherited, with no change to the computed value; and Base UI's `[data-instant]` hook now suppresses the transition where Base UI asks it to. Item spacing is unchanged: the shared surface's `gap` is switched off for `data-popup='menu'`.

- b42bf62: Add `Popover`: an anchored dialog with a heading, an optional description and collision-aware placement. Setting `modal` also renders a visually-hidden close control, because Base UI only arms its focus trap when a close part is present inside the popup — `modal` alone traps nothing. `modal={true}` paints a scrim; `modal="trap-focus"` does not, because that mode leaves page scroll and outside clicks working and a full-viewport backdrop would swallow both. Its surface, viewport clamp and entry transition come from a shared popup skin that `Dialog`, `Menu` and `Tooltip` wear too. That skin also fixes the tier's stacking order in one place: anchored popups and dialogs both sit at `z-index: 50`, so the order their portals open is what decides which one nests above which, while toasts sit at `70` above them both — so chrome of your own given a `z-index` between the two paints above every dialog and below every toast.

  That scrim is `var(--color-scrim)`, new in `@calcifer-design/tokens@0.2.0`. An app that imports `tokens.css` from its own top-level dependency must move that dependency to `^0.2.0` as well — the range inside this package only nests a second copy nobody imports, and a missing custom property falls back to `transparent` with no error anywhere.

- dffb0c7: Add `ToastRegion` and `createToastManager`: the toast provider, portal and viewport as one component, because it is the viewport — not the provider — that renders the notifications landmark and four window-level listeners, and mounting two of those is the failure this shape makes impossible. The manager is a plain object created outside React, so a federated host can hand it to a remote through props and have it work across a separate React root, where context cannot reach. Its payload is `string` rather than `ReactNode` for the same reason: an element authored in a remote would render under the host's CSS.
- c00eaff: Add `Tooltip` and `TooltipProvider`, with the hover delay exported as `TOOLTIP_DELAY`. `label` is required and becomes both the tip's text and the trigger's `aria-label`, because Base UI's tooltip contributes nothing to the accessibility tree — no `role="tooltip"`, no `aria-describedby` — and is disabled on touch devices, so a tip nobody names is a tip some people never get. The provider renders no DOM and attaches no listeners, which is what makes it safe for a federated remote to mount its own.

### Patch Changes

- c405f8d: Share one visually-hidden class across the library instead of copying the block into each component's stylesheet. `LiveRegion`, `Alert`, `Avatar`, `Spinner`, `StatusDot` and `DataTable` all used it, and `DataTable`'s stacked header had already lost four of its nine declarations — including the negative margin that takes the 1px box out of layout. The hidden elements' generated class names change; nothing in the public API does.
- Updated dependencies [b34ca2e]
  - @calcifer-design/tokens@0.2.0

## 0.2.1

### Patch Changes

- 0149429: Fix `base.css` shipping with 122 stale bytes after its last brace. Two steps of the build wrote `dist/styles/base.css` — the bundleless compile and the explicit copy — and when the shorter write landed second it did not truncate the longer one, so 0.2.0's file ends in half a declaration and two stray braces. Browsers skip it; Vite's production minifier rejects it, which failed every Vite consumer's build. The copy is now the file's only writer and the dist tests assert it is byte-identical to the source and that every shipped stylesheet is structurally whole.

## 0.2.0

### Minor Changes

- dae50c9: Add `Alert`: a four-tone message panel with an optional heading and dismiss control. Its live-region role is opt-in through `announce` rather than automatic, because an alert that is already on the page at first paint would otherwise announce at an arbitrary moment. The tone is always in the accessibility tree as text, so colour is never the only signal.
- 42e25bc: Add `Avatar`: a Base UI avatar in three sizes and two shapes, falling back to initials derived from `name` when there is no image or the image fails to load. The full name is always in the accessibility tree; the initials are decorative.
- 70de156: Add `ErrorBoundary`: catches a render error below it and shows a recoverable fallback. Takes an `onError` callback for logging, a `fallback` render prop, and `resetKeys` so a failure clears itself when the route changes. Its default fallback is an announced danger `Alert` with a retry control.
- 09de97e: Add `IconButton`: a square sibling of `Button` for controls whose only content is an icon. `label` is required and becomes the accessible name; `loading` swaps the icon for a `Spinner`, keeps the button focusable and blocks activation.
- d1d6539: Add `Skeleton`: a content placeholder in text, block and circle variants. It is always hidden from assistive technology — the wait itself is announced by a live region, not by the placeholder.
- 7dbaa13: Add `Spinner`: an indeterminate busy indicator in three sizes. It is decorative by default and announces through a `role="status"` region only when given a `label`, so a spinner inside an already-busy control does not announce twice.

## 0.1.2

### Patch Changes

- f0369bd: Depend on `@calcifer-design/tokens` by a caret range that Changesets bumps with each release, instead of `workspace:*`, so the published manifest always names the matching tokens version.

## 0.1.1

### Patch Changes

- b18fbd1: First release staged by CI through npm trusted publishing.
- Updated dependencies [b18fbd1]
  - @calcifer-design/tokens@0.1.1

## 0.1.0

### Minor Changes

- 59a2bf4: First published release of the design tokens and the UI components (moved from portfolio-mfe).

### Patch Changes

- Updated dependencies [59a2bf4]
  - @calcifer-design/tokens@0.1.0
