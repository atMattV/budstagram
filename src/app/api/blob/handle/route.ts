import { handleUpload } from '@vercel/blob/client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await handleUpload({ body, request });
    return Response.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
