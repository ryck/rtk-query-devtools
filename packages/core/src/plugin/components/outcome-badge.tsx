import type { ComponentType, CSSProperties } from "react"
import { CheckCircle2, Loader2, SkipForward, XCircle } from "lucide-react"
import type { TimelineOutcome } from "../../types"
import type { RtkQueryDevtoolsClasses } from "../theme"
import { IconBadge } from "./status-badge"

const OUTCOME_META: Record<
  TimelineOutcome,
  {
    label: string
    icon: ComponentType<{ size?: number; style?: CSSProperties }>
    spin?: boolean
  }
> = {
  pending: { label: "Pending", icon: Loader2, spin: true },
  fulfilled: { label: "Fulfilled", icon: CheckCircle2 },
  rejected: { label: "Rejected", icon: XCircle },
  skipped: { label: "Skipped", icon: SkipForward },
}

/** Shared by the Timeline tab and a query entry's request history. */
export function OutcomeBadge({
  outcome,
  classes,
}: {
  outcome: TimelineOutcome
  classes: RtkQueryDevtoolsClasses
}) {
  const meta = OUTCOME_META[outcome]
  const palette =
    outcome === "pending"
      ? classes.status.fetching
      : outcome === "fulfilled"
        ? classes.status.fresh
        : outcome === "rejected"
          ? classes.status.error
          : classes.status.inactive
  return (
    <IconBadge
      icon={meta.icon}
      label={meta.label}
      palette={palette.badge}
      spin={meta.spin}
    />
  )
}
