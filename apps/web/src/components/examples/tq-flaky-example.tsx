import { useQuery } from "@tanstack/react-query";
import { fetchPostsFlaky } from "@rtk-query-devtools/demo-api";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TqFlakyExample() {
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["posts-flaky"],
    queryFn: fetchPostsFlaky,
  });

  return (
    <Card>
      <h3 className="text-sm font-semibold text-paper">Flaky query</h3>
      <p className="mt-1 text-sm text-mist">
        Fails two times out of three (503). Refetch a couple of times to see rejected requests pile
        up in the TanStack Query panel.
      </p>
      <div className="mt-4">
        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={13} className={isFetching ? "animate-spin" : undefined} />
          Refetch
        </Button>
      </div>
      {error && (
        <p className="mt-3 flex items-center gap-1.5 font-mono text-xs text-coral">
          <AlertTriangle size={13} /> Request failed. Try again.
        </p>
      )}
      {data && <p className="mt-3 font-mono text-xs text-mist">Loaded {data.length} posts.</p>}
    </Card>
  );
}
