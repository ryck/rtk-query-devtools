import { fetchPostsPage } from "@rtk-query-devtools/demo-api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TqInfiniteExample() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["posts-infinite"],
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === 0 ? undefined : lastPageParam + 1,
  });
  const posts = data?.pages.flat() ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infinite query</CardTitle>
        <CardDescription>
          TanStack Query's native{" "}
          <code className="font-mono text-foreground">useInfiniteQuery</code>. Compare how each
          panel represents the same paginated data.
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
