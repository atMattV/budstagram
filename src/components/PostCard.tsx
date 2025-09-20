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

export default function PostCard({ post }: PostCardProps) {
  const author = post.author ?? 'The Chisp';
  const verified = post.verified ?? true;

  const [likes, setLikes] = useState<number>(post.likes);
  const [liking, setLiking] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const storageKey = useMemo(() => `liked:${post.id}`, [post.id]);
  const [alreadyLiked, setAlreadyLiked] = useState<boolean>(false);

  // Pretty paths
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const prettyImage = `/img/${post.id}`;
  const prettyPage = `${origin}/p/${post.id}`;

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
    setLikes(prev + 1); // optimistic
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

  // ---- Share helpers ----
  function fileNameFromUrl(url: string, fallback: string) {
    try { const u = new URL(url); const name = u.pathname.split('/').filter(Boolean).pop(); return name || fallback; }
    catch { return fallback; }
  }

  async function fetchImageFile(url: string, fallbackName: string): Promise<File | null> {
    try {
      const r = await fetch(url, { cache: 'no-store', mode: 'cors' });
      if (!r.ok) return null;
      const b = await r.blob();
      const name = fileNameFromUrl(url, fallbackName);
      const type = b.type || 'image/jpeg';
      return new File([b], name, { type, lastModified: Date.now() });
    } catch { return null; }
  }

  async function shareNative() {
    try {
      const file = await fetchImageFile(prettyImage, `bud_${post.id}.jpg`);
      const base: ShareData = {
        title: 'Budstagram',
        text: post.caption || 'Budstagram',
        url: prettyPage, // pretty link
      };
      const shareData =
        file && (navigator as any).canShare?.({ files: [file] })
          ? { ...base, files: [file] as any }
          : base;

      if ('share' in navigator) {
        await (navigator as any).share(shareData);
      } else {
        setShareOpen(true);
      }
    } catch {
      setShareOpen(true);
    }
  }

  function openFacebookDialog() {
    const href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(prettyPage)}`;
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  function shareWhatsAppWeb() {
    const text = encodeURIComponent(`${post.caption || ''}\n${prettyPage}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  function shareWhatsAppApp() {
    const text = encodeURIComponent(`${post.caption || ''}\n${prettyPage}`);
    window.location.href = `whatsapp://send?text=${text}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(prettyPage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function downloadImage() {
    try {
      const r = await fetch(prettyImage, { cache: 'no-store' });
      if (!r.ok) return;
      const b = await r.blob();
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileNameFromUrl(prettyImage, `bud_${post.id}.jpg`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
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
          src={prettyImage}
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

          {/* Share */}
          <div className="relative">
            <button
              onClick={shareNative}
              className="inline-flex items-center gap-2 text-sm rounded-full border px-3 py-1 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              type="button"
              aria-haspopup="menu"
              aria-expanded={shareOpen}
            >
              ⤴ Share
            </button>

            {shareOpen && (
              <div
                className="absolute z-10 mt-2 w-64 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg p-2"
                role="menu"
              >
                <div className="px-2 pb-2 text-xs opacity-70">Fallback options</div>
                <div className="grid grid-cols-2 gap-2 p-2">
                  <button onClick={() => { setShareOpen(false); openFacebookDialog(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">Facebook</button>
                  <button onClick={() => { setShareOpen(false); shareWhatsAppWeb(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">WhatsApp (Web)</button>
                  <button onClick={() => { setShareOpen(false); shareWhatsAppApp(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">WhatsApp (App)</button>
                  <button onClick={() => { setShareOpen(false); shareNative(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">Instagram (system share)</button>
                  <button onClick={async () => { await copyLink(); setShareOpen(false); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 col-span-2" type="button">
                    {copied ? 'Link copied ✓' : 'Copy post link'}
                  </button>
                  <button onClick={async () => { await downloadImage(); setShareOpen(false); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 col-span-2" type="button">Download image</button>
                </div>
                <div className="p-2">
                  <button onClick={() => setShareOpen(false)} className="w-full rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
