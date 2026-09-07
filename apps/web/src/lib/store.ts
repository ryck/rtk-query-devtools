import { configureStore } from "@reduxjs/toolkit"
import { postsApi, usersApi } from "@rtk-query-devtools/demo-api"
// This demo site's whole point is showing the panel live, so its store opts
// into the unguarded `/production` entry instead of the default import (which
// no-ops itself in a production build, by design, for real consumers).
import { createRtkQueryDevtools } from "rtk-query-devtools/production"

// Module-level singleton, safe here specifically because every consumer is
// mounted behind <ClientOnly>. No hook ever subscribes during SSR, so this
// never dispatches or fetches server-side; it only comes alive once
// hydrated in an individual visitor's own browser tab.
export const rtkqDevtools = createRtkQueryDevtools({
  apis: [postsApi, usersApi],
})

export const store = configureStore({
  reducer: {
    [postsApi.reducerPath]: postsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      postsApi.middleware,
      usersApi.middleware,
      rtkqDevtools.middleware
    ),
})
