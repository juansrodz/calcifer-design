# Sheet swipe-to-dismiss: `Dialog`'s sheet on Base UI's Drawer

## Intent

On a phone, people try to swipe WBW's bottom sheets down to close them, and nothing happens. The
sheet draws a grab bar but listens for no drag. Every WBW sheet (Item, Suggestions, Participants, Join
code, Follow list, the emoji library, Forgot password and the rest, eleven screens) is the library's
`Dialog` with `variant="sheet"`. Four more (Reactions, Entry reactions, Join prompt, the who-can-join
switch confirm) are `center` from `md` up and `sheet` below it, so they swipe on phones too. Fixing the sheet once in the library fixes all of them.

This is half of a larger aim: making WBW feel like an app on a phone. The other half, a home-screen
install (manifest, icon, standalone mode, an iPhone install hint), is separate work that waits on the
maintainer's mocks. Badges and push belong to the WBW notification work. Neither is in this design.

## Goals

- A bottom sheet follows the finger when dragged down, and closes when it is dragged far enough or
  flicked. A short or slow drag springs it back.
- The grab bar is a real handle. The whole popup can be dragged, except where its content scrolls: a
  body scrolled away from its top scrolls first, and the sheet moves only once the body is back at
  the top.
- The `end` sheet (the side panel WBW uses from its `md` frame width) closes with a swipe toward its
  edge: right in left-to-right, left in right-to-left.
- A swipe is one more way to close, and goes through `onOpenChange(false, details)` like the X, the
  scrim and Escape. A controlled caller that refuses the close keeps the sheet open, and the sheet
  springs back.
- Form sheets stay above the phone's on-screen keyboard.
- Nothing else changes: the look in both themes, the close control, focus behaviour (`initialFocus`,
  `finalFocus`, `quietFocus`, the focus-trap guard fix), the scrolling body's tab stop, the padding
  and handle hooks, and the `DialogProps` API.

## Non-goals

