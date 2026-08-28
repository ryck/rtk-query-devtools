import {
  createPost,
  fetchPosts,
  removePost,
} from "@rtk-query-devtools/demo-api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function TqPostsExample() {
  const queryClient = useQueryClient()
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  })
  const addPost = useMutation({
    mutationFn: createPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  })
  const deletePost = useMutation({
    mutationFn: removePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  })
  const [title, setTitle] = useState("")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts &amp; tags</CardTitle>
        <CardDescription>
          Adding a post invalidates the{" "}
          <code className="font-mono text-foreground">["posts"]</code> query
          key. Watch it refetch automatically in the TanStack Query panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            addPost.mutate({ title, body: "Added from the examples page." })
            setTitle("")
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New post title…"
            className="font-mono text-sm"
          />
          <Button type="submit" size="sm" disabled={addPost.isPending}>
            {addPost.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Add
          </Button>
        </form>

        <ul className="mt-4 flex max-h-56 flex-col gap-1.5 overflow-y-auto">
          {isLoading ? (
            <li className="font-mono text-sm text-muted-foreground">
              Loading…
            </li>
          ) : (
            posts?.map((post) => (
              <li
                key={post.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 font-mono text-sm text-foreground"
              >
                <span className="truncate">{post.title}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete ${post.title}`}
                  onClick={() => deletePost.mutate(post.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
