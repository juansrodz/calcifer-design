---
'@calcifer-design/ui': patch
---

Add a Storybook example that composes all six Tier 3 components into one form, with the field adapter a form library such as TanStack Form needs — about ten lines, because `error` is a string prop and every control reports its value directly. The example and its test ship in the repository only; neither reaches `dist`.
