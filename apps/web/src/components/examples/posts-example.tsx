import {
  useAddPostMutation,
  useDeletePostMutation,
  useListPostsQuery,
} from "@rtk-query-devtools/demo-api";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PostsExample() {
  const { data: posts, isLoading } = useListPostsQuery();
  const [addPost, { isLoading: isAdding }] = useAddPostMutation();
  const [deletePost] = useDeletePostMutation();
  const [title, setTitle] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts &amp; tags</CardTitle>
        <CardDescription>
          Adding a post invalidates the <code className="font-mono text-paper">Post:LIST</code> tag.
          watch <code className="font-mono text-paper">listPosts</code> refetch automatically in the
          Timeline tab below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            addPost({ title, body: "Added from the examples page." });
            setTitle("");
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New post title…"
            className="font-mono text-sm"
          />
          <Button type="submit" size="sm" disabled={isAdding}>
            {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Add
          </Button>
        </form>

        <ul className="mt-4 flex max-h-56 flex-col gap-1.5 overflow-y-auto">
          {isLoading ? (
            <li className="font-mono text-sm text-mist">Loading…</li>
          ) : (
            posts?.map((post) => (
              <li
                key={post.id}
                className="flex items-center justify-between gap-2 rounded-md border border-panel-line px-3 py-2 font-mono text-sm text-paper"
              >
                <span className="truncate">{post.title}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete ${post.title}`}
                  onClick={() => deletePost(post.id)}
                  className="text-mist hover:text-coral"
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
