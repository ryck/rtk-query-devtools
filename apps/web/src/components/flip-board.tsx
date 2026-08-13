import {
  useGetPostQuery,
  useListPostsFlakyQuery,
  useListPostsQuery,
  useListUsersQuery,
} from "@rtk-query-devtools/demo-api";
import { clsx } from "clsx";

type TileStatus = "fetching" | "fresh" | "error" | "inactive";

interface BoardRow {
  endpoint: string;
  args: string;
  status: TileStatus;
  subs: number;
}

function deriveStatus(hook: {
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
}): TileStatus {
  if (hook.isFetching) return "fetching";
  if (hook.isError) return "error";
  if (hook.isSuccess) return "fresh";
  return "inactive";
}

const STATUS_STYLES: Record<TileStatus, string> = {
  fetching: "bg-amber/15 text-amber",
  fresh: "bg-teal/15 text-teal",
  error: "bg-coral/15 text-coral",
  inactive: "bg-panel-line/60 text-mist",
};

/**
 * The board's rows are driven by real RTK Query hooks, polling on staggered
 * intervals so they flip independently rather than in lockstep — this is
 * genuinely live cache activity, not a scripted animation. listPostsFlaky
 * fails ~2 times out of 3 by design (see @rtk-query-devtools/demo-api),
 * which is what gives the board its ERROR row without any extra faking.
 */
export function FlipBoard() {
  const post = useGetPostQuery(1, { pollingInterval: 4500 });
  const posts = useListPostsQuery(undefined, { pollingInterval: 6000 });
  const flaky = useListPostsFlakyQuery(undefined, { pollingInterval: 5200 });
  const users = useListUsersQuery(undefined, { pollingInterval: 7200 });

  const rows: BoardRow[] = [
    { endpoint: "getPost", args: "(1)", status: deriveStatus(post), subs: 1 },
    { endpoint: "listPosts", args: "()", status: deriveStatus(posts), subs: 2 },
    { endpoint: "listPostsFlaky", args: "()", status: deriveStatus(flaky), subs: 1 },
    { endpoint: "listUsers", args: "()", status: deriveStatus(users), subs: 1 },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-panel-line bg-panel shadow-[0_0_0_1px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-panel-line px-4 py-3 sm:px-6">
        <span className="font-mono text-[11px] tracking-[0.2em] text-mist uppercase">
          rtk-query-devtools — live status
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.2em] text-teal uppercase">
          <span className="animate-pulse-dot size-1.5 rounded-full bg-teal" aria-hidden="true" />
          live
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 border-b border-panel-line px-4 py-2 font-mono text-[10px] tracking-[0.15em] text-mist uppercase sm:px-6">
        <span>Endpoint</span>
        <span className="hidden sm:block">Args</span>
        <span>Status</span>
        <span className="text-right">Subs</span>
      </div>

      <div role="table" aria-label="Live RTK Query cache status">
        {rows.map((row) => (
          <BoardRowView key={row.endpoint} row={row} />
        ))}
      </div>
    </div>
  );
}

function BoardRowView({ row }: { row: BoardRow }) {
  return (
    <div
      role="row"
      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b border-panel-line/60 px-4 py-3 font-mono text-sm text-paper last:border-b-0 sm:px-6"
    >
      <span className="truncate" role="cell">
        {row.endpoint}
      </span>
      <span className="hidden text-mist sm:block" role="cell">
        {row.args}
      </span>
      <span role="cell">
        <FlipTile status={row.status} />
      </span>
      <span className="text-right text-mist" role="cell">
        {row.subs}
      </span>
    </div>
  );
}

function FlipTile({ status }: { status: TileStatus }) {
  return (
    <span
      key={status}
      className={clsx(
        "animate-flip-in inline-flex w-[84px] items-center justify-center rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

/** Static "powered off" board shown during SSR and before hydration. */
export function DormantBoard() {
  const rows = [
    { endpoint: "getPost", args: "(1)" },
    { endpoint: "listPosts", args: "()" },
    { endpoint: "listPostsFlaky", args: "()" },
    { endpoint: "listUsers", args: "()" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-panel-line bg-panel">
      <div className="flex items-center justify-between border-b border-panel-line px-4 py-3 sm:px-6">
        <span className="font-mono text-[11px] tracking-[0.2em] text-mist uppercase">
          rtk-query-devtools — live status
        </span>
        <span className="font-mono text-[11px] tracking-[0.2em] text-mist uppercase">
          connecting…
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 border-b border-panel-line px-4 py-2 font-mono text-[10px] tracking-[0.15em] text-mist uppercase sm:px-6">
        <span>Endpoint</span>
        <span className="hidden sm:block">Args</span>
        <span>Status</span>
        <span className="text-right">Subs</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.endpoint}
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b border-panel-line/60 px-4 py-3 font-mono text-sm text-paper last:border-b-0 sm:px-6"
        >
          <span className="truncate">{row.endpoint}</span>
          <span className="hidden text-mist sm:block">{row.args}</span>
          <span className="inline-flex w-[84px] items-center justify-center rounded-md bg-panel-line/60 px-2 py-1 text-[10px] font-semibold tracking-[0.1em] text-mist uppercase">
            idle
          </span>
          <span className="text-right text-mist">—</span>
        </div>
      ))}
    </div>
  );
}
