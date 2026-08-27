import { useListPostsInfiniteInfiniteQuery } from "@rtk-query-devtools/demo-api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InfiniteExample() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListPostsInfiniteInfiniteQuery();
  const posts = data?.pages.flat() ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infinite query</CardTitle>
        <CardDescription>
          Paginated with <code className="font-mono text-foreground">builder.infiniteQuery</code>.
          The Queries tab labels this entry's Type as{" "}
          <code className="font-mono text-foreground">infinitequery</code>, not{" "}
          <code className="font-mono text-foreground">query</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-md border border-border px-3 py-2 font-mono text-sm text-foreground"
            >
              {post.title}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          >
            {isFetchingNextPage && <Loader2 size={13} className="animate-spin" />}
            {hasNextPage ? "Load more" : "No more posts"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
