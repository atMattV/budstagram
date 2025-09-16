import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const caption = form.get('caption') as string
    const file = form.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Upload file to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    })

    // Save post in DB
    const post = await prisma.post.create({
      data: {
        caption,
        imageUrl: blob.url,
        published: true,
      },
    })

    // Revalidate homepage
    revalidatePath('/')

    return NextResponse.json({ success: true, post })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
