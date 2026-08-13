import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ListTree, Radio, Tags } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { DormantBoard, FlipBoard } from "@/components/flip-board";
import { StoreProvider } from "@/components/store-provider";

export const Route = createFileRoute("/")({ component: Home });

const FEATURES = [
  {
    icon: Radio,
    title: "Status at a glance",
    body: "Fetching, fresh, error, inactive — every cache entry, labeled. No more inferring status from a stream of dispatched actions.",
  },
  {
    icon: Tags,
    title: "Tags you can invalidate",
    body: "Browse provided tags, see exactly which cache entries each one touches, and invalidate one by hand while you debug.",
  },
  {
    icon: ListTree,
    title: "A real request timeline",
    body: "Every query and mutation, in order, with how long it took. Pause it, filter it, clear it — like a network tab for your cache.",
  },
];

function Home() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <span className="font-mono text-xs tracking-[0.2em] text-amber uppercase">
          TanStack DevTools plugin
        </span>
        <h1 className="mt-4 max-w-2xl text-4xl leading-[1.1] font-semibold text-balance text-paper sm:text-5xl">
          RTK Query has a cache. Now you can actually see it.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
          Live status badges, tag-based invalidation, and a request timeline — right inside TanStack
          DevTools. No more digging through the Redux action log to guess what's cached.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-panel-line bg-panel px-4 py-2.5 font-mono text-sm text-paper">
            <span className="text-mist select-none">$</span>
            pnpm add rtk-query-devtools
            <CopyButton text="pnpm add rtk-query-devtools" />
          </div>
          <Link
            to="/examples"
            className="flex items-center gap-1.5 font-mono text-sm text-paper transition-colors hover:text-amber"
          >
            See it running
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-14">
          <StoreProvider fallback={<DormantBoard />}>
            <FlipBoard />
          </StoreProvider>
          <p className="mt-3 font-mono text-xs text-mist">
            ↑ live — actually running RTK Query on this page
          </p>
        </div>
      </section>

      <section className="border-t border-panel-line">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-3 sm:py-20">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <feature.icon size={18} className="text-amber" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-semibold text-paper">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mist">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-panel-line">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-sm font-semibold text-paper">Wire it up in two lines</h2>
          <p className="mt-2 max-w-lg text-sm text-mist">
            Add the middleware to your store, then register the plugin. No provider, no config file.
          </p>
          <CodeBlock className="mt-6" />
        </div>
      </section>
    </main>
  );
}

function CodeBlock({ className }: { className?: string }) {
  return (
    <pre
      className={`overflow-x-auto rounded-xl border border-panel-line bg-panel p-5 font-mono text-sm leading-relaxed text-paper ${className ?? ""}`}
    >
      <code>
        <span className="text-mist">{"// store.ts"}</span>
        {"\n"}
        <span className="text-amber">const</span> devtools = createRtkQueryDevtools({"{"} apis:
        [api] {"}"}){"\n\n"}
        configureStore({"{"}
        {"\n  "}middleware: (getDefaultMiddleware) {"=>"}
        {"\n    "}getDefaultMiddleware().concat(api.middleware, devtools.middleware),
        {"\n"}
        {"}"}){"\n\n"}
        <span className="text-mist">{"// App.tsx"}</span>
        {"\n"}
        {"<TanStackDevtools "}plugins={"{"}[createRtkQueryDevtoolsPlugin()]{"}"} {"/>"}
      </code>
    </pre>
  );
}
