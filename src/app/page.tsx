import PostCard from '@/components/PostCard'
import { prisma } from '@/lib/db'
import LoadMore from './load-more'

const PAGE_SIZE = 10

export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    where: { published: true },
    select: {
      id: true,
      imageUrl: true,
      caption: true,
      createdAt: true,
      likes: true,
      author: true,
      verified: true,
    },
  })

  const serialized = posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
  }))

  const nextCursor =
    serialized.length === PAGE_SIZE ? serialized[serialized.length - 1].createdAt : null

  return (
    <main className="max-w-md mx-auto mt-6 px-4">
      <div className="grid gap-6">
        {serialized.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      {nextCursor && <LoadMore initialCursor={nextCursor} />}
    </main>
  )
}
