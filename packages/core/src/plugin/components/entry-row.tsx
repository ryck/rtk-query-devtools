import clsx from "clsx";
import type { ReactNode } from "react";
import type { RtkQueryDevtoolsClasses } from "../theme";

export interface EntryRowProps {
  classes: RtkQueryDevtoolsClasses;
  statusNode: ReactNode;
  title: string;
  subtitle?: string;
  metaRight?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export function EntryRow({
  classes,
  statusNode,
  title,
  subtitle,
  metaRight,
  selected,
  onSelect,
}: EntryRowProps) {
  return (
    <div
      className={clsx(
        "rtkq:flex rtkq:items-center rtkq:gap-2 rtkq:px-3 rtkq:py-1.5 rtkq:cursor-pointer rtkq:border-b rtkq:box-border rtkq:w-full",
        classes.border,
        selected ? classes.surfaceSelected : clsx("rtkq:bg-transparent", classes.surfaceHover),
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      role="button"
      tabIndex={0}
    >
      {statusNode}
      <div className="rtkq:flex-1 rtkq:min-w-0">
        <div className={clsx("rtkq:text-xs rtkq:truncate", classes.textPrimary)}>{title}</div>
        {subtitle && (
          <div className={clsx("rtkq:text-[10px] rtkq:truncate", classes.textMuted)}>
            {subtitle}
          </div>
        )}
      </div>
      {metaRight}
    </div>
  );
}
