import { QueryClient } from "@tanstack/react-query";

// Same singleton reasoning as `store.ts`: every consumer is mounted behind
// <ClientOnly>, so this client never fetches during SSR.
export const queryClient = new QueryClient({
  defaultOptions: {
    // No retries by default, matching RTK Query's default behavior. The
    // flaky example is meant to show a rejected request immediately, not
    // get silently smoothed over by automatic retries.
    queries: { retry: false },
  },
});
