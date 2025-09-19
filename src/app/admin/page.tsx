'use client'

import { useState, useEffect } from 'react'

type Post = {
  id: string
  imageUrl: string
  caption: string
  createdAt: string
  likes: number
}

export default function AdminPage() {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])

  async function loadPosts() {
    const res = await fetch('/api/posts?all=1', { cache: 'no-store' })
    if (!res.ok) return
    const { items } = await res.json() as { items: Post[]; nextCursor: string | null }
    setPosts(items) // <-- was the bug (you were setting the whole object)
  }

  useEffect(() => {
    loadPosts()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setStatus('Please select a file first')
      return
    }
    setStatus('Uploading...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('caption', caption)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (res.ok) {
      setStatus('Post created!')
      setCaption('')
      setFile(null)
      loadPosts()
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
      setStatus(`Failed: ${error}`)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post permanently?')) return
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== id))
    } else {
      alert('Failed to delete')
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
