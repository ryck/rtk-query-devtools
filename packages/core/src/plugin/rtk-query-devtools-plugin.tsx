import clsx from "clsx";
import { useEffect, useId, useMemo, useState } from "react";
import { defaultRegistry, type DevtoolsRegistry } from "../registry";
import {
  selectApiHealth,
  selectEnvironment,
  selectMutationEntries,
  selectQueryEntries,
  selectTagGroups,
} from "../selectors";
import type { DerivedQueryStatus, TagDescription } from "../types";
import { EmptyState } from "./components/empty-state";
import { MutationsTab } from "./components/mutations-tab";
import { QueriesTab } from "./components/queries-tab";
import { StatusSummary } from "./components/status-summary";
import { TagsTab } from "./components/tags-tab";
import { TimelineTab } from "./components/timeline-tab";
import { enumCodec, setCodec, usePersistentState } from "./hooks/use-persistent-state";
import { useRtkQueryDevtoolsState } from "./hooks/use-rtkq-state";
import { SpinKeyframes } from "./spin-keyframes";
import "./styles.css";
import { getClasses, resolveThemeMode } from "./theme";

export interface RtkQueryDevtoolsPluginProps {
  theme?: "light" | "dark";
  /** Overrides the module-level registry — mainly for tests or multi-store apps. */
  devtoolsRegistry?: DevtoolsRegistry;
}

const TAB_IDS = ["queries", "mutations", "tags", "timeline"] as const;
type TabId = (typeof TAB_IDS)[number];

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "queries", label: "Queries" },
  { id: "mutations", label: "Mutations" },
  { id: "tags", label: "Tags" },
  { id: "timeline", label: "Timeline" },
];

/** Guards restored status filters against names a previous build may have used. */
const STATUS_FILTER_VALUES: ReadonlyArray<DerivedQueryStatus> = [
  "fresh",
  "fetching",
  "error",
  "inactive",
  "uninitialized",
];

