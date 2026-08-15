import { Loader2 } from "lucide-react";
import { useListPostsInfiniteInfiniteQuery } from "@rtk-query-devtools/demo-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InfiniteQueryPanel() {
  const { data, fetchNextPage, isFetching, hasNextPage } = useListPostsInfiniteInfiniteQuery(
    undefined,
    { initialPageParam: 1 },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infinite query</CardTitle>
        <CardDescription>
          Paginated posts, 3 per page. The Queries tab classifies this entry as{" "}
          <code>infinitequery</code> from its <code>{"{ pages, pageParams }"}</code> data shape.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-1.5">
          {data?.pages.flat().map((post) => (
            <li key={post.id} className="rounded-md border p-2 text-sm">
              {post.title}
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          onClick={() => fetchNextPage()}
          disabled={isFetching || hasNextPage === false}
        >
          {isFetching && <Loader2 className="animate-spin" />}
          {hasNextPage === false ? "No more pages" : "Load next page"}
        </Button>
      </CardContent>
    </Card>
  );
}
