'use client'

import { useState, useEffect } from 'react'

type Post = {
  id: string
  imageUrl: string
  caption: string
  createdAt: string
  likes: number
}

const MAX_DIM = 1920;        // cap long edge to 1920px
const QUALITY = 0.82;        // 0..1
const TARGET_TYPE = 'image/webp'; // smaller than JPEG on mobile

async function downscaleImage(file: File): Promise<File> {
  // If already small, pass through
  if (!file.type.startsWith('image/')) return file;

  const bmp = await (('createImageBitmap' in window)
    ? createImageBitmap(file).catch(() => null)
    : Promise.resolve(null));

  let imgW = 0, imgH = 0, draw: (ctx: CanvasRenderingContext2D) => void;

  if (bmp) {
    imgW = bmp.width; imgH = bmp.height;
    draw = (ctx) => { ctx.drawImage(bmp, 0, 0, imgW, imgH) };
  } else {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = URL.createObjectURL(file);
    });
    imgW = img.naturalWidth; imgH = img.naturalHeight;
    draw = (ctx) => { ctx.drawImage(img, 0, 0, imgW, imgH) };
  }

  const scale = Math.min(1, MAX_DIM / Math.max(imgW, imgH));
  const w = Math.max(1, Math.round(imgW * scale));
  const h = Math.max(1, Math.round(imgH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return file;

  // High quality sampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  draw(ctx);

  const blob: Blob = await new Promise((res) =>
    canvas.toBlob(
      // iOS Safari supports webp since 16; fallback to jpeg if needed
      (b) => res(b || file),
      (canvas.toDataURL(TARGET_TYPE).length > 0 ? TARGET_TYPE : 'image/jpeg'),
      QUALITY
    )
  );

  const ext = (blob.type === 'image/webp') ? 'webp' : 'jpg';
  const name = `bud_${Date.now()}.${ext}`;
  return new File([blob], name, { type: blob.type, lastModified: Date.now() });
}

export default function AdminPage() {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])

  async function loadPosts() {
    const res = await fetch('/api/posts?all=1', { cache: 'no-store' })
    if (!res.ok) return
    const { items } = (await res.json()) as { items: Post[]; nextCursor: string | null }
    setPosts(items)
  }

  useEffect(() => { loadPosts() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setStatus('Please select a file first'); return }
    setStatus('Optimizing…')

    const optimized = await downscaleImage(file)

    setStatus('Uploading…')
    const formData = new FormData()
    formData.append('file', optimized, optimized.name)
    formData.append('caption', caption)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      setStatus('Post created!')
      setCaption('')
      setFile(null)
      await loadPosts()
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
      setStatus(`Failed: ${error}`)
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-6">Add New Post</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full p-2 border rounded text-black"
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Post
          </button>
        </form>
        {status && <p className="mt-4 text-sm">{status}</p>}
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
                <span>{new Date(post.createdAt).toLocaleString()}</span>
                <span>{post.likes} {post.likes === 1 ? 'like' : 'likes'}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
