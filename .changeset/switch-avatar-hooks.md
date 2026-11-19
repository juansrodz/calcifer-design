---
'@calcifer-design/ui': minor
---

`Switch` gains three more colour hooks, for its checked track and its thumb, and `Avatar` keeps an edge in forced colours. Every default looks the same as before.

- `--switch-track-checked-background` and `--switch-track-checked-border-color` set a checked switch's track fill and border colour. Both default to `--color-accent`, today's checked look. They apply to the checked track only, as the two unchecked-track hooks apply to the unchecked one. Set the checked pair together: a fill set alone keeps the accent edge. The border hook takes a colour, not a shorthand, so the track keeps its 1 px border and the thumb's travel. This supersedes 0.13.0's "A checked switch is the accent whatever they say": a checked switch is the accent by default, and these hooks move it.
- `--switch-thumb-background` sets the thumb's fill, checked and unchecked. It defaults to `--color-surface-raised`, as today.
- Set them from a class on any ancestor (they inherit). A consumer that sets any of them is responsible for the track's 3:1 against its own surface (WCAG 1.4.11) and for the thumb's ratio against the track. The default thumb is not held to one, since the track's edge says the switch is there. Forced colours ignore all five switch hooks and keep painting system colours.
- In forced colours an `Avatar` now draws a 1 px edge in the system text colour, inside its box, so an initials disc keeps its shape where the browser drops its fill. It takes no layout, and normal mode is unchanged.
- New stories: `Switch` `TrackAndThumbHooks` and `TrackAndThumbHooksDark`.
