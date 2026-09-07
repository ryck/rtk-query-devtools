---
"rtk-query-devtools": minor
---

Add an "All APIs" option to every tab's api selector. It's the default when more than one api is registered, merging queries, mutations, tags, and timeline events from every api into one list with a slice-name pill on the right of each row, just before its subscriber count. "Reset API" becomes "Reset All APIs" and resets every registered api when this option is active. The queries tab's API config strip also collapses into a single top-level disclosure in this mode, with each api nested inside as its own independently-expandable row, instead of stacking one strip per api. Single-api apps are unaffected — the selector still only appears once there's more than one api to choose between.
