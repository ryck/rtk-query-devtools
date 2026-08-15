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
import { createTanStackQueryDevtoolsPlugin } from "@/lib/create-tanstack-query-devtools-plugin";

const TITLE = "Live examples | RTK Query Devtools";
const DESCRIPTION =
  "The devtools panel running for real, with RTK Query and TanStack Query side by side against the same in-memory API.";
const URL = "https://rtk-query-devtools.ryck.dev/examples";

export const Route = createFileRoute("/examples")({
  component: Examples,
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

function Examples() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <span className="font-mono text-xs tracking-[0.2em] text-amber uppercase">Live examples</span>
      <h1 className="mt-4 max-w-xl text-3xl leading-tight font-semibold text-balance text-paper sm:text-4xl">
        This is the panel. Actually running.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-mist">
        Every card below dispatches real requests against the same in-memory fake API, one column
        through RTK Query and one through TanStack Query, covering arguments, mutations, errors,
        polling, and pagination. Open the devtools panel in the bottom-right corner and switch
        between the two plugin tabs to compare them.
      </p>

      <AppProviders fallback={<ExamplesFallback />}>
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
    <h2 className="border-b border-panel-line pb-2 font-mono text-xs tracking-[0.2em] text-mist uppercase">
      {children}
    </h2>
  );
}

function ExamplesFallback() {
  return (
    <div className="mt-10 flex items-center justify-center rounded-2xl border border-panel-line bg-panel px-6 py-24 font-mono text-sm text-mist">
      Loading examples…
    </div>
  );
}
