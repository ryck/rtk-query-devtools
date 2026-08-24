# rtk-query-devtools

## 0.3.1

### Patch Changes

- 425f9c5: Row lists (Queries, Mutations, Timeline) are now single-line: the subtitle
  (cache key/args, request id, or kind) renders inline next to the endpoint
  name instead of wrapping to a second line, so rows no longer take up double
  the vertical space.

  Every row now also ends in the same two fixed-width columns, in the same
  position, across all three tabs: a wall-clock timestamp and a duration.
  Queries and Mutations previously showed no duration in the row (and Queries
  showed a relative "2s ago" instead); Timeline previously showed only a
  duration. All three now show `HH:MM:SS` + duration, aligned identically, so
  scanning down any panel reads as one consistent table instead of three
  different layouts.

  The detail panel (shown when a row is selected) is now resizable by dragging
  the divider between the row list and the panel, or via keyboard (arrow keys
  to nudge, Home/Enter to reset, double-click to reset). Its width persists
  across sessions and is shared across all three tabs, so resizing it once
  keeps it consistent everywhere. It also now has a close button in its
  header to deselect without needing to find the originating row again.

  Status/outcome badges (Queries' fetching/error/fresh/etc, Mutations'
  pending/fulfilled/etc, Timeline's pending/fulfilled/rejected/skipped, and
  the "polling" indicator) are now icon-only, colour-coded pills instead of
  icon+text — the full label is still available via a native tooltip
  (`title`) and screen-reader `aria-label`. This keeps rows narrower without
  losing the status information.

  Toolbar buttons (`ToolbarButton`) now always render with a neutral border
  and label colour — only their icon carries the semantic colour
  (accent/danger/warning/success), instead of both border and text changing
  per variant. This makes rows of buttons (e.g. Online/Focused/Reset API)
  read as one consistent group instead of a mix of differently-outlined
  pills. "Reset API state" is renamed to "Reset API" and now has an icon and
  an explanatory tooltip; "Remove" (Queries/Mutations) now has a trash icon
  too, so the danger colour isn't lost now that it only lives on the icon.

  The Tags tab's "Invalidate all"/"Invalidate" buttons now show a brief
  "Invalidated" confirmation (with a checkmark) after being clicked, since
  invalidating tags only marks matching queries stale — only ones with an
  active subscriber refetch immediately — which could otherwise look like
  the click did nothing.

  The Queries detail panel's "Refetch" and "Invalidate tags" (now just
  "Invalidate", matching the Tags tab's wording) buttons now have icons too,
  consistent with every other action button. Status/outcome badge tooltips
  are now capitalised (e.g. "Fresh" instead of "fresh") to match normal
  sentence casing elsewhere in the UI.

## 0.3.0

### Minor Changes

- acfbbfd: The panel now carries its own styles and injects them on first render.

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

## 0.2.0

### Minor Changes

- 4266ca6: First release

### Patch Changes

- f15b362: Update homepage
- cac2537: Bump
