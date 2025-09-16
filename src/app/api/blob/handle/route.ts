// Edge handler that lets the client SDK finish the upload securely.
import { handleUpload } from '@vercel/blob/client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Optional: add your auth here (e.g., check a header or cookie) and reject if needed.
  const body = await request.json();
  const resp = await handleUpload({ body, request });
  return Response.json(resp, { headers: { 'Cache-Control': 'no-store' } });
}
