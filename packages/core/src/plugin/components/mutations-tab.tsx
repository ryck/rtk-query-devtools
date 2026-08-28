import { useVirtualizer } from "@tanstack/react-virtual"
import {
  CheckCircle2,
  CircleSlash,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react"
import type { ComponentType, CSSProperties } from "react"
import { useMemo, useRef, useState } from "react"
import { removeMutationEntry } from "../../actions"
import type { DevtoolsRegistry } from "../../registry"
import { selectMutationEntries } from "../../selectors"
import type { DerivedQueryStatus, MutationEntry } from "../../types"
import { formatDuration, formatRelativeTime, formatTimestamp } from "../format"
import { useDetailPanelWidth } from "../hooks/use-detail-panel-width"
import {
  enumCodec,
  sortOrderCodec,
  usePersistentState,
} from "../hooks/use-persistent-state"
import { createSearchMatcher, SEARCH_MODES, type SearchMode } from "../search"
import type { RtkQueryDevtoolsClasses } from "../theme"
import { EmptyState } from "./empty-state"
import { EntryDetail } from "./entry-detail"
import { EntryRow } from "./entry-row"
import { ResizableDivider } from "./resizable-divider"
import { IconBadge } from "./status-badge"
import type { SelectOption, SortOrder } from "./toolbar"
import { Toolbar, ToolbarButton } from "./toolbar"

/**
 * Mutations don't have a meaningful "freshness", and reusing StatusBadge's
 * query vocabulary (fresh/inactive) here reads oddly for a one-shot
 * request, so this mirrors timeline-tab's OutcomeBadge pattern instead:
 * same color palette, mutation-appropriate labels.
 */
const MUTATION_STATUS_META: Record<
  MutationEntry["status"],
  {
    label: string
    icon: ComponentType<{ size?: number; style?: CSSProperties }>
    spin?: boolean
    palette: DerivedQueryStatus
  }
> = {
  pending: { label: "Pending", icon: Loader2, spin: true, palette: "fetching" },
  fulfilled: { label: "Fulfilled", icon: CheckCircle2, palette: "fresh" },
  rejected: { label: "Error", icon: XCircle, palette: "error" },
  uninitialized: {
    label: "Uninitialized",
    icon: CircleSlash,
    palette: "uninitialized",
  },
}

function MutationStatusBadge({
  status,
  classes,
}: {
  status: MutationEntry["status"]
  classes: RtkQueryDevtoolsClasses
}) {
  const meta = MUTATION_STATUS_META[status]
  const palette = classes.status[meta.palette]
  return (
    <IconBadge
      icon={meta.icon}
      label={meta.label}
      palette={palette.badge}
      spin={meta.spin}
    />
  )
}

const SORT_KEYS = ["updated", "endpoint", "status"] as const
type SortKey = (typeof SORT_KEYS)[number]

/** Mirrors the query list's ordering: pending first, then error, then settled. */
const MUTATION_STATUS_SEVERITY: Record<MutationEntry["status"], number> = {
  pending: 0,
  rejected: 1,
  fulfilled: 2,
  uninitialized: 3,
}

/** Ascending, like `compareQueries`. See the note there on Asc/Desc. */
function compareMutations(
  a: MutationEntry,
  b: MutationEntry,
  sort: SortKey
): number {
  if (sort === "endpoint") return a.endpointName.localeCompare(b.endpointName)
  if (sort === "status") {
    return (
      MUTATION_STATUS_SEVERITY[a.status] - MUTATION_STATUS_SEVERITY[b.status]
    )
  }
  return (a.startedTimeStamp ?? 0) - (b.startedTimeStamp ?? 0)
}

export interface MutationsTabProps {
  classes: RtkQueryDevtoolsClasses
  registry: DevtoolsRegistry
  state: unknown
  reducerPaths: string[]
  activeApi: string
  onApiChange: (reducerPath: string) => void
}

export function MutationsTab({
  classes,
  registry,
  state,
  reducerPaths,
  activeApi,
  onApiChange,
}: MutationsTabProps) {
  const [search, setSearch] = usePersistentState("mutations.search", "")
  const [sort, setSort] = usePersistentState<SortKey>(
    "mutations.sort",
    "updated",
    enumCodec(SORT_KEYS)
  )
  const [sortOrder, setSortOrder] = usePersistentState<SortOrder>(
    "mutations.sortOrder",
    -1,
    sortOrderCodec
  )
  const [searchMode, setSearchMode] = usePersistentState<SearchMode>(
    "mutations.searchMode",
    "fuzzy",
    enumCodec(SEARCH_MODES)
  )
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined)

  const allEntries = useMemo(
    () => (activeApi ? selectMutationEntries(state, activeApi) : []),
    [state, activeApi]
  )

  // Memoized so a regex is compiled once per query change, not once per row.
  const matcher = useMemo(
    () => createSearchMatcher(search, searchMode),
    [search, searchMode]
  )
  const filtered = useMemo(
    () =>
      allEntries.filter((e) => matcher.matches(e.endpointName, e.requestId)),
    [allEntries, matcher]
  )

  const sorted = useMemo(
    () => filtered.toSorted((a, b) => compareMutations(a, b, sort) * sortOrder),
    [filtered, sort, sortOrder]
  )

  const selected = sorted.find((e) => e.cacheKey === selectedKey)

  // RTK's mutation substate doesn't retain the args, so they're recovered from
  // the timeline. Keyed on the *event's* existence rather than on its
  // `originalArgs` being defined, since a no-arg mutation legitimately has
  // `undefined` args, and should still show an Arguments section.
  //
  // Deliberately not memoized, matching timeline-tab: the registry mutates
  // timeline events in place on settle, so a memo keyed on entry identity
  // could hold a stale miss. Scanning at most `maxTimelineEntries` (500) for
  // the single selected row isn't worth guarding.
  const mutationEvent = selected
    ? registry
        .getTimeline()
        .find(
          (e) => e.kind === "mutation" && e.requestId === selected.requestId
        )
    : undefined

  const parentRef = useRef<HTMLDivElement>(null)
  const {
    width: detailPanelWidth,
    resizeBy,
    reset: resetWidth,
  } = useDetailPanelWidth()
  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  const apiOptions: SelectOption[] = reducerPaths.map((p) => ({
    value: p,
    label: p,
  }))

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
        sortOptions={
          [
            { value: "updated", label: "Sort: updated" },
            { value: "endpoint", label: "Sort: endpoint" },
            { value: "status", label: "Sort: status" },
          ] satisfies SelectOption[]
        }
        sortValue={sort}
        onSortChange={(v) => setSort(v as SortKey)}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
        searchInvalid={matcher.invalid}
      />

      <div className="rtkq:flex rtkq:flex-1 rtkq:min-h-0">
        <div
          ref={parentRef}
          className="rtkq:flex-1 rtkq:min-w-0 rtkq:overflow-y-auto"
        >
          {sorted.length === 0 ? (
            <EmptyState
              classes={classes}
              title="No mutations yet"
              subtitle="Triggered mutations will appear here."
            />
          ) : (
            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((row) => {
                const entry = sorted[row.index]
                if (!entry) return null
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
                    <MutationRow
                      classes={classes}
                      entry={entry}
                      selected={entry.cacheKey === selectedKey}
                      onSelect={() => setSelectedKey(entry.cacheKey)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {selected && (
          <>
            <ResizableDivider
              classes={classes}
              onResize={resizeBy}
              onReset={resetWidth}
            />
            <div
              className="rtkq:shrink-0 rtkq:overflow-hidden"
              style={{ width: detailPanelWidth }}
            >
              <EntryDetail
                classes={classes}
                heading={selected.endpointName}
                statusNode={
                  <MutationStatusBadge
                    status={selected.status}
                    classes={classes}
                  />
                }
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
                      ? `${new Date(selected.fulfilledTimeStamp).toLocaleTimeString()} (${formatRelativeTime(selected.fulfilledTimeStamp)})`
                      : "—",
                  },
                  {
                    label: "Duration",
                    value:
                      selected.startedTimeStamp !== undefined &&
                      selected.fulfilledTimeStamp !== undefined
                        ? formatDuration(
                            selected.fulfilledTimeStamp -
                              selected.startedTimeStamp
                          )
                        : "—",
                  },
                ]}
                onClose={() => setSelectedKey(undefined)}
                jsonSections={[
                  ...(mutationEvent
                    ? [
                        {
                          label: "Arguments",
                          value: mutationEvent.originalArgs,
                        },
                      ]
                    : []),
                  { label: "Data", value: selected.data },
                  ...(selected.error !== undefined
                    ? [{ label: "Error", value: selected.error }]
                    : []),
                  { label: "Mutation entry", value: selected },
                ]}
                actions={
                  <ToolbarButton
                    classes={classes}
                    icon={Trash2}
                    variant="danger"
                    onClick={() => {
                      removeMutationEntry(registry, activeApi, selected)
                      setSelectedKey(undefined)
                    }}
                  >
                    Remove
                  </ToolbarButton>
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MutationRow({
  classes,
  entry,
  selected,
  onSelect,
}: {
  classes: RtkQueryDevtoolsClasses
  entry: MutationEntry
  selected: boolean
  onSelect: () => void
}) {
  const durationMs =
    entry.startedTimeStamp !== undefined &&
    entry.fulfilledTimeStamp !== undefined
      ? entry.fulfilledTimeStamp - entry.startedTimeStamp
      : undefined
  return (
    <EntryRow
      classes={classes}
      selected={selected}
      onSelect={onSelect}
      statusNode={
        <MutationStatusBadge status={entry.status} classes={classes} />
      }
      title={entry.endpointName}
      subtitle={entry.requestId}
      timestamp={formatTimestamp(entry.fulfilledTimeStamp)}
      duration={formatDuration(durationMs)}
    />
  )
}
