import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

import { prisma } from '@/lib/db'
import { slugify } from '@/lib/slug'

const PAGE_SIZE = 10

type PostPayload = {
  id: string
  imageUrl: string
  caption: string
  createdAt: string
  published: boolean
  slug: string
}

function serializePosts(posts: Awaited<ReturnType<typeof prisma.post.findMany>>): PostPayload[] {
  return posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
  }))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')

  if (!cursor) {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    })

    const items = serializePosts(posts)
    const nextCursor = items.length === PAGE_SIZE ? items[items.length - 1].createdAt : null

    return NextResponse.json({ items, nextCursor })
  }

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      createdAt: { lt: new Date(cursor) },
    },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
  })

  const items = serializePosts(posts)
  const nextCursor = items.length === PAGE_SIZE ? items[items.length - 1].createdAt : null

  return NextResponse.json({ items, nextCursor })
}

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const caption = (form.get('caption') as string | null) ?? ''

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const stamp = Date.now()

  const { url } = await put(`bud/${stamp}.${ext}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  const baseSlug = slugify(caption || 'bud')
  const slug = `${baseSlug}-${stamp}`

  const post = await prisma.post.create({
    data: {
      imageUrl: url,
      caption,
      slug,
      published: true,
    },
  })

  return NextResponse.json(
    {
      ...post,
      createdAt: post.createdAt.toISOString(),
    },
    { status: 201 },
  )
}
