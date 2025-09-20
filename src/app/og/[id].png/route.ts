import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const src = searchParams.get('src')
  if (!src) return new Response('Missing src', { status: 400 })

  // Basic sanitize
  try { new URL(src) } catch { return new Response('Bad src', { status: 400 }) }

  // Render the remote image as a full-bleed background
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#000',
        }}
      />
    ),
    {
      width: 1200,
      height: 630,
      // PNG plays nice with most scrapers
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, s-maxage=86400' },
    }
  )
}
