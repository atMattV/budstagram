'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type PostCardProps = {
  post: {
    id: string;
    imageUrl: string;
    caption: string;
    createdAt: string;
    author?: string;
    verified?: boolean;
    likes: number;
  };
};

function fmt(dtISO: string) {
  const d = new Date(dtISO);
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

// Safe UA check
function isMobileUA(): boolean {
  const ua =
    typeof globalThis !== 'undefined' &&
    (globalThis as any).navigator &&
    typeof (globalThis as any).navigator.userAgent === 'string'
      ? ((globalThis as any).navigator.userAgent as string)
      : '';
  return /Android|iPhone|iPad|iPod/i.test(ua);
}

// Use the real deployed origin (NOT a fake domain)
function getOrigin(): string {
  return typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
}

export default function PostCard({ post }: PostCardProps) {
  const author = post.author ?? 'The Chisp';
  const verified = post.verified ?? true;

  const [likes, setLikes] = useState<number>(post.likes);
  const [liking, setLiking] = useState(false);

  const storageKey = useMemo(() => `liked:${post.id}`, [post.id]);
  const [alreadyLiked, setAlreadyLiked] = useState<boolean>(false);

  useEffect(() => {
    const isLocal = typeof window !== 'undefined' && localStorage.getItem(storageKey) === '1';
    if (isLocal) { setAlreadyLiked(true); return; }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/liked`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (alive && data.liked) {
          setAlreadyLiked(true);
          localStorage.setItem(storageKey, '1');
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, [post.id, storageKey]);

  async function handleLike() {
    if (liking || alreadyLiked) return;
    setLiking(true);
    const prev = likes;
    setLikes(prev + 1);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      if (typeof data.likes === 'number') setLikes(data.likes);
      localStorage.setItem(storageKey, '1');
      setAlreadyLiked(true);
    } catch {
      setLikes(prev);
    } finally {
      setLiking(false);
    }
  }

  // Share the pretty page URL; OG on /p/[id] provides image+caption preview
  async function shareAll() {
    const prettyPage = `${getOrigin()}/p/${post.id}`;
    const text = post.caption?.trim() || '';
    if ('share' in navigator) {
      await (navigator as any).share({ title: 'Budstagram', text, url: prettyPage });
      return;
    }
    // Fallback: WA web/app
    const encoded = encodeURIComponent([text, prettyPage].filter(Boolean).join('\n\n'));
    const href = isMobileUA() ? `whatsapp://send?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    try { window.location.href = href; } catch { window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer'); }
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
      <div className="p-4 space-y-3">
        <div className="text-xs opacity-60">{fmt(post.createdAt)}</div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>

        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70">{likes} {likes === 1 ? 'like' : 'likes'}</span>
          <button
            onClick={handleLike}
            disabled={liking || alreadyLiked}
            className="inline-flex items-center gap-2 text-sm rounded-full border px-3 py-1 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-60"
            type="button"
            aria-pressed={alreadyLiked}
          >
            <span>{alreadyLiked ? '♥' : '♡'}</span>
            <span>{alreadyLiked ? 'Liked' : (liking ? 'Liking…' : 'Like')}</span>
          </button>

          <button
            onClick={shareAll}
            className="inline-flex items-center gap-2 text-sm rounded-full border px-3 py-1 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            type="button"
            title="Share (OG preview)"
          >
            ⤴ Share
          </button>
        </div>
      </div>
    </article>
  );
}
