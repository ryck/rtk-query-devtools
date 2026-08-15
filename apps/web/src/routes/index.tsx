import { Link, createFileRoute } from "@tanstack/react-router";
import { Gamepad2, ListTree, Radio, Tags } from "lucide-react";
import { DormantBoard, FlipBoard } from "@/components/flip-board";
import { StoreProvider } from "@/components/store-provider";
import { Button } from "@/components/ui/button";
import { InstallCommand, MultiFileCodeBlock } from "@/components/ui/code-block";

export const Route = createFileRoute("/")({
  component: Home,
  // Title and description are inherited from the root; only the canonical has
  // to be per-route (see the note in __root.tsx).
  head: () => ({
    links: [{ rel: "canonical", href: "https://rtk-query-devtools.ryck.dev/" }],
  }),
});

const FEATURES = [
  {
    icon: Radio,
    title: "Status at a glance",
    body: "Fetching, fresh, error, inactive: every cache entry, labeled. No more inferring status from a stream of dispatched actions.",
  },
  {
    icon: Tags,
    title: "Tags you can invalidate",
    body: "Browse provided tags, see exactly which cache entries each one touches, and invalidate one by hand while you debug.",
  },
  {
    icon: ListTree,
    title: "A real request timeline",
    body: "Every query and mutation, in order, with how long it took. Pause it, filter it, clear it, like a network tab for your cache.",
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
          Live status badges, tag-based invalidation, and a request timeline, right inside TanStack
          DevTools. No more digging through the Redux action log to guess what's cached.
        </p>
        {/*
          Base UI's docs say a link should be styled directly rather than
          rendered through Button, because Button imposes button semantics.
          The two props below are what make the component safe to use here
          anyway: `nativeButton={false}` is the documented setting for a
          rendered element that isn't a <button> (it silences the warning),
          and the explicit `role` overrides the `role="button"` Base UI
          applies in that case, so this stays a link to assistive tech.
        */}
        <Button
          size="lg"
          className="mt-4"
          nativeButton={false}
          role="link"
          render={<Link to="/examples" />}
        >
          <Gamepad2 aria-hidden="true" />
          Playground
        </Button>

        <InstallCommand className="mt-8" packageName="rtk-query-devtools" />

        <div className="mt-14">
          <StoreProvider fallback={<DormantBoard />}>
            <FlipBoard />
          </StoreProvider>
          <p className="mt-3 font-mono text-xs text-mist">
            ↑ live, actually running RTK Query on this page
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
          <MultiFileCodeBlock className="mt-6" files={WIRE_UP_FILES} bodyClassName="bg-panel" />
        </div>
      </section>
    </main>
  );
}

/**
 * Two tabs rather than one blob: the setup genuinely spans two files, which
 * the previous single snippet could only convey with `// store.ts` and
 * `// App.tsx` comments.
 *
 * Kept deliberately in step with the package README's usage section, including
 * the `rtkqDevtools` name, so copying from either lands you in the same place.
 * `highlightLines` marks the lines this package actually adds, which is what
 * makes the "two lines" claim above checkable. Module-level so the arrays keep
 * a stable identity (see the note on `FileEntry`).
 */
const WIRE_UP_FILES = [
  {
    filename: "store.ts",
    language: "ts",
    highlightLines: [2, 5, 10],
    code: `import { configureStore } from "@reduxjs/toolkit";
import { createRtkQueryDevtools } from "rtk-query-devtools";
import { api } from "./api";

export const rtkqDevtools = createRtkQueryDevtools({ apis: [api] });

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, rtkqDevtools.middleware),
});`,
  },
  {
    filename: "App.tsx",
    language: "tsx",
    highlightLines: [2, 8],
    code: `import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRtkQueryDevtoolsPlugin } from "rtk-query-devtools";

export function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools plugins={[createRtkQueryDevtoolsPlugin()]} />
    </>
  );
}`,
  },
];
