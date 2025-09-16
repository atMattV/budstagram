'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)

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

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      setStatus('Post created!')
      setCaption('')
      setFile(null)
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
      setStatus(`Failed: ${error}`)
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
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
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Post
        </button>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </main>
  )
}
