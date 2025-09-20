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
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

function getOrigin(): string {
  return typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
}
function getUA(): string {
  const nav = (globalThis as any)?.navigator;
  return typeof nav?.userAgent === 'string' ? nav.userAgent : '';
}
function isMobileUA(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(getUA());
}
function open(href: string) {
  try {
    const w = window.open(href, '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = href;
  } catch {
    window.location.href = href;
  }
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(storageKey) === '1') setAlreadyLiked(true);
  }, [storageKey]);

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

  // ----- Share helpers (URL-first everywhere) -----
  function sharePayload() {
    const url = `${getOrigin()}/p/${post.id}`; // pretty page with OG
    const caption = (post.caption || '').trim();
    const text = [url, caption].filter(Boolean).join('\n\n');
    return { url, caption, text, encodedText: encodeURIComponent(text) };
  }

  async function systemShare() {
    const { text } = sharePayload();
    // Text only (contains URL first). Most apps will still unfurl the URL.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({ title: 'Budstagram', text });
        return;
      } catch { /* fall through */ }
    }
    // Fallback to copy + open WA Web
    await copyLink();
    const { encodedText } = sharePayload();
    open(`https://wa.me/?text=${encodedText}`);
  }

  async function copyLink() {
    const { text } = sharePayload();
    try {
      await (navigator as any)?.clipboard?.writeText?.(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  function shareWhatsApp() {
    const { encodedText } = sharePayload();
    const appURL = `whatsapp://send?text=${encodedText}`;
    const webURL = `https://wa.me/?text=${encodedText}`;
    if (isMobileUA()) {
      try { window.location.href = appURL; } catch {}
      setTimeout(() => { try { window.location.href = webURL; } catch { open(webURL); } }, 900);
    } else {
      open(webURL);
    }
  }

  function shareTelegram() {
    const { url, caption } = sharePayload();
    const href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(caption)}`;
    open(href);
  }

  function shareFacebook() {
    const { url, caption } = sharePayload();
    // FB reads OG from the URL; quote pre-fills post text.
    const href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(caption)}`;
    open(href);
  }

  function shareTwitter() {
    const { url, caption } = sharePayload();
    const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(url)}`;
    open(href);
  }

  function shareInstagram() {
    // No official web intent. Use system share if available, else copy text.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      const { text } = sharePayload();
      (navigator as any).share({ title: 'Budstagram', text }).catch(() => {});
    } else {
      copyLink();
      alert('Text + link copied. Open Instagram and paste.');
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
      <div className="p-4 space-y-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.caption}</p>
        <div className="text-xs opacity-60">{fmt(post.createdAt)}</div>

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
            <span>{alreadyLiked ? 'Liked' : (liking ? 'Liking…' : 'Like')}</span>
          </button>

          {/* Share menu */}
          <div className="relative">
            <button
              onClick={() => setShareOpen((v) => !v)}
              className="inline-flex items-center gap-2 text-sm rounded-full border px-3 py-1 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              type="button"
              aria-haspopup="menu"
              aria-expanded={shareOpen}
            >
              ⤴ Share
            </button>

            {shareOpen && (
              <div
                className="absolute z-10 mt-2 w-72 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg p-2"
                role="menu"
              >
                <div className="px-2 pb-2 text-xs opacity-70">Share URL + caption</div>
                <div className="grid grid-cols-2 gap-2 p-2">
                  <button onClick={() => { setShareOpen(false); systemShare(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">System Share</button>
                  <button onClick={() => { setShareOpen(false); shareWhatsApp(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">WhatsApp</button>
                  <button onClick={() => { setShareOpen(false); shareTelegram(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">Telegram</button>
                  <button onClick={() => { setShareOpen(false); shareFacebook(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">Facebook</button>
                  <button onClick={() => { setShareOpen(false); shareTwitter(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">X (Twitter)</button>
                  <button onClick={() => { setShareOpen(false); shareInstagram(); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" type="button">Instagram</button>
                  <button onClick={async () => { await copyLink(); setShareOpen(false); }} className="rounded border px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 col-span-2" type="button">
                    {copied ? 'Copied ✓' : 'Copy text + link'}
                  </button>
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
