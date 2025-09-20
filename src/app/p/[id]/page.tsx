import { prisma } from '@/lib/db'
import type { Metadata } from 'next'
import { headers } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    select: { id: true, caption: true, createdAt: true },
  })
}

function getOriginFromHeaders() {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}` : ''
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPost(params.id)
  if (!post) return { title: 'Post not found' }

  const origin = getOriginFromHeaders()
  const pageUrl = `${origin}/p/${post.id}`
  const ogImage = `${origin}/img/${post.id}`
  const title = 'Budstagram'
  const description = (post.caption || '').slice(0, 180)

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: 'article',
      url: pageUrl,
      images: [{ url: ogImage /* width/height optional */ }],
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
    <main className="max-w-md mx-auto p-4">
      {/* simple, clean card matching feed style */}
      <article className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="p-4 text-xs opacity-60">
          {new Date(post.createdAt).toLocaleString()}
        </div>
        <img
          src={`/img/${post.id}`}
          alt={post.caption || 'Budstagram post'}
          className="w-full object-cover aspect-square"
        />
        {post.caption && (
          <div className="p-4">
            <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
          </div>
        )}
      </article>
    </main>
  )
}
