import clsx from "clsx";
import { ChevronDown, ChevronRight, Tag as TagIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { invalidateTags } from "../../actions";
import type { DevtoolsRegistry } from "../../registry";
import { NO_TAG_ID, selectTagGroups } from "../../selectors";
import { enumCodec, usePersistentState } from "../hooks/use-persistent-state";
import { createSearchMatcher, SEARCH_MODES, type SearchMode } from "../search";
import type { RtkQueryDevtoolsClasses } from "../theme";
import { EmptyState } from "./empty-state";
import type { SelectOption } from "./toolbar";
import { Toolbar, ToolbarButton } from "./toolbar";

export interface TagsTabProps {
  classes: RtkQueryDevtoolsClasses;
  registry: DevtoolsRegistry;
  state: unknown;
  reducerPaths: string[];
  activeApi: string;
  onApiChange: (reducerPath: string) => void;
  onNavigateToQuery: (queryCacheKey: string) => void;
  /** Seeds the search box — pass the tag type when navigating here from a tag chip elsewhere. */
  initialSearch?: string;
}

export function TagsTab({
  classes,
  registry,
  state,
  reducerPaths,
  activeApi,
  onApiChange,
  onNavigateToQuery,
  initialSearch,
}: TagsTabProps) {
  // Deliberately *not* persisted, unlike the other tabs: this box is seeded by
  // cross-tab navigation (a tag chip in the query detail remounts this tab with
  // `initialSearch`), and a restored value would silently override that.
  const [search, setSearch] = useState(initialSearch ?? "");
  const [searchMode, setSearchMode] = usePersistentState<SearchMode>(
    "tags.searchMode",
    "fuzzy",
    enumCodec(SEARCH_MODES),
  );
  const [expanded, setExpanded] = useState<Set<string>>(
    initialSearch ? new Set([initialSearch]) : new Set(),
  );

  const groups = useMemo(
    () => (activeApi ? selectTagGroups(state, activeApi) : []),
    [state, activeApi],
  );

  // Memoized so a regex is compiled once per query change, not once per row.
  const matcher = useMemo(() => createSearchMatcher(search, searchMode), [search, searchMode]);
  const filtered = useMemo(() => {
    if (!search.trim()) return groups;
    return groups
      .map((g) => ({
        ...g,
        entries: g.entries.filter((e) => matcher.matches(`${g.tagType}:${e.id}`)),
      }))
      .filter((g) => g.entries.length > 0 || matcher.matches(g.tagType));
  }, [groups, search, matcher]);

  const apiOptions: SelectOption[] = reducerPaths.map((p) => ({ value: p, label: p }));

  const toggle = (tagType: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(tagType)) next.delete(tagType);
      else next.add(tagType);
      return next;
    });

  return (
    <div className="rtkq:flex rtkq:h-full rtkq:flex-col">
      <Toolbar
        classes={classes}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tag type or id…"
        apiOptions={apiOptions}
        activeApi={activeApi}
        onApiChange={onApiChange}
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
        searchInvalid={matcher.invalid}
      />
      <div className="rtkq:flex-1 rtkq:overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            classes={classes}
            title="No provided tags"
            subtitle="Tags appear here once your queries provide cache tags."
          />
        ) : (
          filtered.map((group) => (
            <div key={group.tagType} className={clsx("rtkq:border-b", classes.border)}>
              <div
                className={clsx(
                  "rtkq:flex rtkq:items-center rtkq:gap-1.5 rtkq:px-3 rtkq:py-1.5",
                  classes.surfaceHover,
                )}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(group.tagType)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggle(group.tagType);
                  }}
                  className="rtkq:flex rtkq:flex-1 rtkq:min-w-0 rtkq:items-center rtkq:gap-1.5 rtkq:cursor-pointer"
                >
                  <span className={classes.textMuted}>
                    {expanded.has(group.tagType) ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                  </span>
                  <TagIcon size={12} className={classes.accent} />
                  <span
                    className={clsx(
                      "rtkq:text-xs rtkq:font-semibold rtkq:truncate",
                      classes.textPrimary,
                    )}
                  >
                    {group.tagType}
                  </span>
                  <span className={clsx("rtkq:text-[10px] rtkq:shrink-0", classes.textMuted)}>
                    {group.entries.length} id{group.entries.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ToolbarButton
                  classes={classes}
                  onClick={() => invalidateTags(registry, activeApi, [{ type: group.tagType }])}
                >
                  Invalidate all
                </ToolbarButton>
              </div>

              {expanded.has(group.tagType) && (
                <div className="rtkq:pb-1.5">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="rtkq:pl-8 rtkq:pr-3 rtkq:py-1">
                      <div className="rtkq:flex rtkq:items-center rtkq:gap-2">
                        <span
                          className={clsx(
                            "rtkq:flex-1 rtkq:min-w-0 rtkq:truncate rtkq:font-mono rtkq:text-[11px]",
                            classes.textSecondary,
                          )}
                        >
                          id: {entry.id === NO_TAG_ID ? "none" : entry.id}
                        </span>
                        <ToolbarButton
                          classes={classes}
                          onClick={() =>
                            invalidateTags(registry, activeApi, [
                              {
                                type: group.tagType,
                                id: entry.id === NO_TAG_ID ? undefined : entry.id,
                              },
                            ])
                          }
                        >
                          Invalidate
                        </ToolbarButton>
                      </div>
                      <div className="rtkq:flex rtkq:flex-wrap rtkq:gap-1 rtkq:mt-1">
                        {entry.queryCacheKeys.map((key) => (
                          <button
                            key={key}
                            type="button"
                            title={key}
                            onClick={() => onNavigateToQuery(key)}
                            className={clsx(
                              "rtkq:max-w-[220px] rtkq:truncate rtkq:rounded rtkq:border rtkq:bg-transparent rtkq:px-1.5 rtkq:py-0.5 rtkq:font-mono rtkq:text-[10px] rtkq:cursor-pointer",
                              classes.border,
                              classes.textMuted,
                            )}
                          >
                            {key}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
