---
"rtk-query-devtools": minor
---

The panel now carries its own styles and injects them on first render.

**Breaking:** the `rtk-query-devtools/style.css` export has been removed. Delete
the import, which is no longer needed and will now fail to resolve:

```diff
  import { createRtkQueryDevtoolsPlugin } from "rtk-query-devtools";
- import "rtk-query-devtools/style.css";
```

A library build extracts CSS into a separate file and drops the import from the
JS, which meant forgetting that one line produced an unstyled panel with no
error explaining why. The stylesheet is now embedded in the panel module.

Production bundles are unaffected in size. The panel is only reachable from the
development branch of `createRtkQueryDevtoolsPlugin`, so a minified production
build drops the panel and its embedded CSS together, exactly as before.
