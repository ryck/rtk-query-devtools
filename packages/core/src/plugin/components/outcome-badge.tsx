import clsx from "clsx";
import { CheckCircle2, Loader2, SkipForward, XCircle } from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
import type { TimelineOutcome } from "../../types";
import { SPIN_ANIMATION_NAME } from "../spin-keyframes";
import type { RtkQueryDevtoolsClasses } from "../theme";

const OUTCOME_META: Record<
  TimelineOutcome,
  { label: string; icon: ComponentType<{ size?: number; style?: CSSProperties }>; spin?: boolean }
> = {
  pending: { label: "pending", icon: Loader2, spin: true },
  fulfilled: { label: "fulfilled", icon: CheckCircle2 },
  rejected: { label: "rejected", icon: XCircle },
  skipped: { label: "skipped", icon: SkipForward },
};

/** Shared by the Timeline tab and a query entry's request history. */
export function OutcomeBadge({
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
