# @calcifer-design/tokens

## 0.5.0

### Minor Changes

- 73de890: `uiContrastPairs` holds two more pairs to 3:1, so `checkThemeContrast` checks them for every theme: `borderControl` on `surface3`, the deepest surface a control sits on, and `danger` on `surfaceInput`, the fill an invalid checkbox or radio draws its `danger` boundary around. No value changes: the house theme clears both, `borderControl` at 3.26:1 in light and 4.82:1 in dark on `surface3`, `danger` at 4.74:1 in light and 5.93:1 in dark on `surfaceInput`. The check is stricter, so a theme's own `checkThemeContrast` test can now fail on either pair. A theme whose `surface3` sits close to the inherited `borderControl` should set its own `borderControl`: WBW's dark `surface3` (`#4A4A51`) measures 2.74:1 against the inherited `#8A909C`, and `#9298A4` clears it at 3.03:1 while keeping 3:1 on every other surface. A theme whose `surfaceInput` sits close to `danger` should set its own `danger` the same way.

## 0.4.0

### Minor Changes

- 04856c3: Add `color.borderControl` (`--color-border-control`), an opaque boundary for a control known by its outline alone: the unchecked checkbox and the radio. It is `#857F79` in light and `#8A909C` in dark. `borderStrong` is a translucent hairline that falls to about 1.1–1.4:1 on a raised surface; WCAG 1.4.11 asks 3:1 of a control's boundary. The component pair list now holds `borderControl` to 3:1 on `surface1`, `surface2`, `surfaceRaised` and `surfaceInput`, so `checkThemeContrast` checks it for every theme: the house values clear it at 3.54:1 or better in light and 5.35:1 or better in dark. A theme that overrides those surfaces may need to set `borderControl` too, and the check will say so.

## 0.3.0

### Minor Changes

- 057c4d2: Add a theme API, so an app can restyle the whole library from one definition. `defineTheme` builds a theme from overrides of the library's tokens, with room for the app's own tokens under a prefix of its choosing. `themeToCss` turns that theme into a complete stylesheet scoped to a class, which follows the `data-theme` attribute on `<html>` and then the operating system's colour preference, and has blocks that pin one scope to light or dark. `checkThemeContrast` holds a theme to the library's text and component colour pairs, with named exemptions for brand colours that cannot pass and room for extra pairs of the app's own. `findUnknownCustomProperties` and `customPropertyNamesOf` find every `var(--name)` that a stylesheet reads but nothing declares, so a misspelled token fails a check instead of rendering as nothing. The token set grows to give a theme more to change: `font.display` and `font.body`; the `fontWeight`, `fontStretch` and `textTransform` families; six purpose radii (`control`, `option`, `panel`, `popup`, `card` and `dialog`); `size.drawer`, `size.control`, `size.controlSm` and `size.close`; the `selected`, `inverse`, `nav`, `tabBar`, `segmented`, `sheetHandle`, `scrimSheet` and `avatar` colours; and ten `shadow` keys. Apart from `size.close` (2.25rem, the dialog close circle), which is new and has no earlier value, every new token's default equals the value the library already used for that role, so `tokens.css` changes no consumer's look. The two intended look changes in this release land with the ui package's own changeset.

## 0.2.0

### Minor Changes

- b34ca2e: Add `--color-scrim`, the wash behind a modal surface, themed separately in light and dark. The alternative — reusing `--color-surface-inverse` at a reduced opacity — inverts between themes, because that role is near-black in light mode and near-white in dark.

## 0.1.1

### Patch Changes

- b18fbd1: First release staged by CI through npm trusted publishing.

## 0.1.0

### Minor Changes

- 59a2bf4: First published release of the design tokens and the UI components (moved from portfolio-mfe).
