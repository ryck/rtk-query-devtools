import { createFileRoute } from "@tanstack/react-router";
import { C, Feature, FeatureGroup } from "@/components/feature";

const TITLE = "Features | RTK Query Devtools";
const DESCRIPTION =
  "Every feature of the RTK Query devtools panel, with screenshots: cache status, tags and invalidation, a request timeline with per-endpoint timings, a data explorer, and offline/focus simulation.";
const URL = "https://rtk-query-devtools.ryck.dev/features";

export const Route = createFileRoute("/features")({
  component: Features,
  // Overrides the root defaults. Without its own canonical, this page would
  // claim to be a duplicate of the homepage.
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

const SECTIONS = [
  { id: "queries", label: "Queries" },
  { id: "data", label: "Data explorer" },
  { id: "mutations", label: "Mutations" },
  { id: "tags", label: "Tags" },
  { id: "timeline", label: "Timeline" },
  { id: "environment", label: "Environment & config" },
  { id: "built-for-real-apps", label: "Built for real apps" },
];

function Features() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <span className="font-mono text-xs tracking-[0.2em] text-amber uppercase">Features</span>
      <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-semibold text-balance text-paper sm:text-4xl">
        Everything the panel can do.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-mist">
        Four tabs, a data explorer, and a set of controls for poking at the cache while you debug.
        Every screenshot below is captured from the real panel running against the demo app, not a
        mockup, so what you see here is what you get.
      </p>

      <nav aria-label="Sections" className="mt-8 flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-panel-line px-3 py-1 font-mono text-xs text-mist transition-colors hover:border-mist hover:text-paper"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="mt-16 flex flex-col gap-16">
        <FeatureGroup
          id="queries"
          eyebrow="Queries"
          title="Every cache entry, with its real status"
          lead="The default tab. One row per cache entry, updated live as your app runs."
        >
          <Feature
            title="Status at a glance"
            shot="queries-list"
            alt="The Queries tab listing four cache entries with fresh, error, and inactive badges"
          >
            Each entry gets a derived status: <C>fresh</C>, <C>fetching</C>, <C>error</C>,{" "}
            <C>inactive</C>, or <C>uninitialized</C>, colour-coded, with the endpoint name, the
            serialized cache key, subscriber count, and when it last updated. There is deliberately
            no <C>stale</C> badge: RTK Query has no staleness model, it evicts via{" "}
            <C>keepUnusedDataFor</C>. An entry that is fulfilled with zero subscribers reads as{" "}
            <C>inactive</C>, which is the state that actually matters, because it's about to be
            collected.
          </Feature>

          <Feature
            title="Filter by status"
            shot="status-filter"
            alt="Status pills with Fresh selected and the other statuses dimmed"
          >
            The counts in the header are also the filter. Click any status to narrow the list;
            unselected pills dim so it's obvious a filter is on. They collapse to dots and counts
            when the panel is narrow.
          </Feature>

          <Feature
            title="Fuzzy search, or a regular expression"
            shot="search-regex"
            alt="The search box in regex mode showing an invalid pattern marked in red"
          >
            Search is fuzzy by default, so <C>lpf</C> finds <C>listPostsFlaky</C>. Toggle <C>.*</C>{" "}
            for regular expressions when you need precision. A pattern that doesn't compile leaves
            the list unfiltered and marks the toggle instead of blanking the panel while you're
            mid-keystroke.
          </Feature>

          <Feature title="Sort, in either direction">
            Order by last updated, endpoint name, or status severity, ascending or descending. The
            default, most recently updated first, is usually what you want when something just
            changed.
          </Feature>

          <Feature
            title="The detail pane"
            shot="query-detail"
            alt="A selected query showing Refetch, Invalidate tags and Remove actions above its metadata"
          >
            Select an entry for its endpoint, type (<C>query</C> or <C>infinitequery</C>),
            subscriber count, timings, and duration. Provided tags render as chips that jump
            straight to the Tags tab. Subscriber counts carry a note that they can lag ~500ms:
            that's RTK Query syncing subscriptions on a throttled timer, not a bug in the panel.
          </Feature>

          <Feature
            title="Full request history per entry"
            shot="request-history"
            alt="A Requests list showing four fulfilled requests with durations and forced markers"
          >
            A cache entry only remembers its <em>latest</em> request. This lists every request that
            targeted it: each refetch, its outcome, duration, and whether it was forced. It's how
            you answer "has this refetched, how often, and did any of them fail?"
          </Feature>

          <Feature title="Act on the cache">
            <C>Refetch</C> forces a fresh request. <C>Invalidate tags</C> invalidates everything the
            entry provides. <C>Remove</C> drops it. <C>Reset API state</C> clears the whole cache,
            behind a confirmation. Refetch needs the real api object, so it's disabled with an
            explanation if you didn't pass <C>apis</C>.
          </Feature>
        </FeatureGroup>

        <FeatureGroup
          id="data"
          eyebrow="Data explorer"
          title="Read your cached data without hanging the panel"
          lead="Used everywhere a value is shown: arguments, data, errors, and the raw entry."
        >
          <Feature
            title="Collapsible, copyable, lazy"
            shot="data-explorer"
            alt="An expanded JSON tree of cached post data with copy buttons on each node"
          >
            The tree never serializes a whole value up front, which is the usual way a devtool
            freezes on a large cache. Every node has a copy button that serializes on demand. Large
            collections split into chunks of 100 rather than rendering fifty thousand rows.
          </Feature>

          <Feature title="Handles what real data actually contains">
            <C>Map</C>, <C>Set</C>, <C>BigInt</C>, <C>Date</C>, functions, symbols and circular
            references all render sensibly. <C>Error</C> instances show name, message and stack.
            Without that they'd appear as an empty <C>{"{}"}</C>, since those fields aren't
            enumerable.
          </Feature>

          <Feature title="The raw entry, when the summary isn't enough">
            Each detail pane ends with the complete derived entry, so nothing is hidden behind the
            curated rows above it, including the true cache key, raw status, and request id.
          </Feature>
        </FeatureGroup>

        <FeatureGroup
          id="mutations"
          eyebrow="Mutations"
          title="What you sent, and what came back"
          lead="Keyed by request id, or by your fixedCacheKey when you set one."
        >
          <Feature
            title="Including the arguments"
            shot="mutations"
            alt="A selected mutation showing its arguments, timings and Remove action"
          >
            RTK Query doesn't keep mutation arguments in state, so the panel recovers them by
            correlating against the timeline. You get the arguments, the result or error, timings,
            duration, and a <C>Remove</C> action. Same search and sort controls as Queries.
          </Feature>
        </FeatureGroup>

        <FeatureGroup
          id="tags"
          eyebrow="Tags"
          title="Which tags exist, and what they'd invalidate"
          lead="The invalidation graph RTK Query maintains internally, made visible."
        >
          <Feature
            title="Grouped by type, expandable to cache keys"
            shot="tags"
            alt="The Tags tab showing the Post tag type expanded into ids with invalidate buttons"
          >
            Tags group by type, then by id, and expand to the exact cache entries each one touches.
            Click a cache key to jump to it in Queries. Invalidate a single id or the whole type
            from here. Tags provided without an id show as <C>none</C> rather than RTK's internal
            sentinel.
          </Feature>
        </FeatureGroup>

        <FeatureGroup
          id="timeline"
          eyebrow="Timeline"
          title="A network tab for your cache"
          lead="Every query and mutation lifecycle, in order, with timings."
        >
          <Feature
            title="The event log"
            shot="timeline"
            alt="The Timeline tab listing fulfilled and skipped requests with durations"
          >
            Each entry shows the endpoint, whether it was a query, mutation or infinite query, its
            outcome and how long it took. Deduped requests are marked <C>skipped</C> rather than
            counted as failures. Pause capture when you want a stable view, or clear it. The buffer
            holds the last 500 events by default, configurable via <C>maxTimelineEntries</C>.
          </Feature>

          <Feature
            title="Per-endpoint timings"
            shot="timings"
            alt="A timings table showing fastest, median, average and slowest per endpoint, slowest first"
          >
            Fastest, median, average and slowest per endpoint, ordered slowest first, with error
            counts. Cache state can't tell you this, because it only holds the latest request's
            timestamps, so "which endpoint is slow, and how often does it fail?" is only answerable
            from the log. Skipped requests are excluded so they can't drag the numbers toward zero.
          </Feature>
        </FeatureGroup>

        <FeatureGroup
          id="environment"
          eyebrow="Environment & config"
          title="Poke at the things that are hard to reproduce"
          lead="Network conditions and configuration that normally require changing your app."
        >
          <Feature
            title="Simulate offline and unfocused"
            shot="environment"
            alt="The Online and Focused toggles switched into their amber Offline and Unfocused states"
          >
            Toggle offline or blur the tab without touching your network or your code. These
            dispatch RTK Query's own global actions, so <C>refetchOnReconnect</C> and{" "}
            <C>refetchOnFocus</C> fire for real when you switch back. They aren't cosmetic flags.
          </Feature>

          <Feature
            title="The config nobody surfaces"
            shot="api-config"
            alt="The expanded API config strip showing keepUnusedDataFor, invalidationBehavior and refetch flags"
          >
            <C>keepUnusedDataFor</C>, <C>invalidationBehavior</C>, and the three <C>refetchOn*</C>{" "}
            flags, plus a count of cached queries, mutations and subscribers. These explain cache
            behaviour that otherwise looks arbitrary. Collapsed by default so it costs no space.
          </Feature>

          <Feature title="A warning for a bug you can't otherwise see">
            If RTK Query reports <C>middlewareRegistered: "conflict"</C>, meaning the same api's
            middleware registered twice, usually a duplicated module or bad HMR, the panel shows a
            persistent warning. Caching and invalidation misbehave silently in that state, and no
            other tool reports it.
          </Feature>
        </FeatureGroup>

        <FeatureGroup
          id="built-for-real-apps"
          eyebrow="Built for real apps"
          title="The parts you only notice when they're missing"
          lead="Behaviour that matters once your cache is bigger than a demo."
        >
          <Feature title="Multiple APIs, discovered automatically">
            Every RTK Query api in your store is found by inspecting state, with no configuration.
            An api selector appears in each tab once there's more than one.
          </Feature>

          <Feature title="Virtualized lists">
            Queries, mutations and the timeline are all virtualized, so hundreds of cache entries
            stay responsive.
          </Feature>

          <Feature title="It remembers where you were">
            Active tab, filters, search terms, sort order and expanded sections persist across
            reloads, namespaced so they can't collide with your app's own storage.
          </Feature>

          <Feature title="Gone in production">
            Both the middleware and the plugin become no-ops when{" "}
            <C>process.env.NODE_ENV === "production"</C>, so bundlers drop the panel entirely.
            Leaving them wired into your store and app is safe.
          </Feature>

          <Feature title="Light and dark, and keyboard-navigable">
            The panel follows the devtools shell's theme. Tabs are wired with proper roles and
            labelling, toggles expose their pressed state, and the data explorer is operable from
            the keyboard.
          </Feature>

          <Feature title="Works across RTK Query 2.x">
            Supports <C>@reduxjs/toolkit</C> from <C>2.0.0</C> up, including the internal change in{" "}
            <C>2.6.2</C> that reshaped the tag index. It's handled transparently, so the panel
            doesn't care which side of that line you're on.
          </Feature>
        </FeatureGroup>
      </div>
    </main>
  );
}
