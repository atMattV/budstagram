'use client'

import { useEffect, useRef, useState } from 'react'

type Post = {
  id: string
  imageUrl: string
  caption: string
  createdAt: string
  likes: number
}

const MAX_DIM = 1920
const QUALITY = 0.82

async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const url = URL.createObjectURL(file)
  try {
    // Decode via object URL (faster + more reliable than FileReader base64)
    const img = new Image()
    // hint decoders to work off-thread when supported
    ;(img as any).decoding = 'async'
    const loaded = new Promise<void>((res, rej) => {
      img.onload = () => res()
      img.onerror = rej
    })
    img.src = url
    await loaded
    if ('decode' in img) {
      try { await (img as any).decode() } catch { /* Safari sometimes throws; ignore */ }
    }

    const w0 = (img as HTMLImageElement).naturalWidth || (img as any).width || 0
    const h0 = (img as HTMLImageElement).naturalHeight || (img as any).height || 0
    if (!w0 || !h0) return file

    const scale = Math.min(1, MAX_DIM / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * scale))
    const h = Math.max(1, Math.round(h0 * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return file
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)

    // Encode helper with timeout (avoids "stuck" toBlob on some gallery files)
    const encode = (type: string, q: number, timeoutMs = 8000) =>
      new Promise<Blob | null>((resolve) => {
        let done = false
        const t = setTimeout(() => !done && resolve(null), timeoutMs)
        canvas.toBlob(
          (b) => {
            done = true
            clearTimeout(t)
            resolve(b ?? null)
          },
          type,
          q
        )
      })

    // Try WebP first; fall back to JPEG if unsupported/slow
    let blob = await encode('image/webp', QUALITY)
    if (!blob) blob = await encode('image/jpeg', 0.88)
    if (!blob) return file

    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
    const name = `bud_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    return new File([blob], name, { type: blob.type, lastModified: Date.now() })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function AdminPage() {
  const [caption, setCaption] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function loadPosts() {
    const res = await fetch('/api/posts?all=1', { cache: 'no-store' })
    if (!res.ok) return
    const { items } = (await res.json()) as { items: Post[]; nextCursor: string | null }
    setPosts(items)
  }

  useEffect(() => { loadPosts() }, [])

  function handlePick(file: File | null) {
    setSelectedFile(file)
    // Revoke old preview to avoid stale blob reuse
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
    // Reset inputs so choosing the same file re-triggers change
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) { setStatus('Select a file'); return }

    setStatus('Optimizing…')
    const optimized = await downscaleImage(selectedFile)

    setStatus('Uploading…')
    const formData = new FormData()
    formData.append('file', optimized, optimized.name)
    formData.append('caption', caption)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    })
    if (res.ok) {
      setStatus('Post created!')
      setCaption('')
      handlePick(null)
      await loadPosts()
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
      setStatus(`Failed: ${error}`)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post permanently?')) return
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE', cache: 'no-store' })
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== id))
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Failed to delete' }))
      alert(error)
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-4">Add New Post</h1>

        {/* Hidden inputs */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePick(e.target.files?.[0] || null)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handlePick(e.target.files?.[0] || null)}
        />

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-3">
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="px-4 py-2 rounded bg-neutral-200 dark:bg-neutral-700"
          >
            Choose from gallery
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="px-4 py-2 rounded bg-blue-500 text-white"
          >
            Take photo (camera)
          </button>
        </div>

        {/* Preview + filename */}
        {previewUrl && (
          <div className="mb-3">
            <img key={previewUrl} src={previewUrl} alt="preview" className="w-full aspect-square object-cover rounded" />
          </div>
        )}
        <div className="text-xs opacity-70 mb-3">
          {selectedFile ? `Selected: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'No file selected'}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="w-full p-2 rounded border border-neutral-700 bg-neutral-900 text-white placeholder-white/60"
          />
          <button
            type="submit"
            disabled={!selectedFile}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Post
          </button>
        </form>

        {status && <p className="mt-3 text-sm">{status}</p>}
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
  )
}
