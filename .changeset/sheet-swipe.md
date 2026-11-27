---
'@calcifer-design/ui': minor
---

Dialog's sheet closes on a touch swipe toward its edge (down for a bottom sheet, toward the
trailing edge for a side sheet). Built on Base UI's Drawer; the props are unchanged. A swipe
close reaches `onOpenChange(false, details)` with `details.reason === 'swipe'`, so a controlled
sheet can refuse it. Mouse and pen never drag a sheet. On Android Chromium the back gesture now
closes the topmost open sheet through Base UI's CloseWatcher, reaching `onOpenChange` with
`details.reason === 'close-watcher'`, so a controlled sheet can refuse that too. A sheet's footer
stays above the phone's on-screen keyboard, and Drawer's keyboard provider takes over a tap on a
text field in a sheet: it focuses the field itself and sends a replacement (untrusted) click.
Inline styles and data attributes on the sheet popup (`data-swipe-direction`,
`data-nested-drawer-open`, `data-drawer-content`) change (Drawer's variables replace Dialog's),
so snapshot tests that record them need refreshing.
