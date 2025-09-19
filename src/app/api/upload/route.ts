// src/app/api/upload/route.ts
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const caption = (form.get('caption') as string) || ''
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')
    const key = `bud/${Date.now()}-${crypto.randomUUID()}-${safeName}`

    // FIX: pass the File (or use Buffer.from(await file.arrayBuffer()) in Node runtime)
    const blob = await put(key, file, {
      access: 'public',
      contentType: file.type || 'image/jpeg',
    })

    const post = await prisma.post.create({
      data: {
        caption,
        imageUrl: blob.url,
        published: true,
      },
    })

    revalidatePath('/')

    return NextResponse.json({ success: true, post })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
