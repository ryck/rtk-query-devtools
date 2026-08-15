import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { StoreProvider } from "@/components/store-provider";
import { queryClient } from "@/lib/query-client";

/**
 * Composes the Redux store and TanStack Query client behind the same
 * <ClientOnly> boundary `StoreProvider` already establishes. The examples
 * page needs both live at once so the RTK Query and TanStack Query devtools
 * plugins can be compared side by side.
 */
export function AppProviders({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <StoreProvider fallback={fallback}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </StoreProvider>
  );
}
