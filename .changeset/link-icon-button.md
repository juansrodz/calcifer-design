---
'@calcifer-design/ui': minor
---

Add `LinkIconButton`, an icon button that is a link. It is to `IconButton` what `LinkButton` is to `Button`: an `<a>`, or the element given to `render` (a router link), that wears `IconButton`'s variants, sizes, badge, focus ring and 44 px / 40 px hit area, with none of its button semantics. It takes `label`, `variant`, `size`, `badge`, `render` and the anchor's own props. Before, an `IconButton` given a router link through `render` was announced as a button (an app had to pass `role="link"` itself) and followed the link on Space, through Base UI's keyup click; a `LinkIconButton` is announced as a link, Enter follows it once and Space does not activate it. A link is never pressed, busy or disabled, so it has no `pressed`, `loading` or `disabled`. `IconButton` itself is unchanged, and its stylesheet now sets `text-decoration: none`, which only an anchor can show.
