import { clsx } from "clsx"
import { Check, ChevronDown, ChevronRight, Copy, X } from "lucide-react"
import { type ReactNode, useState } from "react"
import { safeStringify } from "../format"
import type { RtkQueryDevtoolsClasses } from "../theme"

interface JsonTreeProps {
  data: unknown
  classes: RtkQueryDevtoolsClasses
  label?: string
  depth?: number
  ancestors?: unknown[]
}

const DEFAULT_EXPAND_DEPTH = 1
const AUTO_COLLAPSE_ENTRY_COUNT = 30
/**
 * Collections longer than this are split into collapsible chunks. Auto-collapse
 * only governs a node's *initial* state, so without chunking, expanding a
 * 50k-element array would render 50k unvirtualized rows, the one remaining way
 * to hang the panel on a large cache entry.
 */
const CHUNK_SIZE = 100
const NO_ANCESTORS: unknown[] = []

interface Collection {
  entries: Array<[string, unknown]>
  openBracket: string
  closeBracket: string
  typeLabel?: string
}

function describeCollection(data: object): Collection {
  if (data instanceof Map) {
    return {
      entries: Array.from(data.entries()).map(([k, v], i) => [
        String(k ?? i),
        v,
      ]),
      openBracket: "{",
      closeBracket: "}",
      typeLabel: `Map(${data.size})`,
    }
  }
  if (data instanceof Set) {
    return {
      entries: Array.from(data.values()).map((v, i) => [String(i), v]),
      openBracket: "{",
      closeBracket: "}",
      typeLabel: `Set(${data.size})`,
    }
  }
  if (Array.isArray(data)) {
    return {
      entries: data.map((v, i) => [String(i), v]),
      openBracket: "[",
      closeBracket: "]",
    }
  }
  if (data instanceof Error) return describeError(data)
  return {
    entries: Object.entries(data as Record<string, unknown>),
    openBracket: "{",
    closeBracket: "}",
  }
}

/**
 * `Object.entries(new Error("boom"))` is `[]`, because `name`, `message`, and `stack`
 * are all non-enumerable, so without this an Error renders as a bare `{}`.
 * Own enumerable properties are appended, which is what carries the useful
 * detail on RTK's `SerializedError` and on custom error subclasses.
 */
function describeError(error: Error): Collection {
  const named: Array<[string, unknown]> = [
    ["name", error.name],
    ["message", error.message],
  ]
  if (error.stack) named.push(["stack", error.stack])
  return {
    entries: [...named, ...Object.entries(error)],
    openBracket: "{",
    closeBracket: "}",
    typeLabel: error.name || "Error",
  }
}

/**
 * Objects that read better as a single value than as a tree of their (usually
 * empty) own properties. `Object.entries(new Date())` is `[]`, so without this
 * a Date renders as a bare `{}` and `PrimitiveToken`'s Date branch is
 * unreachable.
 */
function isLeafObject(value: object): boolean {
  return value instanceof Date || value instanceof RegExp
}

/**
 * Renders arbitrary app data as a collapsible tree without ever calling
 * `JSON.stringify` on the whole value; large cache entries would otherwise
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
  if (data !== null && typeof data === "object" && !isLeafObject(data)) {
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
      )
    }

    const { entries, openBracket, closeBracket, typeLabel } =
      describeCollection(data)
    const childAncestors = [...ancestors, data]

    return (
      <CollapsibleNode
        classes={classes}
        label={label}
        typeLabel={typeLabel}
        openBracket={openBracket}
        closeBracket={closeBracket}
        count={entries.length}
        depth={depth}
        copyValue={data}
        renderChildren={() => (
          <EntryList
            entries={entries}
            classes={classes}
            depth={depth}
            ancestors={childAncestors}
          />
        )}
      />
    )
  }

  return (
    <TreeRow
      classes={classes}
      label={label}
      valueNode={<PrimitiveToken classes={classes} value={data} />}
    />
  )
}

/**
 * Renders a node's children, splitting into `[0…99]`-style chunk nodes once the
 * collection is large enough that rendering it whole would be a problem.
 */
function EntryList({
  entries,
  classes,
  depth,
  ancestors,
}: {
  entries: Array<[string, unknown]>
  classes: RtkQueryDevtoolsClasses
  depth: number
  ancestors: unknown[]
}) {
  if (entries.length <= CHUNK_SIZE) {
    return (
      <>
        {entries.map(([key, value]) => (
          <JsonTree
            key={key}
            data={value}
            classes={classes}
            label={key}
            depth={depth + 1}
            ancestors={ancestors}
          />
        ))}
      </>
    )
  }

  const chunks: ReactNode[] = []
  for (let start = 0; start < entries.length; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, entries.length)
    const slice = entries.slice(start, end)
    chunks.push(
      <CollapsibleNode
        key={start}
        classes={classes}
        // The real end index, not `start + CHUNK_SIZE - 1`, because the final chunk is
        // usually partial, and labelling it with a range it doesn't contain is
        // a small lie the reader has to debug around.
        label={`[${start}…${end - 1}]`}
        typeLabel={undefined}
        openBracket=""
        closeBracket=""
        count={slice.length}
        // Chunk wrappers are structural, not part of the data's own shape, so
        // they never auto-expand regardless of depth.
        depth={DEFAULT_EXPAND_DEPTH}
        renderChildren={() => (
          <EntryList
            entries={slice}
            classes={classes}
            depth={depth}
            ancestors={ancestors}
          />
        )}
      />
    )
  }
  return <>{chunks}</>
}

