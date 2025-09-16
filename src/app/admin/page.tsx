'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) {
      setStatus('Select an image')
      return
    }

    setStatus('Uploading…')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('caption', caption)

    const res = await fetch('/api/posts', { method: 'POST', body: fd })
    if (!res.ok) {
      setStatus('Upload failed')
      return
    }

    setCaption('')
    setFile(null)
    e.currentTarget.reset()
    setStatus('Posted!')
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full"
          required
        />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="Write a caption…"
          className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent p-3"
        />
        <button type="submit" className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50">
          Post
        </button>
        {status && <p className="text-sm opacity-70">{status}</p>}
      </form>
    </div>
  )
}
