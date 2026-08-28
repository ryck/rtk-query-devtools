import { fetchUsers } from "@rtk-query-devtools/demo-api"
import { useQuery } from "@tanstack/react-query"
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

export function TqPollingExample() {
  const [enabled, setEnabled] = useState(true)
  const { data, dataUpdatedAt } = useQuery({
    queryKey: ["users", "polling"],
    queryFn: fetchUsers,
    refetchInterval: enabled ? 2000 : false,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Polling</CardTitle>
        <CardDescription>
          Refetches every 2s while on. Open the TanStack Query panel and watch a
          fresh query run land on schedule with nothing on the page to trigger
          it.
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
          {dataUpdatedAt > 0 && (
            <span className="font-mono text-xs text-muted-foreground">
              last fetch {new Date(dataUpdatedAt).toLocaleTimeString()}
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
