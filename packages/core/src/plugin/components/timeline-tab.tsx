import { useVirtualizer } from "@tanstack/react-virtual";
import { Pause, Play, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { DevtoolsRegistry } from "../../registry";
import type { EndpointType, TimelineEvent } from "../../types";
import { formatDuration, formatTimestamp } from "../format";
import { useDetailPanelWidth } from "../hooks/use-detail-panel-width";
import { enumCodec, sortOrderCodec, usePersistentState } from "../hooks/use-persistent-state";
import { createSearchMatcher, SEARCH_MODES, type SearchMode } from "../search";
import { computeTimelineStats } from "../stats";
import type { RtkQueryDevtoolsClasses } from "../theme";
import { EmptyState } from "./empty-state";
import { EntryDetail } from "./entry-detail";
import { EntryRow } from "./entry-row";
import { OutcomeBadge } from "./outcome-badge";
import { ResizableDivider } from "./resizable-divider";
import { TimelineStatsPanel } from "./timeline-stats";
import type { SelectOption, SortOrder } from "./toolbar";
import { Toolbar, ToolbarButton } from "./toolbar";

const KIND_LABEL: Record<EndpointType, string> = {
  query: "query",
  mutation: "mutation",
  infinitequery: "infinite query",
};

export interface TimelineTabProps {
  classes: RtkQueryDevtoolsClasses;
  registry: DevtoolsRegistry;
  reducerPaths: string[];
  activeApi: string;
  onApiChange: (reducerPath: string) => void;
}

export function TimelineTab({
  classes,
  registry,
  reducerPaths,
  activeApi,
  onApiChange,
}: TimelineTabProps) {
  const [search, setSearch] = usePersistentState("timeline.search", "");
  // The timeline is recorded oldest-first, so descending is newest-first, the
  // sensible default for a live event log.
  const [sortOrder, setSortOrder] = usePersistentState<SortOrder>(
    "timeline.sortOrder",
    -1,
    sortOrderCodec,
  );
  const [searchMode, setSearchMode] = usePersistentState<SearchMode>(
    "timeline.searchMode",
    "fuzzy",
    enumCodec(SEARCH_MODES),
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  // The registry's `version` bump is what re-renders this component (via the
  // panel root's useSyncExternalStore). `getTimeline()` always returns a
  // fresh copy, so there's nothing worth memoizing here; every render already
  // means the timeline may have changed.
  const allEvents = registry.getTimeline().filter((e) => e.reducerPath === activeApi);
  // Deliberately computed over *all* events for the api rather than the
  // filtered list: the summary describes the api, and would otherwise shift
  // under you as you type in the search box.
  const stats = computeTimelineStats(allEvents);
  const matcher = createSearchMatcher(search, searchMode);
  const filtered = allEvents.filter((e) => matcher.matches(e.endpointName));
  const sorted = sortOrder === -1 ? filtered.toReversed() : filtered;
  const selected = sorted.find((e) => e.id === selectedId);
  const paused = registry.isTimelinePaused();

  const parentRef = useRef<HTMLDivElement>(null);
  const { width: detailPanelWidth, resizeBy, reset: resetWidth } = useDetailPanelWidth();
  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const apiOptions: SelectOption[] = reducerPaths.map((p) => ({ value: p, label: p }));

  return (
    <div className="rtkq:flex rtkq:h-full rtkq:flex-col">
      <Toolbar
        classes={classes}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search endpoint…"
        apiOptions={apiOptions}
        activeApi={activeApi}
        onApiChange={onApiChange}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
        searchInvalid={matcher.invalid}
        actions={
          <>
            <ToolbarButton
              classes={classes}
              icon={paused ? Play : Pause}
              onClick={() => registry.setTimelinePaused(!paused)}
            >
              {paused ? "Resume" : "Pause"}
            </ToolbarButton>
            <ToolbarButton
              classes={classes}
              icon={Trash2}
              variant="danger"
              onClick={() => registry.clearTimeline()}
            >
              Clear
            </ToolbarButton>
          </>
        }
      />

      <TimelineStatsPanel classes={classes} stats={stats} />

      <div className="rtkq:flex rtkq:flex-1 rtkq:min-h-0">
        <div ref={parentRef} className="rtkq:flex-1 rtkq:min-w-0 rtkq:overflow-y-auto">
          {sorted.length === 0 ? (
            <EmptyState
              classes={classes}
              title="No requests captured yet"
              subtitle={
                paused ? "Capture is paused." : "Query and mutation lifecycles will appear here."
              }
            />
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((row) => {
                const event = sorted[row.index];
                if (!event) return null;
                return (
                  <div
                    key={event.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${row.start}px)`,
                    }}
                  >
                    <TimelineRow
                      classes={classes}
                      event={event}
                      selected={event.id === selectedId}
                      onSelect={() => setSelectedId(event.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selected && (
          <>
            <ResizableDivider classes={classes} onResize={resizeBy} onReset={resetWidth} />
            <div className="rtkq:shrink-0 rtkq:overflow-hidden" style={{ width: detailPanelWidth }}>
              <EntryDetail
                classes={classes}
                heading={selected.endpointName}
                statusNode={<OutcomeBadge outcome={selected.outcome} classes={classes} />}
                metaRows={[
                  { label: "Kind", value: KIND_LABEL[selected.kind] },
                  { label: "Request ID", value: selected.requestId },
                  {
                    label: "Started",
                    value: formatTimestamp(selected.startedTimeStamp),
                  },
                  {
                    label: "Settled",
                    value: formatTimestamp(selected.settledTimeStamp),
                  },
                  {
                    label: "Duration",
                    value: formatDuration(selected.durationMs),
                  },
                  { label: "forceRefetch", value: String(!!selected.forceRefetch) },
                  { label: "subscribe", value: String(selected.subscribe !== false) },
                ]}
                onClose={() => setSelectedId(undefined)}
                jsonSections={[
                  { label: "Arguments", value: selected.originalArgs },
                  ...(selected.error !== undefined
                    ? [{ label: "Error", value: selected.error }]
                    : []),
                ]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TimelineRow({
  classes,
  event,
  selected,
  onSelect,
}: {
  classes: RtkQueryDevtoolsClasses;
  event: TimelineEvent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <EntryRow
      classes={classes}
      selected={selected}
      onSelect={onSelect}
      statusNode={<OutcomeBadge outcome={event.outcome} classes={classes} />}
      title={event.endpointName}
      subtitle={KIND_LABEL[event.kind]}
      timestamp={formatTimestamp(event.startedTimeStamp)}
      duration={formatDuration(event.durationMs)}
    />
  );
}
