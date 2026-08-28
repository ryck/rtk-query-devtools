import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useGetPostSlowQuery } from "@rtk-query-devtools/demo-api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SlowQueryPanel() {
  const [id, setId] = useState<number | undefined>(undefined)
  const { data, isFetching } = useGetPostSlowQuery(id ?? 1, {
    skip: id === undefined,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slow query</CardTitle>
        <CardDescription>
          Deliberately takes 2.5s. Open the Queries tab and watch the "fetching"
          badge linger, then check the Timeline tab for its duration.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button
          onClick={() => setId((prev) => (prev ?? 0) + 1)}
          disabled={isFetching}
        >
          {isFetching && <Loader2 className="animate-spin" />}
          Fetch post {((id ?? 0) % 8) + 1}
        </Button>
        {data && (
          <p className="text-sm text-muted-foreground">Loaded: {data.title}</p>
        )}
      </CardContent>
    </Card>
  )
}
