import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { CheckCircle2, CircleSlash, Loader2, XCircle } from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
import { removeMutationEntry } from "../../actions";
import type { DevtoolsRegistry } from "../../registry";
import { selectMutationEntries } from "../../selectors";
import type { DerivedQueryStatus, MutationEntry } from "../../types";
import { SPIN_ANIMATION_NAME } from "../spin-keyframes";
import type { RtkQueryDevtoolsClasses } from "../theme";
import { EmptyState } from "./empty-state";
import { EntryDetail } from "./entry-detail";
import { EntryRow } from "./entry-row";
import type { SelectOption } from "./toolbar";
import { Toolbar, ToolbarButton } from "./toolbar";

/**
 * Mutations don't have a meaningful "freshness" — reusing StatusBadge's
 * query vocabulary (fresh/inactive) here reads oddly for a one-shot
 * request, so this mirrors timeline-tab's OutcomeBadge pattern instead:
 * same color palette, mutation-appropriate labels.
 */
const MUTATION_STATUS_META: Record<
  MutationEntry["status"],
  {
    label: string;
    icon: ComponentType<{ size?: number; style?: CSSProperties }>;
    spin?: boolean;
    palette: DerivedQueryStatus;
  }
> = {
  pending: { label: "pending", icon: Loader2, spin: true, palette: "fetching" },
  fulfilled: { label: "fulfilled", icon: CheckCircle2, palette: "fresh" },
  rejected: { label: "error", icon: XCircle, palette: "error" },
  uninitialized: { label: "uninitialized", icon: CircleSlash, palette: "uninitialized" },
};

function MutationStatusBadge({
  status,
  classes,
}: {
  status: MutationEntry["status"];
  classes: RtkQueryDevtoolsClasses;
}) {
  const meta = MUTATION_STATUS_META[status];
  const Icon = meta.icon;
  const palette = classes.status[meta.palette];
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

export interface MutationsTabProps {
  classes: RtkQueryDevtoolsClasses;
  registry: DevtoolsRegistry;
  state: unknown;
  reducerPaths: string[];
  activeApi: string;
  onApiChange: (reducerPath: string) => void;
}

export function MutationsTab({
  classes,
  registry,
  state,
  reducerPaths,
  activeApi,
  onApiChange,
}: MutationsTabProps) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);

  const allEntries = useMemo(
    () => (activeApi ? selectMutationEntries(state, activeApi) : []),
    [state, activeApi],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allEntries;
    return allEntries.filter((e) => e.endpointName.toLowerCase().includes(q));
  }, [allEntries, search]);

  const sorted = useMemo(
    () => filtered.toSorted((a, b) => (b.startedTimeStamp ?? 0) - (a.startedTimeStamp ?? 0)),
    [filtered],
  );

  const selected = sorted.find((e) => e.cacheKey === selectedKey);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
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
      />

      <div className="rtkq:flex rtkq:flex-1 rtkq:min-h-0">
        <div ref={parentRef} className="rtkq:flex-1 rtkq:min-w-0 rtkq:overflow-y-auto">
          {sorted.length === 0 ? (
            <EmptyState
              classes={classes}
              title="No mutations yet"
              subtitle="Triggered mutations will appear here."
            />
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((row) => {
                const entry = sorted[row.index];
                if (!entry) return null;
                return (
                  <div
                    key={entry.cacheKey}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${row.start}px)`,
                    }}
                  >
                    <EntryRow
                      classes={classes}
                      selected={entry.cacheKey === selectedKey}
                      onSelect={() => setSelectedKey(entry.cacheKey)}
                      statusNode={<MutationStatusBadge status={entry.status} classes={classes} />}
                      title={entry.endpointName}
                      subtitle={entry.requestId}
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
              statusNode={<MutationStatusBadge status={selected.status} classes={classes} />}
              metaRows={[
                { label: "Request ID", value: selected.requestId },
                {
                  label: "Started",
                  value: selected.startedTimeStamp
                    ? new Date(selected.startedTimeStamp).toLocaleTimeString()
                    : "—",
                },
                {
                  label: "Fulfilled",
                  value: selected.fulfilledTimeStamp
                    ? new Date(selected.fulfilledTimeStamp).toLocaleTimeString()
                    : "—",
                },
              ]}
              jsonSections={[
                { label: "Data", value: selected.data },
                ...(selected.error !== undefined
                  ? [{ label: "Error", value: selected.error }]
                  : []),
              ]}
              actions={
                <ToolbarButton
                  classes={classes}
                  variant="danger"
                  onClick={() => {
                    removeMutationEntry(registry, activeApi, selected);
                    setSelectedKey(undefined);
                  }}
                >
                  Remove
                </ToolbarButton>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
