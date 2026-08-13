import { AlertTriangle, RefreshCw } from "lucide-react";
import { useListPostsFlakyQuery } from "@rtk-query-devtools/demo-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FlakyQueryPanel() {
  const { data, error, isFetching, refetch } = useListPostsFlakyQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flaky query</CardTitle>
        <CardDescription>
          Fails two times out of three (503) — refetch a couple of times to see the "error" status
          and rejected entries pile up in the Timeline tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? "animate-spin" : undefined} />
          Refetch
        </Button>
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertTriangle className="size-4" /> Request failed — try again.
          </p>
        )}
        {data && <p className="text-sm text-muted-foreground">Loaded {data.length} posts.</p>}
      </CardContent>
    </Card>
  );
}
