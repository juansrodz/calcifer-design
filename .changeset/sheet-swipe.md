---
'@calcifer-design/ui': minor
---

Dialog's sheet closes on a touch swipe toward its edge (down for a bottom sheet, toward the
trailing edge for a side sheet). Built on Base UI's Drawer; the props are unchanged. A swipe
close reaches `onOpenChange(false, details)` with `details.reason === 'swipe'`, so a controlled
sheet can refuse it. Mouse and pen never drag a sheet. A sheet's footer stays above the phone's
on-screen keyboard. Inline styles on the sheet popup change (Drawer's variables replace Dialog's),
so snapshot tests that record them need refreshing.
