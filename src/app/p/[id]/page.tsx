import { prisma } from '@/lib/db';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = { params: { id: string } };

async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    select: { id: true, caption: true, createdAt: true, author: true, verified: true },
  });
}

function originFromHeaders() {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return host ? `${proto}://${host}` : '';
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPost(params.id);
  if (!post) return { title: 'Post not found', robots: { index: false, follow: false } };

  const origin = originFromHeaders();
  const pageUrl = `${origin}/p/${post.id}`;
  const ogImg = `${origin}/p/${post.id}/opengraph-image`; // Next serves PNG here

  const title = 'Budstagram';
  const description = (post.caption || '').slice(0, 180);

  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: { canonical: pageUrl },
    robots: { index: true, follow: true },
    openGraph: {
      siteName: 'Budstagram',
      title,
      description,
      type: 'article',
      url: pageUrl,
      images: [{ url: ogImg, width: 1200, height: 630, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImg],
    },
  };
}

function fmt(dt: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(dt);
}

export default async function Page({ params }: Params) {
  const post = await getPost(params.id);
  if (!post) return <main className="max-w-md mx-auto p-6">Not found</main>;

  const author = post.author ?? 'The Chisp';
  const verified = post.verified ?? true;

  return (
    <main className="max-w-md mx-auto p-4">
      <article className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        {/* header */}
        <div className="flex items-center gap-3 p-3">
          <div className="h-8 w-8 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold">
            {author.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{author}</span>
            {verified && (
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-label="Verified">
                <path d="M12 2l2.09 4.24L18.9 7.1l-3.1 3.02.73 4.38L12 12.77 7.47 14.5l.73-4.38L5.1 7.1l4.81-.86L12 2z" fill="#1DA1F2" />
                <path d="M10.5 12.3l-1.7-1.7-1.1 1.1 2.8 2.8 5.2-5.2-1.1-1.1z" fill="white" />
              </svg>
            )}
          </div>
        </div>

        {/* image */}
        <img
          src={`/img/${post.id}.jpg`}
          alt={post.caption || 'Budstagram post'}
          className="w-full object-cover aspect-square"
        />

        {/* body */}
        <div className="p-4 space-y-3">
          <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
          <div className="text-xs opacity-60">{fmt(post.createdAt)}</div>
        </div>
      </article>
    </main>
  );
}
