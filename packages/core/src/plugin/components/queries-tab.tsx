import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
import { invalidateTags, refetch, removeQueryEntry, resetApiState } from "../../actions";
import type { DevtoolsRegistry } from "../../registry";
import type { DerivedQueryStatus, QueryEntry, TagDescription } from "../../types";
import { formatDuration, formatQueryCacheKey, formatRelativeTime } from "../format";
import type { RtkQueryDevtoolsClasses } from "../theme";
import { EmptyState } from "./empty-state";
import { EntryDetail } from "./entry-detail";
import { EntryRow } from "./entry-row";
import { PollingPill, StatusBadge } from "./status-badge";
import { Toolbar, ToolbarButton } from "./toolbar";
import type { SelectOption } from "./toolbar";

const STATUS_SEVERITY: Record<DerivedQueryStatus, number> = {
  error: 0,
  fetching: 1,
  fresh: 2,
  inactive: 3,
  uninitialized: 4,
};

type SortKey = "updated" | "endpoint" | "status";

export interface QueriesTabProps {
  classes: RtkQueryDevtoolsClasses;
  registry: DevtoolsRegistry;
  entries: QueryEntry[];
  reducerPaths: string[];
  activeApi: string;
  onApiChange: (reducerPath: string) => void;
  onSelectTag: (tag: TagDescription) => void;
  selectedKey: string | undefined;
  onSelectKey: (key: string | undefined) => void;
  activeStatuses: Set<DerivedQueryStatus>;
}