export function RtkQueryDevtoolsPlugin({ theme, devtoolsRegistry }: RtkQueryDevtoolsPluginProps) {
  const registry = devtoolsRegistry ?? defaultRegistry;
  // Namespaced per instance so the tab/panel ids stay unique if a host ever
  // mounts two panels (e.g. one per store).
  const idPrefix = useId();
  // Subscribes to registry changes — re-renders on every throttled version
  // bump, which is also what keeps every child tab below up to date.
  const { state, reducerPaths } = useRtkQueryDevtoolsState(registry);
  const classes = getClasses(resolveThemeMode(theme));

  const [activeTab, setActiveTab] = usePersistentState<TabId>(
    "activeTab",
    "queries",
    enumCodec(TAB_IDS),
  );
  // Persisted, but the effect below still validates it against the APIs this
  // store actually has — a remembered path may be gone on the next reload.
  const [activeApi, setActiveApi] = usePersistentState<string>("activeApi", "");
  const [selectedQueryKey, setSelectedQueryKey] = useState<string | undefined>(undefined);
  const [tagFocus, setTagFocus] = useState<TagDescription | undefined>(undefined);
  const [activeStatuses, setActiveStatuses] = usePersistentState<Set<DerivedQueryStatus>>(
    "queries.statusFilter",
    new Set(),
    setCodec(STATUS_FILTER_VALUES),
  );

  useEffect(() => {
    const first = reducerPaths[0];
    if (first && (!activeApi || !reducerPaths.includes(activeApi))) {
      setActiveApi(first);
    }
    // `setActiveApi` is React's own `useState` setter and so is stable, but
    // that's invisible to the lint rule through a custom hook — listing it is
    // free and keeps the rule honest.
  }, [reducerPaths, activeApi, setActiveApi]);

  // Lifted out of QueriesTab so the status counts can be rendered in the
  // shared tab row above it, right next to Queries/Mutations/Tags/Timeline.
  const queryEntries = useMemo(
    () =>
      activeApi
        ? selectQueryEntries(state, activeApi, (name) => registry.getEndpointType(activeApi, name))
        : [],
    [state, activeApi, registry],
  );
  // Global RTK Query state, but read through the active api's config slice —
  // every api mirrors the same value.
  const environment = useMemo(
    () => (activeApi ? selectEnvironment(state, activeApi) : { online: true, focused: true }),
    [state, activeApi],
  );
  const apiHealth = useMemo(
    () => (activeApi ? selectApiHealth(state, activeApi) : undefined),
    [state, activeApi],
  );

  // Live counts beside each tab label. The timeline is read unmemoized on
  // purpose — see the note in timeline-tab; every render already implies it
  // may have changed.
  const tabCounts: Record<TabId, number> = {
    queries: queryEntries.length,
    mutations: activeApi ? selectMutationEntries(state, activeApi).length : 0,
    tags: activeApi ? selectTagGroups(state, activeApi).length : 0,
    timeline: registry.getTimeline().filter((e) => e.reducerPath === activeApi).length,
  };
  const statusCounts = useMemo(() => {
    const counts: Record<DerivedQueryStatus, number> = {
      fresh: 0,
      fetching: 0,
      error: 0,
      inactive: 0,
      uninitialized: 0,
    };
    for (const entry of queryEntries) counts[entry.derivedStatus]++;
    return counts;
  }, [queryEntries]);
  const toggleStatus = (status: DerivedQueryStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const navigateToQuery = (queryCacheKey: string) => {
    setActiveTab("queries");
    setSelectedQueryKey(queryCacheKey);
  };

  const navigateToTag = (tag: TagDescription) => {
    setActiveTab("tags");
    setTagFocus(tag);
  };

  if (reducerPaths.length === 0) {
    return (
      <div
        className={clsx(
          "rtkq:flex rtkq:h-full rtkq:w-full rtkq:flex-col rtkq:font-sans",
          classes.root,
        )}
      >
        <SpinKeyframes />
        <EmptyState
          classes={classes}
          title="No RTK Query APIs detected"
          subtitle="Add the devtools middleware to your store: middleware => middleware().concat(api.middleware, rtkqDevtools.middleware)"
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rtkq:flex rtkq:h-full rtkq:w-full rtkq:flex-col rtkq:font-sans",
        classes.root,
      )}
    >
      <SpinKeyframes />

      <div
        className={clsx(
          "rtkq:flex rtkq:shrink-0 rtkq:items-center rtkq:justify-between rtkq:gap-2 rtkq:border-b rtkq:pr-2",
          classes.border,
        )}
      >
        <div
          role="tablist"
          aria-label="RTK Query devtools sections"
          className="rtkq:flex rtkq:shrink-0"
        >
          {TABS.map((tab) => {
            const count = tabCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${idPrefix}-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`${idPrefix}-tabpanel`}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "rtkq:-mb-px rtkq:cursor-pointer rtkq:border-b-2 rtkq:bg-transparent rtkq:px-3 rtkq:py-2 rtkq:text-xs rtkq:font-semibold",
                  activeTab === tab.id
                    ? clsx(classes.accent, classes.accentBorder)
                    : clsx("rtkq:border-transparent", classes.textMuted),
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={clsx("rtkq:ml-1 rtkq:font-normal", classes.textDimmed)}>
                    {count > 999 ? "999+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "queries" && (
          <StatusSummary
            classes={classes}
            counts={statusCounts}
            activeStatuses={activeStatuses}
            onToggle={toggleStatus}
          />
        )}
      </div>

      <div
        role="tabpanel"
        id={`${idPrefix}-tabpanel`}
        aria-labelledby={`${idPrefix}-tab-${activeTab}`}
        className="rtkq:min-h-0 rtkq:flex-1"
      >
        {activeTab === "queries" && (
          <QueriesTab
            classes={classes}
            registry={registry}
            entries={queryEntries}
            reducerPaths={reducerPaths}
            activeApi={activeApi}
            onApiChange={setActiveApi}
            onSelectTag={navigateToTag}
            selectedKey={selectedQueryKey}
            onSelectKey={setSelectedQueryKey}
            activeStatuses={activeStatuses}
            environment={environment}
            apiHealth={apiHealth}
          />
        )}
        {activeTab === "mutations" && (
          <MutationsTab
            classes={classes}
            registry={registry}
            state={state}
            reducerPaths={reducerPaths}
            activeApi={activeApi}
            onApiChange={setActiveApi}
          />
        )}
        {activeTab === "tags" && (
          <TagsTab
            key={tagFocus ? `${tagFocus.type}:${tagFocus.id ?? ""}` : "tags"}
            classes={classes}
            registry={registry}
            state={state}
            reducerPaths={reducerPaths}
            activeApi={activeApi}
            onApiChange={setActiveApi}
            onNavigateToQuery={navigateToQuery}
            initialSearch={tagFocus?.type}
          />
        )}
        {activeTab === "timeline" && (
          <TimelineTab
            classes={classes}
            registry={registry}
            reducerPaths={reducerPaths}
            activeApi={activeApi}
            onApiChange={setActiveApi}
          />
        )}
      </div>
    </div>
  );
}
