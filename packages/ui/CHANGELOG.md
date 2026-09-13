# @calcifer-design/ui

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
