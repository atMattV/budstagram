import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace spaces/symbols with dashes
    .replace(/(^-|-$)+/g, '');   // trim leading/trailing dashes
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const caption = formData.get('caption') as string
  const imageUrl = formData.get('imageUrl') as string

  if (!caption || !imageUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const slug = slugify(caption + '-' + Date.now()) // unique slug

  const post = await prisma.post.create({
    data: {
      caption,
      imageUrl,
      slug,
      published: true,
    },
  })

  revalidatePath('/')
  return NextResponse.json(post)
}
