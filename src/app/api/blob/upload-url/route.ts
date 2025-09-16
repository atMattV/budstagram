import { NextResponse } from 'next/server';
import { generateUploadURL } from '@vercel/blob';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST() {
  const { url } = await generateUploadURL({ access: 'public' });
  return NextResponse.json({ uploadUrl: url }, { headers: { 'Cache-Control': 'no-store' } });
}
