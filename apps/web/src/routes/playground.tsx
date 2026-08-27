import { TanStackDevtools } from "@tanstack/react-devtools";
import { createFileRoute } from "@tanstack/react-router";
import { createRtkQueryDevtoolsPlugin } from "rtk-query-devtools";
import { AppProviders } from "@/components/app-providers";
import { ArgsExample } from "@/components/examples/args-example";
import { FlakyExample } from "@/components/examples/flaky-example";
import { InfiniteExample } from "@/components/examples/infinite-example";
import { PollingExample } from "@/components/examples/polling-example";
import { PostsExample } from "@/components/examples/posts-example";
import { SlowExample } from "@/components/examples/slow-example";
import { TqArgsExample } from "@/components/examples/tq-args-example";
import { TqFlakyExample } from "@/components/examples/tq-flaky-example";
import { TqInfiniteExample } from "@/components/examples/tq-infinite-example";
import { TqPollingExample } from "@/components/examples/tq-polling-example";
import { TqPostsExample } from "@/components/examples/tq-posts-example";
import { TqSlowExample } from "@/components/examples/tq-slow-example";
import { TqUsersExample } from "@/components/examples/tq-users-example";
import { UsersExample } from "@/components/examples/users-example";
import { Card, CardContent } from "@/components/ui/card";
import { createTanStackQueryDevtoolsPlugin } from "@/lib/create-tanstack-query-devtools-plugin";

const TITLE = "Playground | RTK Query Devtools";
const DESCRIPTION =
  "The devtools panel running for real, with RTK Query and TanStack Query side by side against the same in-memory API.";
const URL = "https://rtk-query-devtools.ryck.dev/playground";

export const Route = createFileRoute("/playground")({
  component: Playground,
  // See the note in features.tsx: each page needs its own canonical.
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
});

function Playground() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Playground</span>
      <h1 className="mt-4 max-w-xl text-3xl leading-tight font-semibold text-balance text-foreground sm:text-4xl">
        This is the panel. Actually running.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Every card below dispatches real requests against the same in-memory fake API, one column
        through RTK Query and one through TanStack Query, covering arguments, mutations, errors,
        polling, and pagination. Open the devtools panel in the bottom-right corner and switch
        between the two plugin tabs to compare them.
      </p>

      <AppProviders fallback={<PlaygroundFallback />}>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <SectionLabel>RTK Query</SectionLabel>
            <div className="mt-4 grid gap-6">
              <PostsExample />
              <ArgsExample />
              <SlowExample />
              <FlakyExample />
              <PollingExample />
              <InfiniteExample />
              <UsersExample />
            </div>
          </div>
          <div>
            <SectionLabel>TanStack Query</SectionLabel>
            <div className="mt-4 grid gap-6">
              <TqPostsExample />
              <TqArgsExample />
              <TqSlowExample />
              <TqFlakyExample />
              <TqPollingExample />
              <TqInfiniteExample />
              <TqUsersExample />
            </div>
          </div>
        </div>
        <TanStackDevtools
          plugins={[
            createRtkQueryDevtoolsPlugin({ defaultOpen: true }),
            createTanStackQueryDevtoolsPlugin(),
          ]}
        />
      </AppProviders>
    </main>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="border-b border-border pb-2 font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
      {children}
    </h2>
  );
}

function PlaygroundFallback() {
  return (
    <Card className="mt-10">
      <CardContent className="flex items-center justify-center py-18 font-mono text-sm text-muted-foreground">
        Loading the playground…
      </CardContent>
    </Card>
  );
}
