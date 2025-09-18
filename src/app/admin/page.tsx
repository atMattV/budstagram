'use client';

import { useState, useEffect, useRef } from 'react';
import { upload } from '@vercel/blob/client';

type Post = {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  likes: number;
};

function fmt(dtISO: string) {
  const d = new Date(dtISO);
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

// shrink large images before upload (mobile photos are huge)
async function shrinkImage(file: File, maxDim = 1200, quality = 0.75): Promise<File> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = URL.createObjectURL(file);
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), 'image/jpeg', quality)
  );
  URL.revokeObjectURL(img.src);

  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

export default function AdminPage() {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [diag, setDiag] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadPosts() {
    const res = await fetch('/api/posts?all=1', { cache: 'no-store' });
    if (res.ok) {
      const { items } = await res.json();
      setPosts(items);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDiag(null);
    if (!file) {
      setStatus('Please select a file first');
      return;
    }

    setPosting(true);
    setStatus('Uploading...');

    try {
      // 1) Direct browser → Vercel Blob (via handleUploadUrl)
      const up = await upload(file.name || 'upload', file, {
        access: 'public',
        handleUploadUrl: '/api/blob/handle',
        contentType: file.type || 'application/octet-stream',
      });
      const imageUrl = up.url;

      // 2) Create DB record and revalidate feed
      const createRes = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caption, imageUrl }),
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!createRes.ok) {
        const t = await createRes.text().catch(() => '');
        throw new Error(`create post failed: ${createRes.status} ${t}`);
      }

      setStatus('Post created!');
      setDiag(null);
      setCaption('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadPosts();
    } catch (err: any) {
      const msg = err?.message || String(err);
      setStatus('Failed');
      setDiag(msg);
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post permanently?')) return;
    const res = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert('Failed to delete');
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-6">Add New Post</h1>
        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0] || null;
              if (!f) return setFile(null);
              try {
                const small = await shrinkImage(f);
                setFile(small);
              } catch {
                setFile(f); // fallback if shrink fails
              }
            }}
            className="w-full"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full p-2 border rounded bg-black text-neutral-200 placeholder-neutral-500"
          />
          <button
            type="submit"
            disabled={posting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {posting ? 'Uploading…' : 'Post'}
          </button>
        </form>
        {status && <p className="mt-4 text-sm">{status}</p>}
        {diag && (
          <pre className="mt-2 whitespace-pre-wrap break-words text-xs opacity-70 border border-neutral-800 rounded p-2">
            {diag}
          </pre>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">All Posts</h2>
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="border p-3 rounded flex flex-col gap-2">
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full aspect-square object-cover rounded"
              />
              <p className="text-sm">{post.caption}</p>
              <div className="flex justify-between items-center text-xs opacity-70">
                <span>{fmt(post.createdAt)}</span>
                <span>{post.likes} {post.likes === 1 ? 'like' : 'likes'}</span>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                className="self-end mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
