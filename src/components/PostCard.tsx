// src/components/PostCard.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'

type PostCardProps = {
  post: {
    id: string
    imageUrl: string
    caption: string
    createdAt: string
    likes: number
    author?: string
    verified?: boolean
  }
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState<number>(post.likes ?? 0)

  const author = post.author ?? 'The Chisp'
  const verified = post.verified ?? true

  async function handleLike() {
    if (liked) return
    setLiked(true)
    setLikes((n) => n + 1) // optimistic

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to like')
      const data = await res.json()
      if (typeof data.likes === 'number') setLikes(data.likes)
    } catch {
      // rollback if server failed
      setLiked(false)
      setLikes((n) => Math.max(0, n - 1))
    }
  }

  return (
    <article className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm mb-6">
      {/* header like Instagram */}
      <div className="flex items-center gap-3 p-3">
        <div className="h-8 w-8 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold">
          {author.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{author}</span>
          {verified && (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-label="Verified">
              <path d="M12 2l2.09 4.24L18.9 7.1l-3.1 3.02.73 4.38L12 12.77 7.47 14.5l.73-4.38L5.1 7.1l4.81-.86L12 2z" fill="#1DA1F2" />
              <path d="M10.5 12.3l-1.7-1.7-1.1 1.1 2.8 2.8 5.2-5.2-1.1-1.1z" fill="white" />
            </svg>
          )}
        </div>
      </div>

      <div className="relative aspect-square">
        <Image
          src={post.imageUrl}
          alt={post.caption.slice(0, 100) || 'Budstagram post'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between text-xs opacity-80">
          <span>{likes.toLocaleString()} likes</span>
          <span>{new Date(post.createdAt).toLocaleString()}</span>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>

        <button
          onClick={handleLike}
          disabled={liked}
          className="mt-1 inline-flex items-center gap-2 text-sm rounded-full border px-3 py-1 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60"
          aria-pressed={liked}
          type="button"
        >
          <span>{liked ? '♥' : '♡'}</span>
          <span>{liked ? 'Liked' : 'Like'}</span>
        </button>
      </div>
    </article>
  )
}
