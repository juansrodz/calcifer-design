---
'@calcifer-design/ui': patch
---

`DataGrid`: no row of body text shows above the sticky header band any more. In a GPU-composited Chrome (an ordinary headed window) the compositor could place the sticky band up to a device pixel below the scroll area's top edge, so while the body was scrolled a one-pixel slice of the rows under it showed between the card header and the band. The band now sticks 1px above that edge, and its top hairline is the scroll area's own top border, which stays in place while the band slides under it. At rest the grid sits 1px lower than before (the border adds a pixel above the band) and is otherwise unchanged; while scrolled, the stuck band shows 1px less of its own top padding. The top hairline now lies on the card's surface rather than the band's, so it reads a shade lighter.
