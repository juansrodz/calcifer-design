# Sheet swipe-to-dismiss Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Dialog`'s `sheet` variant closes on a touch swipe toward its edge, built on Base UI's
Drawer, with no change to `DialogProps`, the look or the focus behaviour.

**Architecture:** `Dialog.tsx` keeps one public component. `variant="center"` renders today's
Base UI Dialog tree unchanged; `variant="sheet"` renders the same header, body and footer inside
Base UI Drawer parts. The shared inner content moves into one internal component so the two trees
never drift. Swipe motion is styled in `popup.module.css` from Drawer's own attributes and
variables.

**Tech Stack:** React 19, `@base-ui/react` 1.8.0 (`@base-ui/react/drawer`), CSS modules, Vitest +
jsdom (unit), Storybook 10 play functions run by `@storybook/test-runner` in headless Chromium
(browser behaviour), Changesets.

**Spec:** `docs/superpowers/specs/2026-11-25-sheet-swipe-design.md`

## Global Constraints

- `DialogProps` does not change: no prop added, removed or retyped (`src/index.ts` exports stay
  `Dialog`, `DialogProps`, `DialogVariant`, `SheetSide`).
- `variant="center"` renders exactly what it renders today.
- Swipe directions: `side="bottom"` → `down`; `side="end"` → `right`, or `left` under a
  `[dir='rtl']` ancestor.
- Touch swipes; mouse and pen presses never start a swipe.
- No snap points, no swipe-to-open area.
- A swipe close calls `onOpenChange(false, details)` with `details.reason === 'swipe'`; a
  controlled caller that keeps `open` true keeps the sheet open.
- Reduced motion: the popup still tracks the finger; the release has no spring.
- Every value from a token; forced colours and both themes keep working.
- No single-letter identifiers; comments 1–2 lines, plain, no plan or spec ids.
- `bun run check` passes at the end of every task.
- Publishing to npm happens only on the maintainer's word, with `--registry
https://registry.npmjs.org/` passed explicitly.

## Review Focus

1. **A long body scrolled down, then dragged down:** the body scrolls back to its top first; the
   sheet moves only once the body is at its top. (Task 2, story `SheetScrollsBeforeSwipe`.)
2. **A tap on a button or field inside the sheet:** it still activates and does not start a
   swipe or close the sheet. (Task 2, story `SheetTapIsNotASwipe`.)
