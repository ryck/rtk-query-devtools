import clsx from "clsx";
import type { RtkQueryDevtoolsClasses } from "../theme";

export function EmptyState({
  classes,
  title,
  subtitle,
}: {
  classes: RtkQueryDevtoolsClasses;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      className={clsx(
        "rtkq:flex rtkq:flex-col rtkq:items-center rtkq:justify-center rtkq:h-full rtkq:p-8 rtkq:text-center",
        classes.textMuted,
      )}
    >
      <div className={clsx("rtkq:text-sm rtkq:mb-1", classes.textSecondary)}>{title}</div>
      {subtitle && <div className="rtkq:text-xs">{subtitle}</div>}
    </div>
  );
}