export function QueriesTab({
  classes,
  registry,
  entries,
  reducerPaths,
  activeApi,
  onApiChange,
  onSelectTag,
  selectedKey,
  onSelectKey,
  activeStatuses,
}: QueriesTabProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.endpointName.toLowerCase().includes(q) || e.queryCacheKey.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const filtered = useMemo(() => {
    if (activeStatuses.size === 0) return searched;
    return searched.filter((e) => activeStatuses.has(e.derivedStatus));
  }, [searched, activeStatuses]);

  const sorted = useMemo(
    () =>
      filtered.toSorted((a, b) => {
        if (sort === "endpoint") {
          return a.queryCacheKey.localeCompare(b.queryCacheKey);
        }
        if (sort === "status") {
          return STATUS_SEVERITY[a.derivedStatus] - STATUS_SEVERITY[b.derivedStatus];
        }
        const aTime = a.fulfilledTimeStamp ?? a.startedTimeStamp ?? 0;
        const bTime = b.fulfilledTimeStamp ?? b.startedTimeStamp ?? 0;
        return bTime - aTime;
      }),
    [filtered, sort],
  );

  const selected = sorted.find((e) => e.queryCacheKey === selectedKey);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 46,
    overscan: 10,
  });

  const apiOptions: SelectOption[] = reducerPaths.map((p) => ({ value: p, label: p }));

  return (
    <div className="rtkq:flex rtkq:h-full rtkq:flex-col">
      <Toolbar
        classes={classes}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search endpoint or args…"
        apiOptions={apiOptions}
        activeApi={activeApi}
        onApiChange={onApiChange}
        sortOptions={
          [
            { value: "updated", label: "Sort: updated" },
            { value: "endpoint", label: "Sort: endpoint" },
            { value: "status", label: "Sort: status" },
          ] satisfies SelectOption[]
        }
        sortValue={sort}
        onSortChange={(v) => setSort(v as SortKey)}
        actions={
          <ToolbarButton
            classes={classes}
            variant="danger"
            onClick={() => {
              if (window.confirm("Reset API state? This clears every cached query and mutation.")) {
                resetApiState(registry, activeApi);
              }
            }}
          >
            Reset API state
          </ToolbarButton>
        }
      />

      <div className="rtkq:flex rtkq:flex-1 rtkq:min-h-0">
        <div ref={parentRef} className="rtkq:flex-1 rtkq:min-w-0 rtkq:overflow-y-auto">
          {sorted.length === 0 ? (
            <EmptyState
              classes={classes}
              title="No queries yet"
              subtitle="Cached queries will appear here once your app dispatches them."
            />
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((row) => {
                const entry = sorted[row.index];
                if (!entry) return null;
                return (
                  <div
                    key={entry.queryCacheKey}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${row.start}px)`,
                    }}
                  >
                    <QueryRow
                      classes={classes}
                      entry={entry}
                      selected={entry.queryCacheKey === selectedKey}
                      onSelect={() => onSelectKey(entry.queryCacheKey)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selected && (
          <div
            className={clsx(
              "rtkq:w-[380px] rtkq:shrink-0 rtkq:border-l rtkq:overflow-hidden",
              classes.border,
            )}
          >
            <QueryDetail
              classes={classes}
              registry={registry}
              entry={selected}
              onSelectTag={onSelectTag}
              onRemoved={() => onSelectKey(undefined)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function QueryRow({
  classes,
  entry,
  selected,
  onSelect,
}: {
  classes: RtkQueryDevtoolsClasses;
  entry: QueryEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <EntryRow
      classes={classes}
      selected={selected}
      onSelect={onSelect}
      statusNode={<StatusBadge status={entry.derivedStatus} classes={classes} />}
      title={entry.endpointName}
      subtitle={formatQueryCacheKey(entry.queryCacheKey, entry.originalArgs)}
      metaRight={
        <div className="rtkq:flex rtkq:items-center rtkq:gap-1.5 rtkq:shrink-0">
          {entry.isPolling && <PollingPill classes={classes} />}
          <span className={clsx("rtkq:text-[10px]", classes.textMuted)}>
            {entry.subscriberCount} subs
          </span>
          {entry.fulfilledTimeStamp !== undefined && (
            <span className={clsx("rtkq:text-[10px] rtkq:tabular-nums", classes.textDimmed)}>
              {formatRelativeTime(entry.fulfilledTimeStamp)}
            </span>
          )}
        </div>
      }
    />
  );
}

function QueryDetail({
  classes,
  registry,
  entry,
  onSelectTag,
  onRemoved,
}: {
  classes: RtkQueryDevtoolsClasses;
  registry: DevtoolsRegistry;
  entry: QueryEntry;
  onSelectTag: (tag: TagDescription) => void;
  onRemoved: () => void;
}) {
  const canRefetch = !!registry.getApi(entry.reducerPath);
  return (
    <EntryDetail
      classes={classes}
      heading={formatQueryCacheKey(entry.queryCacheKey, entry.originalArgs)}
      statusNode={<StatusBadge status={entry.derivedStatus} classes={classes} />}
      metaRows={[
        { label: "Endpoint", value: entry.endpointName },
        { label: "Type", value: entry.type },
        { label: "Subscribers", value: `${entry.subscriberCount} (may lag up to 500ms)` },
        {
          label: "Started",
          value: entry.startedTimeStamp
            ? new Date(entry.startedTimeStamp).toLocaleTimeString()
            : "—",
        },
        {
          label: "Fulfilled",
          value: entry.fulfilledTimeStamp
            ? `${new Date(entry.fulfilledTimeStamp).toLocaleTimeString()} (${formatRelativeTime(entry.fulfilledTimeStamp)})`
            : "—",
        },
        {
          label: "Duration",
          value:
            entry.startedTimeStamp !== undefined && entry.fulfilledTimeStamp !== undefined
              ? formatDuration(entry.fulfilledTimeStamp - entry.startedTimeStamp)
              : "—",
        },
      ]}
      tags={entry.providedTags}
      onTagClick={onSelectTag}
      jsonSections={[
        { label: "Arguments", value: entry.originalArgs },
        { label: "Data", value: entry.data },
        ...(entry.error !== undefined ? [{ label: "Error", value: entry.error }] : []),
        // The whole derived entry, mirroring TanStack's "Query Explorer" — the
        // meta rows above are a curated view, and this is the escape hatch for
        // anything they leave out (raw `status`, `requestId`, tag shapes).
        { label: "Query entry", value: entry },
      ]}
      actions={
        <>
          <ToolbarButton
            classes={classes}
            disabled={!canRefetch}
            title={
              canRefetch
                ? undefined
                : "Pass `apis: [api]` to createRtkQueryDevtools() to enable Refetch"
            }
            onClick={() =>
              refetch(registry, entry.reducerPath, entry.endpointName, entry.originalArgs)
            }
          >
            Refetch
          </ToolbarButton>
          {entry.providedTags.length > 0 && (
            <ToolbarButton
              classes={classes}
              onClick={() => invalidateTags(registry, entry.reducerPath, entry.providedTags)}
            >
              Invalidate tags
            </ToolbarButton>
          )}
          <ToolbarButton
            classes={classes}
            variant="danger"
            onClick={() => {
              removeQueryEntry(registry, entry.reducerPath, entry.queryCacheKey);
              onRemoved();
            }}
          >
            Remove
          </ToolbarButton>
        </>
      }
    />
  );
}
