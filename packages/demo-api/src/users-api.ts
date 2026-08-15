import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchUsers, type User } from "./fake-users-backend";

export type { User };

/**
 * A second, independent `createApi` instance with its own reducerPath, which
 * exercises the devtools panel's multi-API discovery and the API selector
 * that appears in each tab's toolbar once more than one is detected.
 */
export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fakeBaseQuery<unknown>(),
  // See the note in posts-api. Enabled so the devtools environment toggles
  // have something observable to do.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    listUsers: builder.query<User[], void>({
      queryFn: async () => ({ data: await fetchUsers() }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "User" as const, id })),
              { type: "User" as const, id: "LIST" },
            ]
          : [{ type: "User" as const, id: "LIST" }],
    }),
  }),
});

export const { useListUsersQuery } = usersApi;
