export interface Post {
  id: number
  title: string
  body: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const DB: Post[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: `Post #${i + 1}`,
  body: `This is the body of post ${i + 1}. Cached by whichever data-fetching library asked for it.`,
}))

let nextId = DB.length + 1
let flakyAttempt = 0

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * A tiny in-memory "backend" instead of MSW, shared by both the RTK Query
 * and TanStack Query demo APIs so their examples hit identical data and
 * timing, making the two devtools panels directly comparable.
 */
export async function fetchPosts(): Promise<Post[]> {
  await delay(400)
  // A fresh array, not the shared `DB` reference, because both RTK Query and
  // TanStack Query skip re-render when `data` is referentially unchanged,
  // so returning the same mutated array twice would hide writes (e.g.
  // createPost's `DB.push`) from the UI.
  return [...DB]
}

export async function fetchPostsPage(page: number): Promise<Post[]> {
  await delay(300)
  const pageSize = 3
  const start = (page - 1) * pageSize
  return DB.slice(start, start + pageSize)
}

export async function fetchPost(id: number): Promise<Post> {
  await delay(150)
  const post = DB.find((p) => p.id === id)
  if (!post) throw new ApiError(404, "Not found")
  return post
}

export async function fetchPostSlow(id: number): Promise<Post> {
  await delay(2500)
  const post = DB.find((p) => p.id === id)
  if (!post) throw new ApiError(404, "Not found")
  return post
}

export async function fetchPostsFlaky(): Promise<Post[]> {
  await delay(500)
  flakyAttempt++
  if (flakyAttempt % 3 !== 0) {
    throw new ApiError(503, "Service temporarily unavailable")
  }
  return DB.slice(0, 3)
}

export async function createPost(draft: {
  title: string
  body: string
}): Promise<Post> {
  await delay(350)
  const post: Post = { id: nextId++, ...draft }
  DB.push(post)
  return post
}

export async function removePost(id: number): Promise<{ id: number }> {
  await delay(200)
  const index = DB.findIndex((p) => p.id === id)
  if (index !== -1) DB.splice(index, 1)
  return { id }
}
