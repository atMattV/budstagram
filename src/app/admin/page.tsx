'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [caption, setCaption] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, imageUrl }),
      })
      if (!res.ok) throw new Error('Failed to save post')
      setMessage('✅ Post saved!')
      setCaption('')
      setImageUrl('')
    } catch (err: any) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📸 Add New Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
          className="w-full border rounded-md p-2"
        />
        <textarea
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          required
          className="w-full border rounded-md p-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save Post'}
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </main>
  )
}
