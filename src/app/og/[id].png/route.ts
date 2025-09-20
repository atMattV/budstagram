import React from 'react';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams, pathname } = new URL(req.url);
  const src = searchParams.get('src');
  if (!src) return new Response('Missing src', { status: 400 });

  // basic sanitize
  try { new URL(src); } catch { return new Response('Bad src', { status: 400 }); }

  const style: React.CSSProperties = {
    width: 1200,
    height: 630,
    display: 'flex',
    backgroundImage: `url(${src})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#000',
  };

  return new ImageResponse(
    React.createElement('div', { style }),
    {
      width: 1200,
      height: 630,
      // PNG is default for next/og; set cache headers explicitly
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    }
  );
}
