import clsx from "clsx";
import { ChevronDown, ChevronRight } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { RtkQueryDevtoolsClasses } from "../theme";

interface JsonTreeProps {
  data: unknown;
  classes: RtkQueryDevtoolsClasses;
  label?: string;
  depth?: number;
  ancestors?: unknown[];
}

const DEFAULT_EXPAND_DEPTH = 1;
const AUTO_COLLAPSE_ENTRY_COUNT = 30;
const NO_ANCESTORS: unknown[] = [];

/**
 * Renders arbitrary app data as a collapsible tree without ever calling
 * `JSON.stringify` on the whole value — large cache entries would otherwise
 * hang the panel. Nodes past the default expand depth or with many entries
 * start collapsed; expanding is opt-in per node.
 */
export function JsonTree({
  data,
  classes,
  label,
  depth = 0,
  ancestors = NO_ANCESTORS,
}: JsonTreeProps) {
  if (data !== null && typeof data === "object") {
    if (ancestors.includes(data)) {
      return (
        <TreeRow
          classes={classes}
          label={label}
          valueNode={
            <Token classes={classes} kind="muted">
              [Circular]
            </Token>
          }
        />
      );
    }

    let entries: Array<[string, unknown]>;
    let openBracket = "{";
    let closeBracket = "}";
    let typeLabel: string | undefined;

    if (data instanceof Map) {
      entries = Array.from(data.entries()).map(([k, v], i) => [String(k ?? i), v]);
      typeLabel = `Map(${data.size})`;
    } else if (data instanceof Set) {
      entries = Array.from(data.values()).map((v, i) => [String(i), v]);
      typeLabel = `Set(${data.size})`;
    } else if (Array.isArray(data)) {
      entries = data.map((v, i) => [String(i), v]);
      openBracket = "[";
      closeBracket = "]";
    } else {
      entries = Object.entries(data as Record<string, unknown>);
    }

    return (
      <CollapsibleNode
        classes={classes}
        label={label}
        typeLabel={typeLabel}
        openBracket={openBracket}
        closeBracket={closeBracket}
        count={entries.length}
        depth={depth}
        renderChildren={() =>
          entries.map(([key, value]) => (
            <JsonTree
              key={key}
              data={value}
              classes={classes}
              label={key}
              depth={depth + 1}
              ancestors={[...ancestors, data]}
            />
          ))
        }
      />
    );
  }

  return (
    <TreeRow
      classes={classes}
      label={label}
      valueNode={<PrimitiveToken classes={classes} value={data} />}
    />
  );
}

function CollapsibleNode({
  classes,
  label,
  typeLabel,
  openBracket,
  closeBracket,
  count,
  depth,
  renderChildren,
}: {
  classes: RtkQueryDevtoolsClasses;
  label: string | undefined;
  typeLabel: string | undefined;
  openBracket: string;
  closeBracket: string;
  count: number;
  depth: number;
  renderChildren: () => ReactNode;
}) {
  const [expanded, setExpanded] = useState(
    depth < DEFAULT_EXPAND_DEPTH && count <= AUTO_COLLAPSE_ENTRY_COUNT,
  );

  return (
    <div>
      <div
        className={clsx(
          "rtkq:flex rtkq:items-baseline rtkq:gap-1 rtkq:cursor-pointer rtkq:font-mono rtkq:text-xs rtkq:select-none",
          classes.textPrimary,
        )}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v);
        }}
        role="button"
        tabIndex={0}
      >
        <span className={clsx("rtkq:inline-flex rtkq:w-3 rtkq:items-center", classes.textMuted)}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        {label !== undefined && <span className={classes.json.key}>{label}:</span>}
        {typeLabel && <span className={classes.textMuted}>{typeLabel}</span>}
        <span className={classes.textDimmed}>
          {openBracket}
          {!expanded && count > 0 ? ` ${count} ` : ""}
          {!expanded ? closeBracket : ""}
        </span>
      </div>
      {expanded && (
        <div className={clsx("rtkq:pl-3 rtkq:ml-1 rtkq:border-l", classes.border)}>
          {renderChildren()}
          <div className={clsx("rtkq:font-mono rtkq:text-xs", classes.textDimmed)}>
            {closeBracket}
          </div>
        </div>
      )}
    </div>
  );
}

function TreeRow({
  classes,
  label,
  valueNode,
}: {
  classes: RtkQueryDevtoolsClasses;
  label: string | undefined;
  valueNode: ReactNode;
}) {
  return (
    <div className="rtkq:font-mono rtkq:text-xs rtkq:py-px rtkq:pl-3.5">
      {label !== undefined && <span className={classes.json.key}>{label}: </span>}
      {valueNode}
    </div>
  );
}

function PrimitiveToken({ classes, value }: { classes: RtkQueryDevtoolsClasses; value: unknown }) {
  if (value === undefined)
    return (
      <Token classes={classes} kind="muted">
        undefined
      </Token>
    );
  if (value === null)
    return (
      <Token classes={classes} kind="muted">
        null
      </Token>
    );
  if (typeof value === "string")
    return (
      <Token classes={classes} kind="string">
        &quot;{value}&quot;
      </Token>
    );
  if (typeof value === "number")
    return (
      <Token classes={classes} kind="number">
        {String(value)}
      </Token>
    );
  if (typeof value === "boolean")
    return (
      <Token classes={classes} kind="boolean">
        {String(value)}
      </Token>
    );
  if (typeof value === "bigint")
    return (
      <Token classes={classes} kind="number">
        {value.toString()}n
      </Token>
    );
  if (typeof value === "function") {
    return (
      <Token classes={classes} kind="muted">
        [Function: {value.name || "anonymous"}]
      </Token>
    );
  }
  if (typeof value === "symbol")
    return (
      <Token classes={classes} kind="muted">
        {value.toString()}
      </Token>
    );
  if (value instanceof Date)
    return (
      <Token classes={classes} kind="string">
        {value.toISOString()}
      </Token>
    );
  return (
    <Token classes={classes} kind="muted">
      {String(value)}
    </Token>
  );
}

function Token({
  classes,
  kind,
  children,
}: {
  classes: RtkQueryDevtoolsClasses;
  kind: "string" | "number" | "boolean" | "muted";
  children: ReactNode;
}) {
  return <span className={classes.json[kind]}>{children}</span>;
}
