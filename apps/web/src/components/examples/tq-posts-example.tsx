import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPost, fetchPosts, removePost } from "@rtk-query-devtools/demo-api";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TqPostsExample() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useQuery({ queryKey: ["posts"], queryFn: fetchPosts });
  const addPost = useMutation({
    mutationFn: createPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
  const deletePost = useMutation({
    mutationFn: removePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });
  const [title, setTitle] = useState("");

  return (
    <Card>
      <h3 className="text-sm font-semibold text-paper">Posts &amp; tags</h3>
      <p className="mt-1 text-sm text-mist">
        Adding a post invalidates the <code className="font-mono text-paper">["posts"]</code> query
        key — watch it refetch automatically in the TanStack Query panel.
      </p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addPost.mutate({ title, body: "Added from the examples page." });
          setTitle("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New post title…"
          className="min-w-0 flex-1 rounded-md border border-panel-line bg-ink px-3 py-1.5 font-mono text-sm text-paper placeholder:text-mist focus:border-amber focus:outline-none"
        />
        <Button type="submit" variant="solid" disabled={addPost.isPending}>
          {addPost.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
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
              <button
                type="button"
                aria-label={`Delete ${post.title}`}
                onClick={() => deletePost.mutate(post.id)}
                className="shrink-0 text-mist hover:text-coral"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
