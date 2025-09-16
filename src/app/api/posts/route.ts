import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    where: { published: true },
  })

  const serialized = posts.map((post) => ({
    id: post.id,
    imageUrl: post.imageUrl,
    caption: post.caption,
    published: post.published,
    createdAt: post.createdAt.toISOString(),
  }))

  return NextResponse.json(serialized)
}
