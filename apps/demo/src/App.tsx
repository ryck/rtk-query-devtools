import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRtkQueryDevtoolsPlugin } from "rtk-query-devtools"
import { FlakyQueryPanel } from "@/components/demo/flaky-query-panel"
import { InfiniteQueryPanel } from "@/components/demo/infinite-query-panel"
import { PollingPanel } from "@/components/demo/polling-panel"
import { PostsPanel } from "@/components/demo/posts-panel"
import { SlowQueryPanel } from "@/components/demo/slow-query-panel"
import { UsersPanel } from "@/components/demo/users-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function App() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">rtk-query-devtools demo</h1>
        <p className="text-sm text-muted-foreground">
          Open the devtools panel in the bottom-right corner and try each
          scenario below.
        </p>
      </header>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="slow">Slow</TabsTrigger>
          <TabsTrigger value="flaky">Flaky</TabsTrigger>
          <TabsTrigger value="polling">Polling</TabsTrigger>
          <TabsTrigger value="infinite">Infinite</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PostsPanel />
        </TabsContent>
        <TabsContent value="slow">
          <SlowQueryPanel />
        </TabsContent>
        <TabsContent value="flaky">
          <FlakyQueryPanel />
        </TabsContent>
        <TabsContent value="polling">
          <PollingPanel />
        </TabsContent>
        <TabsContent value="infinite">
          <InfiniteQueryPanel />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
      </Tabs>

      <TanStackDevtools
        plugins={[createRtkQueryDevtoolsPlugin({ defaultOpen: true })]}
      />
    </div>
  )
}