3. **A swipe while a nested centred dialog is open over the sheet** (WBW's discard confirm): the
   sheet underneath does not move. (Task 4, story `SheetUnderConfirm`.)
4. **A swipe that ends short of the threshold, slowly:** the sheet returns to rest and
   `onOpenChange` is not called. (Task 2, story `SheetShortSwipeReturns`.)
5. **The sheet inside a `ThemeScope` portal host** (the portfolio embed's path): it swipes the
   same. (Task 2: `SheetSwipeToDismiss` renders inside `ThemeScope`.)

---

## File structure

- Modify `packages/ui/src/components/Dialog/Dialog.tsx`: branch on variant; extract the shared
  inner content.
- Create `packages/ui/src/components/Dialog/DialogContent.tsx`: the header, handle, description,
  body and footer, given the Title/Description/Close parts to render with.
- Create `packages/ui/src/components/Dialog/swipeDirection.ts`: maps `side` and document
  direction to Drawer's `swipeDirection`.
- Modify `packages/ui/src/styles/popup.module.css`: drag, release and keyboard-inset rules.
- Modify `packages/ui/src/components/Dialog/Dialog.module.css`: only if a rule must read Drawer's
  attributes (the viewport keeps its classes).
- Create `packages/ui/src/components/Dialog/swipeGesture.ts`: story helper that dispatches touch,
  mouse or pen drags.
- Modify `packages/ui/src/components/Dialog/Dialog.stories.tsx` and `Dialog.test.tsx`.
- Create `.changeset/sheet-swipe.md`.

---

### Task 1: The sheet renders on Drawer, unchanged in every other way

**Files:**

- Create: `packages/ui/src/components/Dialog/DialogContent.tsx`
- Modify: `packages/ui/src/components/Dialog/Dialog.tsx`
- Test: `packages/ui/src/components/Dialog/Dialog.test.tsx`

**Interfaces:**

- Produces: `DialogContent` (internal, not exported from `src/index.ts`):

```ts
interface DialogContentProps {
  parts: {
    Title: typeof BaseDialog.Title | typeof Drawer.Title;
    Description: typeof BaseDialog.Description | typeof Drawer.Description;
    Close: typeof BaseDialog.Close | typeof Drawer.Close;
  };
  showHandle: boolean;
  // plus heading, headingLevel, headingHidden, headerStart, headerEnd, description, children,
  // footer, closeLabel, closeVariant, closeHidden, closeRef, titleId — as Dialog passes today
}
```

- Produces: inside `Dialog`, the sheet branch renders `Drawer.Root` → `Drawer.Trigger` (when
  `trigger`) → `Drawer.Portal container={container}` → `Drawer.Backdrop` → `Drawer.Viewport` →
  `Drawer.Popup`, carrying today's class names, `data-variant`, `data-side`, `data-popup="sheet"`,
  `aria-modal="true"`, `initialFocus`, `finalFocus`, `onFocus={holdOpeningRingBack}`,
  `ref={attachPopup}`, and `onFocus={holdFocusInTrap}` on the viewport. `swipeDirection` is fixed
  to `'down'` in this task (Task 3 replaces it).

- [ ] **Step 1: Write the failing test**

In `Dialog.test.tsx`, under a new `describe('the sheet on Drawer')`:

```tsx
it('renders the sheet popup with Drawer’s swipe direction attribute', async () => {
  render(<Sheet />);
  const popup = await screen.findByRole('dialog');
  expect(popup).toHaveAttribute('data-popup', 'sheet');
  expect(popup).toHaveAttribute('data-swipe-direction', 'down');
});

it('keeps the centred dialog off Drawer', async () => {
  render(<OpenOnLoad />);
  const popup = await screen.findByRole('dialog');
  expect(popup).not.toHaveAttribute('data-swipe-direction');
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd packages/ui && bunx vitest run src/components/Dialog/Dialog.test.tsx -t "the sheet on Drawer"`
Expected: FAIL on the first test (`data-swipe-direction` missing).

- [ ] **Step 3: Extract `DialogContent` and add the Drawer branch**

Move the JSX between `<BaseDialog.Popup>` and `</BaseDialog.Popup>` into `DialogContent`,
rendering Title, Description and Close through `parts`. `Dialog` keeps all hooks and refs and picks
the tree by `variant`. Root props for the sheet: `open`, `defaultOpen`, `onOpenChange`,
`disablePointerDismissal={!dismissOnOutsidePress}`, `swipeDirection="down"`. Pass no snap point
props.

- [ ] **Step 4: Run the whole Dialog suite**

Run: `cd packages/ui && bunx vitest run src/components/Dialog`
Expected: the two new tests pass. Any existing test that fails must be one that asserts a Base UI
Dialog internal rather than behaviour (for example an inline `--nested-dialogs` style). Rewrite
each such assertion to check the behaviour it stood for. List every rewritten test in the commit
body. No test that checks behaviour may be deleted or loosened.

- [ ] **Step 5: Run the full check, including the stories in Chromium**

Run: `bun run check`
Expected: PASS. Every existing Dialog story's play function (the padding hooks, the floors, the
quiet focus, RTL, 200% text) passes unchanged on the sheet.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/Dialog
git commit -m "refactor(ui): render Dialog's sheet on Base UI's Drawer"
```

---

### Task 2: A touch swipe moves and closes the bottom sheet

**Files:**

- Create: `packages/ui/src/components/Dialog/swipeGesture.ts`
- Modify: `packages/ui/src/styles/popup.module.css`
- Modify: `packages/ui/src/components/Dialog/Dialog.stories.tsx`

**Interfaces:**

- Produces, in `swipeGesture.ts` (story-only; not exported from the package):

```ts
type PointerKind = 'touch' | 'mouse' | 'pen';
interface SwipeOptions {
  deltaX?: number; // px, default 0
  deltaY?: number; // px, default 0
  durationMs?: number; // default 200; total time across the moves
  steps?: number; // default 10 move events
  kind?: PointerKind; // default 'touch'
  startAt?: Element; // default: the target's centre
}
function swipe(target: Element, options: SwipeOptions): Promise<void>;
function swipeStage(target: Element, options: SwipeOptions): Promise<{ release(): Promise<void> }>;
```

`touch` dispatches `TouchEvent`s built from `new Touch({ identifier, target, clientX, clientY })`
(touchstart, touchmove × steps, touchend) on the element at the start point; `mouse` and `pen`
dispatch `PointerEvent`s with that `pointerType` (pointerdown, pointermove × steps, pointerup).
Moves are spaced across `durationMs` with real timers so Drawer measures velocity.
`swipeStage` stops before the end event so a story can read the mid-drag position.

- [ ] **Step 1: Write the failing stories**

All render inside `ThemeScope` with `demoTheme` at the `mobile` viewport (390 px), as the 200%
text stories do. Use `fn()` from `storybook/test` for `onOpenChange`.

```tsx
export const SheetSwipeToDismiss: Story = {
  // Swiping down past half the sheet's height closes it with the swipe reason.
  play: async ({ args }) => {
    const popup = await settledDialog();
    await swipe(popup, { deltaY: popup.offsetHeight * 0.6, durationMs: 300 });
    await waitFor(() =>
      expect(args.onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'swipe' }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const SheetFollowsTheFinger: Story = {
  // Mid-drag the popup is translated by the drag, with no transition running on transform.
  play: async () => {
    const popup = await settledDialog();
    const restTop = popup.getBoundingClientRect().top;
    const drag = await swipeStage(popup, { deltaY: 80 });
    await expect(popup.getBoundingClientRect().top - restTop).toBeCloseTo(80, -1);
    await expect(
      popup.getAnimations().filter((animation) => animation instanceof CSSTransition),
    ).toHaveLength(0);
    await drag.release();
  },
};

export const SheetShortSwipeReturns: Story = {
  // A slow drag of 40 px springs back and never calls onOpenChange.
  play: async ({ args }) => {
    const popup = await settledDialog();
    const restTop = popup.getBoundingClientRect().top;
    await swipe(popup, { deltaY: 40, durationMs: 800 });
    await waitFor(() => expect(popup.getBoundingClientRect().top).toBeCloseTo(restTop, 0));
    await expect(args.onOpenChange).not.toHaveBeenCalled();
  },
};

export const SheetFlickCloses: Story = {
  // A fast 60 px flick closes even though it is short of half the height.
  play: async ({ args }) => {
    const popup = await settledDialog();
    await swipe(popup, { deltaY: 60, durationMs: 60, steps: 4 });
    await waitFor(() =>
      expect(args.onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: 'swipe' }),
      ),
    );
  },
};

export const SheetScrollsBeforeSwipe: Story = {
  // args: LongBody's children. With the body scrolled to 300 px, a downward drag on the body
  // scrolls it and leaves the sheet in place.
  play: async ({ args }) => {
    /* scrollTop = 300; swipe the body by 120 px; expect
    onOpenChange not called and popup top unchanged */
  },
};

export const SheetTapIsNotASwipe: Story = {
  // A touch tap (0 px move) on the footer button fires its onClick and leaves the sheet open.
};
```

`SheetSwipeToDismiss`, `SheetFlickCloses` and `SheetShortSwipeReturns` must also pass under a
`prefers-reduced-motion: reduce` emulation in a sibling story `SheetSwipeReducedMotion`, which
also asserts that after a short swipe no `CSSTransition` on `transform` runs (the snap back is
instant).

- [ ] **Step 2: Build Storybook and run the stories; see them fail**

Run: `bun run storybook:build && bun run storybook:test -- --testNamePattern "Swipe|Flick|Finger|Scrolls|Tap"`
Expected: `SheetSwipeToDismiss`, `SheetFollowsTheFinger` and `SheetFlickCloses` FAIL. The others
may already pass. If none of the stories register a swipe (the popup never moves), the touch
dispatch in `swipeGesture.ts` is wrong; fix it before going on.

- [ ] **Step 3: Style the drag and the release in `popup.module.css`**

Rules on `.surface[data-popup='sheet']`, using Drawer's own state:

- `[data-swiping]`: `transition-property: none` (the inline drag transform wins with no lag).
- Release: the existing transform transition, with its duration multiplied by
  `var(--drawer-swipe-strength)`. Write it with `calc(var(--motion-duration-2) *
var(--drawer-swipe-strength, 1))`.
- `[data-swipe-dismiss][data-ending-style]`: closes from the dragged position, not from rest.
- Under `@media (prefers-reduced-motion: reduce)`: the release and snap-back have
  `transition-property: none`; the open and close follow whatever the skin does under reduced
  motion today.
- The scrim's opacity follows `--drawer-swipe-progress` on the backdrop while swiping.

- [ ] **Step 4: Run the stories again; see them pass**

Run: `bun run storybook:build && bun run storybook:test -- --testNamePattern "Swipe|Flick|Finger|Scrolls|Tap"`
Expected: PASS.

- [ ] **Step 5: Full check and commit**

Run: `bun run check` (Expected: PASS)

```bash
git add packages/ui/src/components/Dialog packages/ui/src/styles/popup.module.css
git commit -m "feat(ui): the bottom sheet follows a touch drag and closes on a swipe"
```

---

### Task 3: The side sheet swipes toward its edge, and only touch swipes

**Files:**

- Create: `packages/ui/src/components/Dialog/swipeDirection.ts`
- Modify: `packages/ui/src/components/Dialog/Dialog.tsx`
- Test: `packages/ui/src/components/Dialog/swipeDirection.test.ts`,
  `Dialog.stories.tsx`

**Interfaces:**

- Produces: `function sheetSwipeDirection(side: SheetSide, element: Element | null): 'down' | 'right' | 'left'`
  — `bottom` → `down`; `end` → `left` when `element?.closest('[dir]')?.getAttribute('dir') === 'rtl'`,
  else `right`. Matches the skin's `[dir='rtl']` ancestor rule.
- Consumes: Task 1's Drawer branch; `Dialog` passes `swipeDirection={sheetSwipeDirection(side,
container ?? popupRef.current)}` computed on open.

- [ ] **Step 1: Write the failing unit tests** (`swipeDirection.test.ts`)

```ts
it('swipes a bottom sheet down', () =>
  expect(sheetSwipeDirection('bottom', document.body)).toBe('down'));
it('swipes an end sheet right on a left-to-right page', () =>
  expect(sheetSwipeDirection('end', document.body)).toBe('right'));
it('swipes an end sheet left under a right-to-left ancestor', () => {
  const host = document.createElement('div');
  host.setAttribute('dir', 'rtl');
  const inner = host.appendChild(document.createElement('div'));
  expect(sheetSwipeDirection('end', inner)).toBe('left');
});
```

- [ ] **Step 2: Write the failing stories**

- `SideSheetSwipeRight`: `side: 'end'`, a 0.6 × width touch swipe right closes with reason
  `swipe`.
- `SideSheetRightToLeftSwipesLeft`: reuses `SideSheetRightToLeft`'s decorator; a swipe left closes;
  a swipe right of the same length does not.
- `SheetIgnoresMouseDrag` and `SheetIgnoresPenDrag`: a `kind: 'mouse'` (then `'pen'`) drag of 0.6 ×
  height on the bottom sheet does not move it (top unchanged at mid-drag) and does not call
  `onOpenChange`.
- `SideSheetIgnoresMouseDrag`: the same on `side: 'end'`.

- [ ] **Step 3: Run them; see them fail**

Run: `cd packages/ui && bunx vitest run src/components/Dialog/swipeDirection.test.ts`, then
`bun run storybook:build && bun run storybook:test -- --testNamePattern "SwipeRight|SwipesLeft|Ignores"`
Expected: FAIL (the unit file has no module; the side sheet swipes down; mouse and pen drags move
the sheet).

- [ ] **Step 4: Implement**

Add `sheetSwipeDirection` and use it. For pointer types, put the `data-drawer-content=""`
attribute on `Drawer.Popup`: Drawer then ignores mouse and pen presses that start inside it, and
touch swipes are unaffected.

- [ ] **Step 5: Run them; see them pass. Then full check and commit**

Run: the two commands from Step 3, then `bun run check`. Expected: PASS.

```bash
git add packages/ui/src/components/Dialog
git commit -m "feat(ui): the side sheet swipes toward its edge; mouse and pen never drag a sheet"
```

---

### Task 4: Refused closes and stacked popups

**Files:**

- Modify: `packages/ui/src/components/Dialog/Dialog.stories.tsx`
- Modify, if the stories show a need: `popup.module.css`, `Dialog.tsx`

**Interfaces:**

- Consumes: `swipe` and `swipeStage` from Task 2.

- [ ] **Step 1: Write the stories**

- `SheetRefusesSwipeClose`: a controlled wrapper whose `onOpenChange(false)` sets a
  `confirming` state instead of closing (WBW's dirty guard), and renders a centred `Dialog`
  "Discard changes?" when `confirming`. Play: swipe the sheet 0.6 × height; expect the sheet still
  open, back at its rest top within 1 px once transitions finish, and the confirm dialog visible
  and focused.
- `SheetUnderConfirm`: with the confirm open, a touch swipe on the sheet underneath does not move
  it (top unchanged) and the confirm stays open.
- `SheetOnSheet`: a bottom sheet with a button that opens a second bottom sheet (WBW's switch
  confirm). Play: record the parent's bounding rect; open the child; expect the parent's rect,
  computed `transform` and `border-radius` unchanged; swipe the child closed (reason `swipe` on
  the child's `onOpenChange`); the parent stays open; a swipe on the parent then closes it.

- [ ] **Step 2: Run them**

Run: `bun run storybook:build && bun run storybook:test -- --testNamePattern "Refuses|UnderConfirm|OnSheet"`
Expected: either PASS, or FAIL showing which case needs work.

- [ ] **Step 3: Fix what fails**

- If the refused sheet reverses badly (visible jump or the scrim fades out and back), keep the
  popup at its dragged position until `open` is re-read, then transition to rest; do it in CSS on
  Drawer's attributes if possible.
- If the parent sheet changes look while a child sheet is open, neutralise Drawer's nested state
  in the skin (`[data-nested-drawer-open]`): no transform, no height pin visible.

- [ ] **Step 4: Run again; full check; commit**

Run: the Step 2 command, then `bun run check`. Expected: PASS.

```bash
git add packages/ui/src
git commit -m "test(ui): a refused swipe close, a confirm over a sheet and a sheet on a sheet"
```

---

### Task 5: Form sheets stay above the on-screen keyboard

**Files:**

- Modify: `packages/ui/src/components/Dialog/Dialog.tsx`, `packages/ui/src/styles/popup.module.css`
- Test: `Dialog.test.tsx`, `Dialog.stories.tsx`

**Interfaces:**

- Consumes: Task 1's Drawer branch. Wrap the sheet's Portal content in
  `Drawer.VirtualKeyboardProvider` (inside `Drawer.Root`).

- [ ] **Step 1: Write the failing tests**

Unit (`Dialog.test.tsx`):

```tsx
it('pads the sheet by the keyboard inset the viewport carries', async () => {
  render(<SheetWithForm />); // new story: a TextInput in the body, a footer button
  const viewport = (await screen.findByRole('dialog')).parentElement!;
  viewport.style.setProperty('--drawer-keyboard-inset', '300px');
  expect(
    getComputedStyle(await screen.findByRole('dialog')).getPropertyValue('padding-block-end'),
  ).toContain('300px');
});
```

If jsdom cannot resolve the computed `calc()`, assert in the story instead (Chromium), using the
same inset.

Story `SheetWithFormTyping`: tap the text field with a touch tap from `swipeGesture.ts` (0 px
move), type "Tamales" with `userEvent.keyboard`, and expect the field's value and focus. This pins
the provider's tap takeover.

- [ ] **Step 2: Run; see them fail**

Run: `cd packages/ui && bunx vitest run src/components/Dialog -t "keyboard inset"`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add the provider. In the skin, the bottom sheet's block-end padding becomes
`calc(<today's padding> + var(--drawer-keyboard-inset, 0px))`, so the pinned footer rides above
the keyboard. The end sheet is unchanged.

- [ ] **Step 4: Run; full check; commit**

Run: the Step 2 command and `bun run storybook:build && bun run storybook:test -- --testNamePattern "WithForm"`, then `bun run check`. Expected: PASS.

```bash
git add packages/ui/src
git commit -m "feat(ui): a sheet's footer stays above the on-screen keyboard"
```

---

### Task 6: Release notes and the library release

**Files:**

- Create: `.changeset/sheet-swipe.md`
- Modify: the Dialog docs page in `apps/docs` if one describes closing a sheet (search for
  "sheet" under `apps/docs`).

- [ ] **Step 1: Write the changeset**

```md
---
'@calcifer-design/ui': minor
---

Dialog's sheet closes on a touch swipe toward its edge (down for a bottom sheet, toward the
trailing edge for a side sheet). Built on Base UI's Drawer; the props are unchanged. A swipe
close reaches `onOpenChange(false, details)` with `details.reason === 'swipe'`, so a controlled
sheet can refuse it. Mouse and pen never drag a sheet. A sheet's footer stays above the phone's
on-screen keyboard. Inline styles on the sheet popup change (Drawer's variables replace Dialog's),
so snapshot tests that record them need refreshing.
```

- [ ] **Step 2: Full check**

Run: `bun run check && bun run changeset:status`
Expected: PASS; status lists `@calcifer-design/ui` minor.

- [ ] **Step 3: Commit, push the branch, open the PR**

```bash
git add .changeset docs apps
git commit -m "docs(ui): the sheet swipe changeset"
git push -u origin sheet-swipe/design
```

Open the PR with `gh pr create`. Merging and publishing are the maintainer's: after the merge,
the release runs `bun run release` on main with `--registry https://registry.npmjs.org/`, only on
their word.

---

### Task 7: WBW takes the new library version

Runs in a WBW worktree off `origin/main` (repo `~/Code/whosbringingwhat`), after the release is
on npm.

**Files:**

- Modify: `package.json`, `bun.lock`
- Modify: `src/screens/event-details/__snapshots__/ItemSurface.test.tsx.snap`,
  `ParticipantsSheet.test.tsx.snap`, `ReactionsDialog.test.tsx.snap`

- [ ] **Step 1: Bump**

Set `@calcifer-design/ui` to the released `^0.16.x` and install with
`bun install --registry https://registry.npmjs.org/`.

- [ ] **Step 2: Run the unit suite (take `unit.lock` first)**

Run: `bun run test`
Expected: only the three snapshots fail, and only on the popup's inline variables and
`data-swipe-direction`/Drawer attributes. Read each diff. Any other failure stops the task.

- [ ] **Step 3: Refresh the snapshots and run everything**

Run: `bunx vitest run -u src/screens/event-details` then `bun run lint && bun run typecheck && bun run test`
Expected: PASS.

- [ ] **Step 4: Phone checks with Playwright (390 px, touch, WebKit and Chromium; light and dark)**

Using the shared emulator lock and the seeded data:

- Every sheet swipes closed: Item, Suggestions, Participants, Join code, Follow list, the emoji
  library, Forgot password, Event, and at 390 px Reactions, Entry reactions, Join prompt and the
  who-can-join switch confirm on the Event sheet.
- Item and Event with unsaved changes: the swipe springs back and the discard question opens.
- Participants and the emoji library: scrolling the list does not move the sheet.
- Typing works in the comment field, the emoji search and the Item form.
- 1280 and 390 px screenshots, light and dark, match today apart from the gesture.
- The portfolio-embedded app at 390 px: a sheet swipes closed.

- [ ] **Step 5: Commit and hand over**

```bash
git add package.json bun.lock src
git commit -m "chore(deps): @calcifer-design/ui with swipe-to-dismiss sheets"
```

Push the branch and open the PR. The maintainer checks on a real iPhone (keyboard and swipe)
before the merge.
