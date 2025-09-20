import { prisma } from '@/lib/db'
import { headers } from 'next/headers'

export const runtime = 'nodejs' // ensure server rendering

type Props = { params: { id: string } }

function getOrigin() {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}` : ''
}

export default async function Head({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, caption: true },
  })

  const origin = getOrigin()
  const pageUrl = `${origin}/p/${params.id}`
  const ogImg = `${origin}/img/${params.id}`
  const title = 'Budstagram'
  const desc = (post?.caption || '').slice(0, 180)

  return (
    <>
      <title>{title}</title>

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={ogImg} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImg} />

      {/* Bonus for some scrapers */}
      <meta name="description" content={desc} />
    </>
  )
}
