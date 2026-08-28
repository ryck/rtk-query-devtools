import { fetchPostSlow } from "@rtk-query-devtools/demo-api"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function TqSlowExample() {
  const [id, setId] = useState<number | undefined>(undefined)
  const { data, isFetching } = useQuery({
    queryKey: ["post-slow", id ?? 1],
    queryFn: () => fetchPostSlow(id ?? 1),
    enabled: id !== undefined,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slow query</CardTitle>
        <CardDescription>
          Takes 2.5s on purpose. Open the TanStack Query panel and watch the{" "}
          <code className="font-mono text-foreground">fetching</code> status
          linger.
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
        {data && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Loaded: {data.title}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
