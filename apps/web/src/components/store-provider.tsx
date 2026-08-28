import { ClientOnly } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/store"

/**
 * Wraps live RTK Query content in a client-only boundary. The store is
 * never touched during SSR. No hook subscribes, so nothing dispatches or
 * fetches server-side; it only comes alive once hydrated in the
 * visitor's own browser tab.
 */
export function StoreProvider({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ClientOnly fallback={fallback}>
      <Provider store={store}>{children}</Provider>
    </ClientOnly>
  )
}
