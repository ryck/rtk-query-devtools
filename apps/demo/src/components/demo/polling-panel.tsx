import { useState } from "react";
import { useListPostsQuery } from "@rtk-query-devtools/demo-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PollingPanel() {
  const [polling, setPolling] = useState(false);
  const { data } = useListPostsQuery(undefined, {
    pollingInterval: polling ? 3000 : 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Polling subscription</CardTitle>
        <CardDescription>
          Subscribes to the same <code>listPosts</code> cache entry with a 3s poll interval. The
          Queries tab shows a "polling" pill on this entry while active.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button variant={polling ? "destructive" : "default"} onClick={() => setPolling((p) => !p)}>
          {polling ? "Stop polling" : "Start polling (every 3s)"}
        </Button>
        {data && <p className="text-sm text-muted-foreground">{data.length} posts cached.</p>}
      </CardContent>
    </Card>
  );
}