function CollapsibleNode({
  classes,
  label,
  typeLabel,
  openBracket,
  closeBracket,
  count,
  depth,
  copyValue,
  renderChildren,
}: {
  classes: RtkQueryDevtoolsClasses
  label: string | undefined
  typeLabel: string | undefined
  openBracket: string
  closeBracket: string
  count: number
  depth: number
  copyValue?: unknown
  renderChildren: () => ReactNode
}) {
  const [expanded, setExpanded] = useState(
    depth < DEFAULT_EXPAND_DEPTH && count <= AUTO_COLLAPSE_ENTRY_COUNT
  )

  return (
    <div>
      <div className="rtkq:flex rtkq:items-baseline rtkq:gap-1">
        <div
          className={clsx(
            "rtkq:flex rtkq:min-w-0 rtkq:flex-1 rtkq:items-baseline rtkq:gap-1 rtkq:cursor-pointer rtkq:font-mono rtkq:text-xs rtkq:select-none",
            classes.textPrimary
          )}
          onClick={() => setExpanded((e) => !e)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v)
          }}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
        >
          <span
            className={clsx(
              "rtkq:inline-flex rtkq:w-3 rtkq:items-center",
              classes.textMuted
            )}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
          {label !== undefined && (
            <span className={classes.json.key}>{label}:</span>
          )}
          {typeLabel && <span className={classes.textMuted}>{typeLabel}</span>}
          <span className={classes.textDimmed}>
            {openBracket}
            {!expanded && count > 0 ? ` ${count} ` : ""}
            {!expanded ? closeBracket : ""}
          </span>
          {expanded && count > 0 && (
            <span className={classes.textMuted}>
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        {copyValue !== undefined && (
          <CopyButton classes={classes} value={copyValue} />
        )}
      </div>
      {expanded && (
        <div
          className={clsx("rtkq:pl-3 rtkq:ml-1 rtkq:border-l", classes.border)}
        >
          {renderChildren()}
          {closeBracket && (
            <div
              className={clsx(
                "rtkq:font-mono rtkq:text-xs",
                classes.textDimmed
              )}
            >
              {closeBracket}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type CopyState = "idle" | "copied" | "error"

/**
 * The only place `safeStringify` is called, deliberately on demand, since it
 * walks the entire value (see its docstring in ../format).
 */
function CopyButton({
  classes,
  value,
}: {
  classes: RtkQueryDevtoolsClasses
  value: unknown
}) {
  const [state, setState] = useState<CopyState>("idle")

  const label =
    state === "copied"
      ? "Copied to clipboard"
      : state === "error"
        ? "Failed to copy"
        : "Copy to clipboard"

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={clsx(
        "rtkq:inline-flex rtkq:shrink-0 rtkq:cursor-pointer rtkq:items-center rtkq:border-0 rtkq:bg-transparent rtkq:p-0.5 rtkq:opacity-40 rtkq:hover:opacity-100",
        state === "copied" ? classes.status.fresh.icon : classes.textMuted
      )}
      onClick={() => {
        // Settled state is transient; ignore repeat clicks until it resets.
        if (state !== "idle") return
        const settle = (next: CopyState) => {
          setState(next)
          setTimeout(() => setState("idle"), 1500)
        }
        // Absent outside secure contexts, so this is a real branch, not paranoia.
        const clipboard = navigator.clipboard
        if (!clipboard) {
          settle("error")
          return
        }
        clipboard.writeText(safeStringify(value)).then(
          () => settle("copied"),
          () => settle("error")
        )
      }}
    >
      {state === "copied" ? (
        <Check size={11} />
      ) : state === "error" ? (
        <X size={11} />
      ) : (
        <Copy size={11} />
      )}
    </button>
  )
}

function TreeRow({
  classes,
  label,
  valueNode,
}: {
  classes: RtkQueryDevtoolsClasses
  label: string | undefined
  valueNode: ReactNode
}) {
  return (
    <div className="rtkq:font-mono rtkq:text-xs rtkq:py-px rtkq:pl-3.5">
      {label !== undefined && (
        <span className={classes.json.key}>{label}: </span>
      )}
      {valueNode}
    </div>
  )
}

function PrimitiveToken({
  classes,
  value,
}: {
  classes: RtkQueryDevtoolsClasses
  value: unknown
}) {
  if (value === undefined)
    return (
      <Token classes={classes} kind="muted">
        undefined
      </Token>
    )
  if (value === null)
    return (
      <Token classes={classes} kind="muted">
        null
      </Token>
    )
  if (typeof value === "string")
    return (
      <Token classes={classes} kind="string">
        &quot;{value}&quot;
      </Token>
    )
  if (typeof value === "number")
    return (
      <Token classes={classes} kind="number">
        {String(value)}
      </Token>
    )
  if (typeof value === "boolean")
    return (
      <Token classes={classes} kind="boolean">
        {String(value)}
      </Token>
    )
  if (typeof value === "bigint")
    return (
      <Token classes={classes} kind="number">
        {value.toString()}n
      </Token>
    )
  if (typeof value === "function") {
    return (
      <Token classes={classes} kind="muted">
        [Function: {value.name || "anonymous"}]
      </Token>
    )
  }
  if (typeof value === "symbol")
    return (
      <Token classes={classes} kind="muted">
        {value.toString()}
      </Token>
    )
  if (value instanceof Date)
    return (
      <Token classes={classes} kind="string">
        {value.toISOString()}
      </Token>
    )
  return (
    <Token classes={classes} kind="muted">
      {String(value)}
    </Token>
  )
}

function Token({
  classes,
  kind,
  children,
}: {
  classes: RtkQueryDevtoolsClasses
  kind: "string" | "number" | "boolean" | "muted"
  children: ReactNode
}) {
  return <span className={classes.json[kind]}>{children}</span>
}
