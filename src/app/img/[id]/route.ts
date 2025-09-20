import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { imageUrl: true },
  })
  if (!post?.imageUrl) return new Response('Not found', { status: 404 })

  const upstream = await fetch(post.imageUrl, { cache: 'no-store' })
  if (!upstream.ok || !upstream.body) return new Response('Bad image', { status: 502 })

  const ct = upstream.headers.get('content-type') ?? 'image/jpeg'
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
