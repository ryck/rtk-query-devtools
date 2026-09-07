---
"rtk-query-devtools": minor
---

Add an "All APIs" option to every tab's api selector. It's the default when more than one api is registered, merging queries, mutations, tags, and timeline events from every api into one list with a slice-name column (e.g. `postsApi`) between the status icon and the endpoint name. "Reset API" becomes "Reset All APIs" and resets every registered api when this option is active. Single-api apps are unaffected — the selector still only appears once there's more than one api to choose between.