- Snap points or a half-open resting height. A sheet is open or closed.
- Opening a sheet by swiping up from the screen edge (Drawer's swipe area).
- Dragging with a mouse or a pen. Swiping is for touch; desktop keeps the X, the scrim and Escape.
  (My call: Drawer cannot exclude the mouse alone, and the one supported way, a
  `data-drawer-content` mark, excludes the pen as well. Pen swiping isn't worth a custom filter.)
- Any change to the `center` variant.
- The home-screen install, icon badges and push.

## Anti-goals

These would make the work a failure even if swiping works:

- A WBW screen changes its look, or its focus or keyboard behaviour, at 1280 or 390 px in either theme.
- A sheet with unsaved changes (Item, Event) closes on a swipe without asking. Today the X, the scrim
  and Escape all show the discard question. A swipe has to do the same.
- Scrolling a long sheet's body (Participants, the emoji library, Follow list) drags the sheet instead.
- A breaking change to `Dialog`'s props, or a consumer having to change code to get swiping.

## Constraints

- `@base-ui/react` is at 1.8.0 in `packages/ui`. Its `drawer` exports Root, Trigger, Portal, Backdrop,
  Viewport, Popup, Content, Title, Description, Close, SwipeArea and VirtualKeyboardProvider. Root
  takes `swipeDirection` (default `down`), `disablePointerDismissal`, controlled `open`/`onOpenChange`
  with a `swipe` close reason, and snap point props this design leaves unused. Popup exposes swipe
  movement and height as CSS variables, and `data-swiping`, `data-swipe-dismiss`,
  `data-starting-style` and `data-ending-style` attributes.
- `Dialog` renders into `usePortalContainer()` (the `ThemeScope` host). WBW also runs embedded in
  the portfolio shell, so the sheet must work inside that portal and that frame.
- WBW stacks a centred dialog on an open sheet (the Item and Event discard confirms). Base UI counts
  that as a nested dialog, not a drawer, so the sheet is unaffected.
- WBW also stacks a sheet on a sheet: on phones the who-can-join switch confirm is a bottom sheet
  inside the Event sheet. That turns on Drawer's nested-drawer behaviour: the parent can't be swiped
  while the child is open (fine), and it gets `data-nested-drawer-open`, `--nested-drawers` and a
  pinned `--drawer-height`. The parent must look as it does today (no scaling or offset), and the
  child swipes closed on its own. (My call.)
- Library rules apply: tokens for every value, forced colours, reduced motion, and the existing
  Dialog tests stay green except where they assert Dialog-only internals.
- WBW has a per-UI-task rule: a Playwright visual pass at 1280 and 390 px, light and dark, against
  the WBW mock, before a task counts as done.

## Approaches

1. **Rebuild the sheet variant on Base UI's Drawer (chosen).** `Dialog` keeps its API. `variant="sheet"`
   renders Drawer parts and `center` keeps Dialog parts. Drawer already solves the hard parts: the
   drag tracks the finger, flick speed, the scroll-versus-drag conflict, release animation and the
   on-screen keyboard. The cost is re-checking every sheet's look, focus and hooks against today.
2. **Add drag handling to the current Dialog sheet.** Smaller to start, but the library would own the
   hard parts that Drawer already solves, and it would get them wrong on iOS for a while.
3. **Build swiping in WBW only.** It goes against the rule that generic UI lives in the library, and
   needs wiring in each of eleven screens.

The maintainer chose 1.

## The design

**Component.** `Dialog` branches on `variant`. `center` renders exactly what it renders today. `sheet`
renders Drawer's Root, Portal, Backdrop, Viewport and Popup, with Drawer's Title, Description and Close
in the same places, and the same classes and data attributes (`data-popup="sheet"`, `data-side`,
`data-variant`). The existing skin keeps applying. The handle `div` stays where it is.

**Width-switching dialogs.** Reactions, Entry reactions, Join prompt and the who-can-join switch
confirm pick `center` from `md` up and `sheet` below it. With the sheet on Drawer, crossing `md` while
one is open rebuilds it: unsent picks, scroll position and focus are lost, and the open animation may
replay. The maintainer accepted this (2026-11-25): the four are small, and rotating mid-dialog is rare.
No shared Root is built for them.

**Direction.** `side="bottom"` swipes `down`. `side="end"` swipes `right`, or `left` when the
document direction is RTL. The builder reads the direction the way the skin's existing
`[dir='rtl']` rules do.

**Closing.** A swipe calls the caller's `onOpenChange(false, details)` with Drawer's `swipe` reason.
When a controlled caller keeps `open` true (WBW's dirty guard), Drawer sees `open` still true on the
next frame and resets the swipe, so the sheet returns to rest and the caller's discard confirm opens
over it. The close animation may start and then reverse; check that in a browser and smooth it if it
looks wrong. Uncontrolled sheets close.

**Outside press and Escape.** Unchanged. `dismissOnOutsidePress` maps to
`disablePointerDismissal`, as it does today.

**Motion.** Opening and closing keep today's transitions. During a drag the popup follows the
finger with no transition. On release it either finishes closing or springs back, using Drawer's
release-duration scalar. Under `prefers-reduced-motion` the popup still follows the finger (that's
direct manipulation, not animation), but the release snaps without the spring.

**Keyboard on phones.** Every sheet is wrapped in `Drawer.VirtualKeyboardProvider` (inside Root).
`Dialog` can't tell a form sheet from another without a new prop, and the provider does nothing in a
sheet with no text fields. It isn't automatic: the skin uses its `--drawer-keyboard-inset` viewport
variable to keep the focused field and the pinned footer above the keyboard on iOS Safari and
Android Chrome. The provider takes over taps on text fields (it focuses the field itself and
re-sends the click), so the WBW checks include typing in the comment field, the emoji library's
search and the Item form. (My call.)

**Pointer types.** Touch swipes; a mouse or pen press does not start a swipe. The supported route is
the `data-drawer-content` mark on the popup's content, which Drawer skips for mouse and pen presses.

**Focus and a11y.** `initialFocus`, `finalFocus`, `quietFocus`, `aria-modal`, the focus-guard
handling (`holdFocusInTrap`) and the overflowing body's region tab stop all carry over. Swiping is
pointer-only and adds nothing for assistive technology. The X and Escape remain the accessible ways
out, as they are today.

**Release.** A minor `@calcifer-design/ui` release (0.16.0 at the time of writing, using the changeset
flow), published only on the maintainer's approval. WBW then bumps its `@calcifer-design/ui` range
and changes no product code. Three WBW snapshots record the popup's inline variables
(`ItemSurface`, `ParticipantsSheet`, `ReactionsDialog`); Drawer writes different ones, so the bump
refreshes those snapshots after reading the diff. The library does not imitate today's HTML. (My
call.) The bump is its own small WBW change, with the visual pass.

## Verification

- Library unit tests: the existing Dialog suite passes for both variants (rewrite the assertions
  that inspect Dialog-only internals so they check behaviour instead). New tests: a swipe past the
  threshold calls `onOpenChange(false)` with the swipe reason; a refused close leaves the sheet open;
  `end` swipes right (left under RTL); a mouse or pen drag does nothing; a sheet on a sheet keeps
  the parent's look and the child swipes alone.
- Library browser checks (Playwright, touch emulation, 390 px): drag and release below and past the
  threshold, flick, scroll a long body then drag, both themes, forced colours, reduced motion.
- WBW, after the bump: every sheet at 390 px swipes closed, including the four width-switching
  dialogs and the switch confirm on the Event sheet. Item and Event with unsaved changes
  spring back and ask. Participants and the emoji library scroll without moving the sheet. Item, Join
  code and Forgot password stay above the keyboard (checked on a real iPhone by the maintainer when
  available, otherwise WebKit emulation). The full visual pass at 1280 and 390 px, light and dark,
  shows no change from today apart from the new gesture. The portfolio-embedded app swipes too.

## Left to the builder

- How `Dialog` splits internally (one component that branches, or two inner components sharing the
  header, body and footer).
- Whether Drawer's `Content` part is needed for the scroll-versus-drag handling, and where it sits.
- The exact CSS needed to keep Drawer's own attributes and variables from restyling the skin, and
  to suppress nested drawer styling.
- Story additions in `Dialog.stories.tsx` for the swipe.
