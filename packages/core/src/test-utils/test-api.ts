import { configureStore } from "@reduxjs/toolkit"
import type { Middleware } from "@reduxjs/toolkit"
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query"

export interface Post {
  id: number
  title: string
}

/**
 * A minimal but realistic RTK Query api used across the unit tests, so
 * assertions run against real generated action types and reducer behavior
 * instead of hand-rolled state fixtures. The internal action types this
 * package depends on (see actions.ts) are the main version-coupling risk,
 * and only a real store catches a rename.
 */
export function createTestApi(
  reducerPath = "testApi",
  /**
   * Off by default so the shared api can't refetch out from under tests that
   * don't care; the environment-simulation tests opt in.
   */
  options: { refetchOnFocus?: boolean; refetchOnReconnect?: boolean } = {}
) {
  return createApi({
    reducerPath,
    baseQuery: fetchBaseQuery({ baseUrl: "https://example.test/" }),
    refetchOnFocus: options.refetchOnFocus ?? false,
    refetchOnReconnect: options.refetchOnReconnect ?? false,
    tagTypes: ["Post"],
    endpoints: (builder) => ({
      getPost: builder.query<Post, number>({
        query: (id) => `posts/${id}`,
        providesTags: (_result, _error, id) => [{ type: "Post", id }],
      }),
      listPosts: builder.query<Post[], void>({
        query: () => "posts",
        providesTags: (result) =>
          result
            ? [
                ...result.map(({ id }) => ({ type: "Post" as const, id })),
                { type: "Post" as const, id: "LIST" },
              ]
            : [{ type: "Post" as const, id: "LIST" }],
      }),
      addPost: builder.mutation<Post, { title: string }>({
        query: (body) => ({ url: "posts", method: "POST", body }),
        invalidatesTags: [{ type: "Post", id: "LIST" }],
      }),
    }),
  })
}

export type TestApi = ReturnType<typeof createTestApi>

export function createTestStore(
  api: TestApi,
  extraMiddleware: Middleware[] = []
) {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware, ...extraMiddleware),
  })
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  })
}
