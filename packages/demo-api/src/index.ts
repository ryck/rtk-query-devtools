export type { Post } from "./posts-api";
export {
  postsApi,
  useAddPostMutation,
  useDeletePostMutation,
  useGetPostQuery,
  useGetPostSlowQuery,
  useListPostsFlakyQuery,
  useListPostsInfiniteInfiniteQuery,
  useListPostsQuery,
} from "./posts-api";

export type { User } from "./users-api";
export { useListUsersQuery, usersApi } from "./users-api";

// Raw async fetchers behind both `createApi` instances above — exported so
// other data-fetching libraries (e.g. TanStack Query) can hit the exact
// same fake backend and be directly comparable in the devtools.
export {
  ApiError,
  createPost,
  fetchPost,
  fetchPostSlow,
  fetchPosts,
  fetchPostsFlaky,
  fetchPostsPage,
  removePost,
} from "./fake-posts-backend";
export { fetchUsers } from "./fake-users-backend";
