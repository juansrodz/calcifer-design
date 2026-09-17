---
'@calcifer-design/ui': patch
---

Fix `base.css` shipping with 122 stale bytes after its last brace. Two steps of the build wrote `dist/styles/base.css` — the bundleless compile and the explicit copy — and when the shorter write landed second it did not truncate the longer one, so 0.2.0's file ends in half a declaration and two stray braces. Browsers skip it; Vite's production minifier rejects it, which failed every Vite consumer's build. The copy is now the file's only writer and the dist tests assert it is byte-identical to the source and that every shipped stylesheet is structurally whole.
