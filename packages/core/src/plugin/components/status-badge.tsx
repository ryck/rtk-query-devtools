import clsx from "clsx";
import { CheckCircle2, CircleDashed, CircleSlash, Loader2, RefreshCw, XCircle } from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
import type { DerivedQueryStatus } from "../../types";
import { SPIN_ANIMATION_NAME } from "../spin-keyframes";
import type { RtkQueryDevtoolsClasses } from "../theme";

const LABELS: Record<DerivedQueryStatus, string> = {
  fetching: "Fetching",
  error: "Error",
  fresh: "Fresh",
  inactive: "Inactive",
  uninitialized: "Uninitialized",
};

const ICONS: Record<DerivedQueryStatus, ComponentType<{ size?: number; style?: CSSProperties }>> = {
  fetching: Loader2,
  error: XCircle,
  fresh: CheckCircle2,
  inactive: CircleDashed,
  uninitialized: CircleSlash,
};

const badgeClass =
  "rtkq:inline-flex rtkq:size-5 rtkq:items-center rtkq:justify-center rtkq:rounded-full";

/**
 * A compact, colour-coded icon-only badge. The full label is exposed via
 * `title` (native tooltip) and `aria-label` (screen readers) rather than
 * rendered as visible text, keeping rows single-line without losing the
 * meaning behind the colour.
 */
export function IconBadge({
  icon: Icon,
  label,
  palette,
  spin,
}: {
  icon: ComponentType<{ size?: number; style?: CSSProperties }>;
  label: string;
  palette: string;
  spin?: boolean;
}) {
  return (
    <span title={label} aria-label={label} className={clsx(badgeClass, palette)}>
      <Icon
        size={12}
        style={spin ? { animation: `${SPIN_ANIMATION_NAME} 0.9s linear infinite` } : undefined}
      />
    </span>
  );
}

export function StatusBadge({
  status,
  classes,
}: {
  status: DerivedQueryStatus;
  classes: RtkQueryDevtoolsClasses;
}) {
  return (
    <IconBadge
      icon={ICONS[status]}
      label={LABELS[status]}
      palette={classes.status[status].badge}
      spin={status === "fetching"}
    />
  );
}

export function PollingPill({ classes }: { classes: RtkQueryDevtoolsClasses }) {
  return (
    <IconBadge
      icon={RefreshCw}
      label="This entry has an active poll subscription"
      palette={classes.polling}
    />
  );
}
