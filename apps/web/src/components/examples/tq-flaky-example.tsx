import { fetchPostsFlaky } from "@rtk-query-devtools/demo-api"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function TqFlakyExample() {
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["posts-flaky"],
    queryFn: fetchPostsFlaky,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flaky query</CardTitle>
        <CardDescription>
          Fails two times out of three (503). Refetch a couple of times to see
          rejected requests pile up in the TanStack Query panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            size={13}
            className={isFetching ? "animate-spin" : undefined}
          />
          Refetch
        </Button>
        {error && (
          <p className="mt-3 flex items-center gap-1.5 font-mono text-xs text-destructive">
            <AlertTriangle size={13} /> Request failed. Try again.
          </p>
        )}
        {data && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Loaded {data.length} posts.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
