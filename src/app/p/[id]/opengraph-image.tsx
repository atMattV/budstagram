import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage({ params }: { params: { id: string } }) {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const origin = host ? `${proto}://${host}` : '';
  const src = `${origin}/img/${params.id}.jpg`; // clean JPG for bots

  return new ImageResponse(
    <div
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        display: 'flex',
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#000',
      }}
    />,
    size
  );
}
