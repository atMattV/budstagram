import { NextResponse } from 'next/server';
import { createUploadURL } from '@vercel/blob';

// Tiny JSON response, safe on Edge
export const runtime = 'edge';

export async function POST() {
  const uploadUrl = await createUploadURL({ access: 'public' });
  return NextResponse.json({ uploadUrl }, { headers: { 'Cache-Control': 'no-store' } });
}
