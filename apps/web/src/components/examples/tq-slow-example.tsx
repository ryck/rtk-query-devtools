import { useQuery } from "@tanstack/react-query";
import { fetchPostSlow } from "@rtk-query-devtools/demo-api";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TqSlowExample() {
  const [id, setId] = useState<number | undefined>(undefined);
  const { data, isFetching } = useQuery({
    queryKey: ["post-slow", id ?? 1],
    queryFn: () => fetchPostSlow(id ?? 1),
    enabled: id !== undefined,
  });

  return (
    <Card>
      <h3 className="text-sm font-semibold text-paper">Slow query</h3>
      <p className="mt-1 text-sm text-mist">
        Takes 2.5s on purpose — open the TanStack Query panel and watch the{" "}
        <code className="font-mono text-paper">fetching</code> status linger.
      </p>
      <div className="mt-4">
        <Button onClick={() => setId((prev) => (prev ?? 0) + 1)} disabled={isFetching}>
          {isFetching && <Loader2 size={13} className="animate-spin" />}
          Fetch post {((id ?? 0) % 8) + 1}
        </Button>
      </div>
      {data && <p className="mt-3 font-mono text-xs text-mist">Loaded: {data.title}</p>}
    </Card>
  );
}
