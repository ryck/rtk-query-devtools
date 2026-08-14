import clsx from "clsx";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { RtkQueryDevtoolsClasses } from "../theme";

export interface SelectOption {
  value: string;
  label: string;
}

/** `1` ascending, `-1` descending — multiplied into a tab's comparator. */
export type SortOrder = 1 | -1;

export interface ToolbarProps {
  classes: RtkQueryDevtoolsClasses;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortOptions?: SelectOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOrder?: SortOrder;
  onSortOrderChange?: (order: SortOrder) => void;
  apiOptions?: SelectOption[];
  activeApi?: string;
  onApiChange?: (value: string) => void;
  actions?: ReactNode;
}

export function Toolbar({
  classes,
  search,
  onSearchChange,
  searchPlaceholder,
  sortOptions,
  sortValue,
  onSortChange,
  sortOrder = 1,
  onSortOrderChange,
  apiOptions,
  activeApi,
  onApiChange,
  actions,
}: ToolbarProps) {
  return (
    <div
      className={clsx(
        "rtkq:flex rtkq:flex-wrap rtkq:items-center rtkq:gap-2 rtkq:px-3 rtkq:py-2 rtkq:border-b",
        classes.border,
      )}
    >
      <div className="rtkq:relative rtkq:flex-1 rtkq:min-w-[120px]">
        <Search
          size={13}
          className={clsx(
            "rtkq:absolute rtkq:left-2 rtkq:top-1/2 rtkq:-translate-y-1/2 rtkq:pointer-events-none",
            classes.textMuted,
          )}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder ?? "Search…"}
          className={clsx(
            "rtkq:w-full rtkq:box-border rtkq:py-1 rtkq:pl-6 rtkq:pr-2 rtkq:rounded-md rtkq:border rtkq:text-xs rtkq:outline-none",
            classes.surface,
            classes.borderInput,
            classes.textPrimary,
          )}
        />
      </div>

      {apiOptions && apiOptions.length > 1 && onApiChange && (
        <select
          value={activeApi}
          onChange={(e) => onApiChange(e.target.value)}
          className={clsx(
            "rtkq:py-1 rtkq:px-2 rtkq:rounded-md rtkq:border rtkq:text-xs",
            classes.surface,
            classes.borderInput,
            classes.textPrimary,
          )}
        >
          {apiOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {sortOptions && sortOptions.length > 0 && onSortChange && (
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          className={clsx(
            "rtkq:py-1 rtkq:px-2 rtkq:rounded-md rtkq:border rtkq:text-xs",
            classes.surface,
            classes.borderInput,
            classes.textPrimary,
          )}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {onSortOrderChange && (
        <button
          type="button"
          onClick={() => onSortOrderChange(sortOrder === 1 ? -1 : 1)}
          aria-pressed={sortOrder === -1}
          aria-label={sortOrder === 1 ? "Sort order ascending" : "Sort order descending"}
          title={sortOrder === 1 ? "Sorting ascending" : "Sorting descending"}
          className={clsx(
            "rtkq:inline-flex rtkq:cursor-pointer rtkq:items-center rtkq:gap-1 rtkq:rounded-md rtkq:border rtkq:bg-transparent rtkq:px-2 rtkq:py-1 rtkq:text-xs",
            classes.borderInput,
            classes.textPrimary,
          )}
        >
          {sortOrder === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {sortOrder === 1 ? "Asc" : "Desc"}
        </button>
      )}

      {actions && <div className="rtkq:ml-auto rtkq:flex rtkq:gap-1.5">{actions}</div>}
    </div>
  );
}

export function ToolbarButton({
  classes,
  onClick,
  children,
  icon: Icon,
  variant = "default",
  disabled,
  title,
}: {
  classes: RtkQueryDevtoolsClasses;
  onClick: () => void;
  children: ReactNode;
  icon?: ComponentType<{ size?: number }>;
  variant?: "default" | "danger";
  disabled?: boolean;
  title?: string;
}) {
  const colorClasses = variant === "danger" ? classes.danger : classes.accent;
  const borderClasses = variant === "danger" ? classes.dangerBorder : classes.accentBorder;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        "rtkq:inline-flex rtkq:items-center rtkq:gap-1 rtkq:px-2 rtkq:py-1 rtkq:rounded-md rtkq:border rtkq:bg-transparent rtkq:text-[10px] rtkq:font-semibold rtkq:whitespace-nowrap",
        disabled
          ? clsx(classes.border, classes.textDimmed, "rtkq:cursor-not-allowed")
          : clsx(borderClasses, colorClasses, "rtkq:cursor-pointer"),
      )}
    >
      {Icon && <Icon size={12} />}
      {children}
    </button>
  );
}
