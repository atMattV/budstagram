import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const form = await req.formData()
  const caption = form.get('caption') as string
  const imageUrl = form.get('imageUrl') as string

  // auto-generate slug
  const slug = caption
    ? caption.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + Date.now()
    : 'post-' + Date.now()

  const post = await prisma.post.create({
    data: {
      caption,
      imageUrl,
      slug,
      published: true,
    },
  })

  revalidatePath('/')
  return NextResponse.json({ revalidated: true, post })
}
