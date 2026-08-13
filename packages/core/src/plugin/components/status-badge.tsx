import clsx from "clsx";
import { CheckCircle2, CircleDashed, CircleSlash, Loader2, RefreshCw, XCircle } from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
import type { DerivedQueryStatus } from "../../types";
import { SPIN_ANIMATION_NAME } from "../spin-keyframes";
import type { RtkQueryDevtoolsClasses } from "../theme";

const LABELS: Record<DerivedQueryStatus, string> = {
  fetching: "fetching",
  error: "error",
  fresh: "fresh",
  inactive: "inactive",
  uninitialized: "uninitialized",
};

const ICONS: Record<DerivedQueryStatus, ComponentType<{ size?: number; style?: CSSProperties }>> = {
  fetching: Loader2,
  error: XCircle,
  fresh: CheckCircle2,
  inactive: CircleDashed,
  uninitialized: CircleSlash,
};

const badgeClass =
  "rtkq:inline-flex rtkq:items-center rtkq:gap-1 rtkq:px-1.5 rtkq:py-0.5 rtkq:rounded-full rtkq:text-[10px] rtkq:font-semibold rtkq:uppercase rtkq:tracking-wide rtkq:whitespace-nowrap";

export function StatusBadge({
  status,
  classes,
}: {
  status: DerivedQueryStatus;
  classes: RtkQueryDevtoolsClasses;
}) {
  const Icon = ICONS[status];
  return (
    <span className={clsx(badgeClass, classes.status[status].badge)}>
      <Icon
        size={11}
        style={
          status === "fetching"
            ? { animation: `${SPIN_ANIMATION_NAME} 0.9s linear infinite` }
            : undefined
        }
      />
      {LABELS[status]}
    </span>
  );
}

export function PollingPill({ classes }: { classes: RtkQueryDevtoolsClasses }) {
  return (
    <span
      title="This entry has an active poll subscription"
      className={clsx(badgeClass, classes.polling)}
    >
      <RefreshCw size={11} />
      polling
    </span>
  );
}
