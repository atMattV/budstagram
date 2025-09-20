import { prisma } from '@/lib/db'
import type { Metadata } from 'next'
import { headers } from 'next/headers'

type Params = { params: { id: string } }

async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    select: { id: true, caption: true, createdAt: true },
  })
}

function getOrigin() {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}` : ''
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPost(params.id)
  if (!post) return { title: 'Post not found' }

  const origin = getOrigin()
  const pageUrl = `${origin}/p/${post.id}`
  const ogImage = `${origin}/img/${post.id}`   // ABSOLUTE URL so scrapers don’t fall back to favicon

  const title = 'Budstagram'
  const description = post.caption?.slice(0, 160) || 'Budstagram'

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: 'article',
      url: pageUrl,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function Page({ params }: Params) {
  const post = await getPost(params.id)
  if (!post) return <main className="max-w-md mx-auto p-6">Not found</main>

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <div className="text-xs opacity-60">{new Date(post.createdAt).toLocaleString()}</div>
      <img src={`/img/${post.id}`} alt={post.caption || 'Budstagram'} className="w-full rounded-xl object-cover" />
      {post.caption && <p className="text-sm whitespace-pre-wrap">{post.caption}</p>}
    </main>
  )
}
