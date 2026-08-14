import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { CheckCircle2, Loader2, Pause, Play, SkipForward, Trash2, XCircle } from "lucide-react";
import { type ComponentType, type CSSProperties, useRef, useState } from "react";
import type { DevtoolsRegistry } from "../../registry";
import type { EndpointType, TimelineEvent, TimelineOutcome } from "../../types";
import { formatDuration } from "../format";
import { SPIN_ANIMATION_NAME } from "../spin-keyframes";
import type { RtkQueryDevtoolsClasses } from "../theme";
import { EmptyState } from "./empty-state";
import { EntryDetail } from "./entry-detail";
import { EntryRow } from "./entry-row";
import type { SelectOption } from "./toolbar";
import { Toolbar, ToolbarButton } from "./toolbar";

const KIND_LABEL: Record<EndpointType, string> = {
  query: "query",
  mutation: "mutation",
  infinitequery: "infinite query",
};

const OUTCOME_META: Record<
  TimelineOutcome,
  { label: string; icon: ComponentType<{ size?: number; style?: CSSProperties }>; spin?: boolean }
> = {
  pending: { label: "pending", icon: Loader2, spin: true },
  fulfilled: { label: "fulfilled", icon: CheckCircle2 },
  rejected: { label: "rejected", icon: XCircle },
  skipped: { label: "skipped", icon: SkipForward },
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
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  // The registry's `version` bump is what re-renders this component (via the
  // panel root's useSyncExternalStore) — `getTimeline()` always returns a
  // fresh copy, so there's nothing worth memoizing here; every render already
  // means the timeline may have changed.
  const q = search.trim().toLowerCase();
  const allEvents = registry.getTimeline().filter((e) => e.reducerPath === activeApi);
  const filtered = q
    ? allEvents.filter((e) => e.endpointName.toLowerCase().includes(q))
    : allEvents;
  const sorted = filtered.toReversed();
  const selected = sorted.find((e) => e.id === selectedId);
  const paused = registry.isTimelinePaused();

  const parentRef = useRef<HTMLDivElement>(null);
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
          <div
            className={clsx(
              "rtkq:w-[380px] rtkq:shrink-0 rtkq:border-l rtkq:overflow-hidden",
              classes.border,
            )}
          >
            <EntryDetail
              classes={classes}
              heading={selected.endpointName}
              statusNode={<OutcomeBadge outcome={selected.outcome} classes={classes} />}
              metaRows={[
                { label: "Kind", value: KIND_LABEL[selected.kind] },
                { label: "Request ID", value: selected.requestId },
                {
                  label: "Started",
                  value: new Date(selected.startedTimeStamp).toLocaleTimeString(),
                },
                {
                  label: "Settled",
                  value: selected.settledTimeStamp
                    ? new Date(selected.settledTimeStamp).toLocaleTimeString()
                    : "—",
                },
                {
                  label: "Duration",
                  value:
                    selected.durationMs !== undefined ? formatDuration(selected.durationMs) : "—",
                },
                { label: "forceRefetch", value: String(!!selected.forceRefetch) },
                { label: "subscribe", value: String(selected.subscribe !== false) },
              ]}
              jsonSections={[
                { label: "Arguments", value: selected.originalArgs },
                ...(selected.error !== undefined
                  ? [{ label: "Error", value: selected.error }]
                  : []),
              ]}
            />
          </div>
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
      metaRight={
        <span className={clsx("rtkq:text-[10px] rtkq:shrink-0", classes.textMuted)}>
          {event.durationMs !== undefined ? formatDuration(event.durationMs) : "…"}
        </span>
      }
    />
  );
}

function OutcomeBadge({
  outcome,
  classes,
}: {
  outcome: TimelineOutcome;
  classes: RtkQueryDevtoolsClasses;
}) {
  const meta = OUTCOME_META[outcome];
  const Icon = meta.icon;
  const palette =
    outcome === "pending"
      ? classes.status.fetching
      : outcome === "fulfilled"
        ? classes.status.fresh
        : outcome === "rejected"
          ? classes.status.error
          : classes.status.inactive;
  return (
    <span
      className={clsx(
        "rtkq:inline-flex rtkq:items-center rtkq:gap-1 rtkq:px-1.5 rtkq:py-0.5 rtkq:rounded-full rtkq:text-[10px] rtkq:font-semibold rtkq:uppercase rtkq:tracking-wide rtkq:whitespace-nowrap",
        palette.badge,
      )}
    >
      <Icon
        size={11}
        style={meta.spin ? { animation: `${SPIN_ANIMATION_NAME} 0.9s linear infinite` } : undefined}
      />
      {meta.label}
    </span>
  );
}
