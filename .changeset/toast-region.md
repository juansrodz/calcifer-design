---
'@calcifer-design/ui': minor
---

Add `ToastRegion` and `createToastManager`: the toast provider, portal and viewport as one component, because it is the viewport — not the provider — that renders the notifications landmark and four window-level listeners, and mounting two of those is the failure this shape makes impossible. The manager is a plain object created outside React, so a federated host can hand it to a remote through props and have it work across a separate React root, where context cannot reach. Its payload is `string` rather than `ReactNode` for the same reason: an element authored in a remote would render under the host's CSS.
