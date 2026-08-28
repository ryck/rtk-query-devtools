import { Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  useAddPostMutation,
  useDeletePostMutation,
  useListPostsQuery,
} from "@rtk-query-devtools/demo-api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export function PostsPanel() {
  const { data: posts, isLoading, isFetching } = useListPostsQuery()
  const [addPost, { isLoading: isAdding }] = useAddPostMutation()
  const [deletePost] = useDeletePostMutation()
  const [title, setTitle] = useState("")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Posts
          {isFetching && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        <CardDescription>
          A normal query (<code>listPosts</code>) with tag-based cache
          invalidation. Adding a post invalidates the <code>Post:LIST</code>{" "}
          tag, which refetches this list automatically. watch it happen in the
          Timeline tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            addPost({ title, body: "Added from the demo app." })
            setTitle("")
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New post title…"
          />
          <Button type="submit" disabled={isAdding}>
            {isAdding ? <Loader2 className="animate-spin" /> : <Plus />}
            Add
          </Button>
        </form>

        <Separator />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {posts?.map((post) => (
              <li
                key={post.id}
                className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium">{post.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {post.body}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${post.title}`}
                  onClick={() => deletePost(post.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
