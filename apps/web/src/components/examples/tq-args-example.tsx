import { fetchPost } from "@rtk-query-devtools/demo-api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const IDS = [1, 2, 3, 4, 5];

export function TqArgsExample() {
  const [selectedId, setSelectedId] = useState(1);
  const { data, isFetching } = useQuery({
    queryKey: ["post", selectedId],
    queryFn: () => fetchPost(selectedId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query arguments</CardTitle>
        <CardDescription>
          Each ID is its own query key:{" "}
          <code className="font-mono text-foreground">["post", 1]</code>,{" "}
          <code className="font-mono text-foreground">["post", 2]</code>… each cached independently
          in the TanStack Query panel.
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
