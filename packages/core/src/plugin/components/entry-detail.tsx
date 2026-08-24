import clsx from "clsx";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import type { TagDescription } from "../../types";
import type { RtkQueryDevtoolsClasses } from "../theme";
import { JsonTree } from "./json-tree";

export interface DetailMetaRow {
  label: string;
  value: ReactNode;
}

export interface DetailJsonSection {
  label: string;
  value: unknown;
}

export interface EntryDetailProps {
  classes: RtkQueryDevtoolsClasses;
  heading: string;
  statusNode?: ReactNode;
  metaRows: DetailMetaRow[];
  tags?: TagDescription[];
  onTagClick?: (tag: TagDescription) => void;
  jsonSections: DetailJsonSection[];
  /** Rendered between the tags and the JSON sections, e.g. request history. */
  extra?: ReactNode;
  actions?: ReactNode;
  /** Shows a close (X) button in the header when provided. */
  onClose?: () => void;
}

export function EntryDetail({
  classes,
  heading,
  statusNode,
  metaRows,
  tags,
  onTagClick,
  jsonSections,
  extra,
  actions,
  onClose,
}: EntryDetailProps) {
  return (
    <div className="rtkq:p-3 rtkq:overflow-y-auto rtkq:h-full rtkq:box-border">
      <div className="rtkq:flex rtkq:items-center rtkq:gap-2 rtkq:mb-2">
        <div
          className={clsx(
            "rtkq:text-[13px] rtkq:font-semibold rtkq:break-all",
            classes.textPrimary,
          )}
        >
          {heading}
        </div>
        {statusNode}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            title="Close details"
            className={clsx(
              "rtkq:ml-auto rtkq:inline-flex rtkq:shrink-0 rtkq:items-center rtkq:justify-center rtkq:rounded-md rtkq:size-6 rtkq:cursor-pointer rtkq:bg-transparent rtkq:border-0",
              classes.textMuted,
            )}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {actions && <div className="rtkq:flex rtkq:gap-1.5 rtkq:mb-3 rtkq:flex-wrap">{actions}</div>}

      <dl className="rtkq:grid rtkq:grid-cols-[max-content_1fr] rtkq:gap-x-3 rtkq:gap-y-1 rtkq:m-0 rtkq:mb-3 rtkq:text-xs">
        {metaRows.map((row) => (
          <MetaRowFragment key={row.label} row={row} classes={classes} />
        ))}
      </dl>

      {tags && tags.length > 0 && (
        <div className="rtkq:mb-3">
          <SectionLabel classes={classes}>Provided tags</SectionLabel>
          <div className="rtkq:flex rtkq:gap-1 rtkq:flex-wrap rtkq:mt-1">
            {tags.map((tag) => (
              <button
                key={`${tag.type}:${tag.id ?? ""}`}
                type="button"
                onClick={() => onTagClick?.(tag)}
                className={clsx(
                  "rtkq:px-2 rtkq:py-0.5 rtkq:rounded-full rtkq:border rtkq:bg-transparent rtkq:text-[10px] rtkq:font-mono",
                  classes.border,
                  classes.accent,
                  onTagClick ? "rtkq:cursor-pointer" : "rtkq:cursor-default",
                )}
              >
                {tag.type}
                {tag.id !== undefined ? `:${tag.id}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {extra}

      {jsonSections.map((section) => (
        <div key={section.label} className="rtkq:mb-3">
          <SectionLabel classes={classes}>{section.label}</SectionLabel>
          <div
            className={clsx(
              "rtkq:mt-1 rtkq:rounded-md rtkq:border rtkq:p-1.5",
              classes.surface,
              classes.border,
            )}
          >
            <JsonTree data={section.value} classes={classes} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetaRowFragment({
  row,
  classes,
}: {
  row: DetailMetaRow;
  classes: RtkQueryDevtoolsClasses;
}) {
  return (
    <>
      <dt className={clsx("rtkq:m-0", classes.textMuted)}>{row.label}</dt>
      <dd className={clsx("rtkq:m-0", classes.textPrimary)}>{row.value}</dd>
    </>
  );
}

function SectionLabel({
  classes,
  children,
}: {
  classes: RtkQueryDevtoolsClasses;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rtkq:text-[10px] rtkq:uppercase rtkq:tracking-wide rtkq:font-semibold",
        classes.textMuted,
      )}
    >
      {children}
    </div>
  );
}
