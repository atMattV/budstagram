const MAX_DIM = 1920
const QUALITY = 0.86
const TARGET_TYPE = 'image/jpeg'

async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  let bmp: ImageBitmap | null = null
  if ('createImageBitmap' in window) {
    try { /* @ts-ignore */ bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch { bmp = null }
  }

  let w = 0, h = 0
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return file

  if (bmp) {
    w = bmp.width; h = bmp.height
  } else {
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image()
        ;(i as any).decoding = 'async'
        i.onload = () => res(i)
        i.onerror = rej
        i.src = url
      })
      try { await (img as any).decode?.() } catch {}
      w = img.naturalWidth; h = img.naturalHeight
      if (!w || !h) return file

      const scale = Math.min(1, MAX_DIM / Math.max(w, h))
      const tw = Math.max(1, Math.round(w * scale))
      const th = Math.max(1, Math.round(h * scale))
      canvas.width = tw; canvas.height = th
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, tw, th)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  if (bmp) {
    const scale = Math.min(1, MAX_DIM / Math.max(w, h))
    const tw = Math.max(1, Math.round(w * scale))
    const th = Math.max(1, Math.round(h * scale))
    canvas.width = tw; canvas.height = th
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bmp, 0, 0, tw, th)
    try { bmp.close() } catch {}
  }

  const blob: Blob | null = await new Promise((resolve) => {
    let done = false
    const t = setTimeout(() => { if (!done) resolve(null) }, 4000)
    canvas.toBlob((b) => { done = true; clearTimeout(t); resolve(b ?? null) }, TARGET_TYPE, QUALITY)
  })

  if (!blob) return file
  if (blob.size >= file.size) return file

  const name = `bud_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
  return new File([blob], name, { type: TARGET_TYPE, lastModified: Date.now() })
}
