import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const PAGE_SIZE = 10

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') // ISO string of createdAt to paginate after
  const includeAll = searchParams.get('all') === '1'

  const where = includeAll ? {} : { published: true }

  const posts = await prisma.post.findMany({
    where: cursor
      ? { ...where, createdAt: { lt: new Date(cursor) } }
      : where,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    select: {
      id: true,
      imageUrl: true,
      caption: true,
      createdAt: true,
      likes: true,
      author: true,
      verified: true,
      published: true,
    },
  })

  const items = posts.map((p) => ({
    id: p.id,
    imageUrl: p.imageUrl,
    caption: p.caption,
    createdAt: p.createdAt.toISOString(),
    likes: p.likes ?? 0,
    author: p.author ?? 'The Chisp',
    verified: p.verified ?? true,
    published: p.published,
  }))

  const nextCursor =
    items.length === PAGE_SIZE ? items[items.length - 1].createdAt : null

  return NextResponse.json({ items, nextCursor })
}

// DELETE handler for admin
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    await prisma.post.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
