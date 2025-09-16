'use client'

import Image from 'next/image'
import { useState } from 'react'

type PostCardProps = {
  post: {
    id: string
    imageUrl: string
    caption: string
    createdAt: string
  }
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false)

  return (
    <article className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm mb-6">
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
        <div className="text-xs opacity-60">{new Date(post.createdAt).toLocaleString()}</div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>
        <button
          onClick={() => setLiked((v) => !v)}
          className="mt-1 inline-flex items-center gap-2 text-sm rounded-full border px-3 py-1 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
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
