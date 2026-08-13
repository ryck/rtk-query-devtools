import { useGetPostQuery } from "@rtk-query-devtools/demo-api";
import { clsx } from "clsx";
import { useState } from "react";
import { Card } from "@/components/ui/card";

const IDS = [1, 2, 3, 4, 5];

export function ArgsExample() {
  const [selectedId, setSelectedId] = useState(1);
  const { data, isFetching } = useGetPostQuery(selectedId);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-paper">Query arguments</h3>
      <p className="mt-1 text-sm text-mist">
        Each ID is its own cache entry — <code className="font-mono text-paper">getPost(1)</code>,{" "}
        <code className="font-mono text-paper">getPost(2)</code>… Switch between a few and watch the
        ones you leave go <code className="font-mono text-paper">inactive</code> in the Queries tab
        instead of disappearing.
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelectedId(id)}
            className={clsx(
              "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors",
              id === selectedId
                ? "border-amber bg-amber/15 text-amber"
                : "border-panel-line text-mist hover:border-mist hover:text-paper",
            )}
          >
            {id}
          </button>
        ))}
      </div>
      <p className="mt-3 font-mono text-xs text-mist">
        {isFetching ? "Loading…" : data ? `#${data.id}: ${data.title}` : "—"}
      </p>
    </Card>
  );
}
