import { useListPostsInfiniteInfiniteQuery } from "@rtk-query-devtools/demo-api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function InfiniteExample() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListPostsInfiniteInfiniteQuery();
  const posts = data?.pages.flat() ?? [];

  return (
    <Card>
      <h3 className="text-sm font-semibold text-paper">Infinite query</h3>
      <p className="mt-1 text-sm text-mist">
        Paginated with <code className="font-mono text-paper">builder.infiniteQuery</code> — the
        Queries tab labels this entry's Type as{" "}
        <code className="font-mono text-paper">infinitequery</code>, not{" "}
        <code className="font-mono text-paper">query</code>.
      </p>
      <ul className="mt-4 flex max-h-40 flex-col gap-1.5 overflow-y-auto">
        {posts.map((post) => (
          <li
            key={post.id}
            className="rounded-md border border-panel-line px-3 py-2 font-mono text-sm text-paper"
          >
            {post.title}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
          {isFetchingNextPage && <Loader2 size={13} className="animate-spin" />}
          {hasNextPage ? "Load more" : "No more posts"}
        </Button>
      </div>
    </Card>
  );
}
