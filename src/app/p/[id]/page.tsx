import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, caption: true, createdAt: true },
  })
  if (!post) return <main className="max-w-md mx-auto p-6">Not found</main>

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <div className="text-xs opacity-60">{new Date(post.createdAt).toLocaleString()}</div>
      {/* Use the proxy so bots can fetch it */}
      <img src={`/img/${post.id}`} alt={post.caption || 'Budstagram'} className="w-full rounded-xl object-cover" />
      {post.caption && <p className="text-sm whitespace-pre-wrap">{post.caption}</p>}
    </main>
  )
}
