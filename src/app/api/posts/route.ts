import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const takeParam = searchParams.get('take')
  const includeAll = searchParams.get('all') === '1'

  const take = Math.min(Math.max(parseInt(takeParam || '10', 10) || 10, 1), 500)

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    where: includeAll ? {} : { published: true },
    take,
    // no select => includes likes automatically
  })

  const serialized = posts.map((post) => ({
    id: post.id,
    imageUrl: post.imageUrl,
    caption: post.caption,
    published: post.published,
    likes: post.likes, // 👈 added
    createdAt: post.createdAt.toISOString(),
  }))

  return NextResponse.json(serialized)
}
