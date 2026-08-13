import { useListUsersQuery } from "@rtk-query-devtools/demo-api";
import { Radio } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PollingExample() {
  const [enabled, setEnabled] = useState(true);
  const { data, fulfilledTimeStamp } = useListUsersQuery(undefined, {
    pollingInterval: enabled ? 2000 : 0,
  });

  return (
    <Card>
      <h3 className="text-sm font-semibold text-paper">Polling</h3>
      <p className="mt-1 text-sm text-mist">
        Refetches every 2s while on — open the Queries tab and watch the{" "}
        <code className="font-mono text-paper">polling</code> pill, or the Timeline tab to see a
        request land on schedule with nothing on the page to trigger it.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => setEnabled((v) => !v)} variant={enabled ? "solid" : "outline"}>
          <Radio size={13} className={enabled ? "animate-pulse" : undefined} />
          {enabled ? "Polling on" : "Polling off"}
        </Button>
        {fulfilledTimeStamp && (
          <span className="font-mono text-xs text-mist">
            last fetch {new Date(fulfilledTimeStamp).toLocaleTimeString()}
          </span>
        )}
      </div>
      {data && <p className="mt-3 font-mono text-xs text-mist">{data.length} users loaded.</p>}
    </Card>
  );
}
