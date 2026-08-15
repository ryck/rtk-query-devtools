import { useGetPostSlowQuery } from "@rtk-query-devtools/demo-api";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SlowExample() {
  const [id, setId] = useState<number | undefined>(undefined);
  const { data, isFetching } = useGetPostSlowQuery(id ?? 1, { skip: id === undefined });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slow query</CardTitle>
        <CardDescription>
          Takes 2.5s on purpose. Open the Queries tab below and watch the{" "}
          <code className="font-mono text-paper">fetching</code> badge linger.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setId((prev) => (prev ?? 0) + 1)}
          disabled={isFetching}
        >
          {isFetching && <Loader2 size={13} className="animate-spin" />}
          Fetch post {((id ?? 0) % 8) + 1}
        </Button>
        {data && <p className="mt-3 font-mono text-xs text-mist">Loaded: {data.title}</p>}
      </CardContent>
    </Card>
  );
}
