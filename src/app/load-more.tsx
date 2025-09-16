'use client'

import { useState } from 'react'
import PostCard from '@/components/PostCard'

type Post = {
  id: string
  imageUrl: string
  caption: string
  createdAt: string
}

type ApiResponse = {
  items: Post[]
  nextCursor: string | null
}

export default function LoadMore({ initialCursor }: { initialCursor: string }) {
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!cursor || loading) return

    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/posts?cursor=${encodeURIComponent(cursor)}`)
      if (!res.ok) throw new Error('Failed to load more posts')

      const data: ApiResponse = await res.json()
      setItems((prev) => [...prev, ...data.items])
      setCursor(data.nextCursor ?? null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6">
      <div className="grid gap-6">
        {items.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {cursor && (
        <button
          onClick={load}
          disabled={loading}
          className="mt-4 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 py-2 disabled:opacity-50"
          type="button"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
