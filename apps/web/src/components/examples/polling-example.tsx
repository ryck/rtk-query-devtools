import { useListUsersQuery } from "@rtk-query-devtools/demo-api"
import { Radio } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function PollingExample() {
  const [enabled, setEnabled] = useState(true)
  const { data, fulfilledTimeStamp } = useListUsersQuery(undefined, {
    pollingInterval: enabled ? 2000 : 0,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Polling</CardTitle>
        <CardDescription>
          Refetches every 2s while on. Open the Queries tab and watch the{" "}
          <code className="font-mono text-foreground">polling</code> pill, or
          the Timeline tab to see a request land on schedule with nothing on the
          page to trigger it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={() => setEnabled((v) => !v)}
          >
            <Radio
              size={13}
              className={enabled ? "animate-pulse" : undefined}
            />
            {enabled ? "Polling on" : "Polling off"}
          </Button>
          {fulfilledTimeStamp && (
            <span className="font-mono text-xs text-muted-foreground">
              last fetch {new Date(fulfilledTimeStamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        {data && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {data.length} users loaded.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
