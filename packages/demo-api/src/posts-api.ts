import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import {
  ApiError,
  createPost,
  fetchPost,
  fetchPostSlow,
  fetchPosts,
  fetchPostsFlaky,
  fetchPostsPage,
  type Post,
  removePost,
} from "./fake-posts-backend"

export type { Post }

interface PostsApiError {
  status: number
  data: string
}

async function toResult<T>(promise: Promise<T>) {
  try {
    return { data: await promise }
  } catch (error) {
    if (error instanceof ApiError)
      return { error: { status: error.status, data: error.message } }
    return {
      error: {
        status: 500,
        data: error instanceof Error ? error.message : "Unknown error",
      },
    }
  }
}

export const postsApi = createApi({
  reducerPath: "postsApi",
  baseQuery: fakeBaseQuery<PostsApiError>(),
  // Opted in so the devtools' offline/focus toggles visibly refetch. Note the
  // demo never calls `setupListeners`, so nothing dispatches the underlying
  // `__rtkq/online` / `__rtkq/focused` actions except the devtools panel, so
  // real browser focus changes stay inert.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ["Post"],
  endpoints: (builder) => ({
    listPosts: builder.query<Post[], void>({
      queryFn: () => toResult(fetchPosts()),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Post" as const, id })),
              { type: "Post" as const, id: "LIST" },
            ]
          : [{ type: "Post" as const, id: "LIST" }],
    }),
    getPost: builder.query<Post, number>({
      queryFn: (id) => toResult(fetchPost(id)),
      providesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),
    getPostSlow: builder.query<Post, number>({
      queryFn: (id) => toResult(fetchPostSlow(id)),
      providesTags: (_result, _error, id) => [{ type: "Post", id }],
    }),
    listPostsFlaky: builder.query<Post[], void>({
      queryFn: () => toResult(fetchPostsFlaky()),
      providesTags: [{ type: "Post", id: "FLAKY" }],
    }),
    addPost: builder.mutation<Post, { title: string; body: string }>({
      queryFn: (draft) => toResult(createPost(draft)),
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),
    deletePost: builder.mutation<{ id: number }, number>({
      queryFn: (id) => toResult(removePost(id)),
      invalidatesTags: (_result, _error, id) => [
        { type: "Post", id },
        { type: "Post", id: "LIST" },
      ],
    }),
    listPostsInfinite: builder.infiniteQuery<Post[], void, number>({
      queryFn: ({ pageParam }) => toResult(fetchPostsPage(pageParam)),
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
          lastPage.length === 0 ? undefined : lastPageParam + 1,
      },
    }),
  }),
})

export const {
  useListPostsQuery,
  useGetPostQuery,
  useGetPostSlowQuery,
  useListPostsFlakyQuery,
  useAddPostMutation,
  useDeletePostMutation,
  useListPostsInfiniteInfiniteQuery,
} = postsApi
