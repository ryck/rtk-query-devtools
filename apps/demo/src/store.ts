import { configureStore } from "@reduxjs/toolkit";
import { postsApi, usersApi } from "@rtk-query-devtools/demo-api";
import { createRtkQueryDevtools } from "rtk-query-devtools";

export const rtkqDevtools = createRtkQueryDevtools({
  apis: [postsApi, usersApi],
});

export const store = configureStore({
  reducer: {
    [postsApi.reducerPath]: postsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      postsApi.middleware,
      usersApi.middleware,
      rtkqDevtools.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
