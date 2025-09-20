'use client';

import React, { useEffect, useRef, useState } from 'react';

type Post = {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  likes: number;
};

const MAX_DIM = 1920;
const QUALITY = 0.86;
const TARGET_TYPE = 'image/jpeg';

// JPEG-only, EXIF-aware, hard timeout; falls back to original if encoder stalls.
async function downscaleImage(file: File): Promise<File> {
  if (!file || !file.type?.startsWith('image/')) return file;

  // Prefer ImageBitmap (handles EXIF orientation on most browsers)
  let bmp: ImageBitmap | null = null;
  if ('createImageBitmap' in window) {
    try {
      // @ts-ignore: some TS lib versions don’t know this option
      bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      bmp = null;
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return file;

  if (bmp) {
    const s = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * s));
    const h = Math.max(1, Math.round(bmp.height * s));
    canvas.width = w; canvas.height = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    try { bmp.close(); } catch {}
  } else {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        (i as any).decoding = 'async';
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
      try { await (img as any).decode?.(); } catch {}

      const s = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * s));
      const h = Math.max(1, Math.round(img.naturalHeight * s));
      canvas.width = w; canvas.height = h;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Encode JPEG with a 4s guard; if it stalls or isn’t smaller, return original file.
  const blob: Blob | null = await new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => { if (!done) resolve(null); }, 4000);
    canvas.toBlob((b) => { done = true; clearTimeout(t); resolve(b ?? null); }, TARGET_TYPE, QUALITY);
  });
  if (!blob || blob.size >= file.size) return file;

  const name = `bud_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  return new File([blob], name, { type: TARGET_TYPE, lastModified: Date.now() });
}

const AdminPage: React.FC = () => {
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function loadPosts() {
    const res = await fetch('/api/posts?all=1', { cache: 'no-store' });
    if (!res.ok) return;
    const { items } = (await res.json()) as { items: Post[]; nextCursor: string | null };
    setPosts(items);
  }

  useEffect(() => { loadPosts(); }, []);

  function handlePick(file: File | null) {
    setSelectedFile(file);
    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return file ? URL.createObjectURL(file) : null; });
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) { setStatus('Select a file'); return; }

    setStatus('Optimizing…');
    const optimized = await downscaleImage(selectedFile);

    setStatus('Uploading…');
    const formData = new FormData();
    formData.append('file', optimized, optimized.name);
    formData.append('caption', caption);

    const res = await fetch('/api/upload', { method: 'POST', body: formData, cache: 'no-store' });
    if (res.ok) {
      setStatus('Post created!');
      setCaption('');
      handlePick(null);
      await loadPosts();
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      setStatus(`Failed: ${error}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post permanently?')) return;
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE', cache: 'no-store' });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== id));
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Failed to delete' }));
      alert(error);
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
          <button type="button" onClick={() => galleryInputRef.current?.click()} className="px-4 py-2 rounded bg-neutral-200 dark:bg-neutral-700">
            Choose from gallery
          </button>
          <button type="button" onClick={() => cameraInputRef.current?.
