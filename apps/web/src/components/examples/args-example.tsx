import { useGetPostQuery } from "@rtk-query-devtools/demo-api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const IDS = [1, 2, 3, 4, 5];

export function ArgsExample() {
  const [selectedId, setSelectedId] = useState(1);
  const { data, isFetching } = useGetPostQuery(selectedId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query arguments</CardTitle>
        <CardDescription>
          Each ID is its own cache entry:{" "}
          <code className="font-mono text-foreground">getPost(1)</code>,{" "}
          <code className="font-mono text-foreground">getPost(2)</code>… Switch between a few and
          watch the ones you leave go <code className="font-mono text-foreground">inactive</code> in
          the Queries tab instead of disappearing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {IDS.map((id) => (
            <Button
              key={id}
              variant="outline"
              size="xs"
              onClick={() => setSelectedId(id)}
              className={
                id === selectedId
                  ? "border-primary bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary"
                  : undefined
              }
            >
              {id}
            </Button>
          ))}
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {isFetching ? "Loading…" : data ? `#${data.id}: ${data.title}` : "—"}
        </p>
      </CardContent>
    </Card>
  );
}
