'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type PostCardProps = {
  post: {
    id: string;
    imageUrl: string;
    caption: string;
    createdAt: string; // ISO from server
    author?: string;
    verified?: boolean;
    likes: number;
  };
};

function fmt(dtISO: string) {
  const d = new Date(dtISO);
  // No seconds. Locale-aware.
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export default function PostCard({ post }: PostCardProps) {
  const author = post.author ?? 'The Chisp';
  const verified = post.verified ?? true;

  const [likes, setLikes] = useState<number>(post.likes);
  const [liking, setLiking] = useState(false);

  const storageKey = useMemo(() => `liked:${post.id}`, [post.id]);
  const [alreadyLiked, setAlreadyLiked] = useState<boolean>(false);

  useEffect(() => {
    setAlreadyLiked(typeof window !== 'undefined' && localStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  async function handleLike() {
    if (liking || alreadyLiked) return;
    setLiking(true);
    const prev = likes;
    setLikes(prev + 1);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to like');
      localStorage.setItem(storageKey, '1');
      setAlreadyLiked(true);
    } catch {
      setLikes(prev);
    } finally {
      setLiking(false);
    }
  }

  return (
    <article className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm mb-6">
      {/* header */}
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

      {/* image */}
      <div className="relative aspect-square">
        <Image
          src={post.imageUrl}
          alt={post.caption.slice(0, 100) || 'Budstagram post'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>

      {/* body */}
      <div className="p-4 space-y-2">
        <div className="text-xs opacity-60">{fmt(post.createdAt)}</div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>

        {/* likes count + button */}
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70">
            {likes} {likes === 1 ? 'like' : 'likes'}
          </span>
          <button
            onClick={handleLike}
            disabled={liking || alreadyLiked}
            className="inline-flex items-center gap-2 text-sm rounded-full border px-3 py-1 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60"
            type="button"
            aria-pressed={alreadyLiked}
          >
            <span>{alreadyLiked ? '♥' : '♡'}</span>
            <span>{alreadyLiked ? 'Liked' : liking ? 'Liking…' : 'Like'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
