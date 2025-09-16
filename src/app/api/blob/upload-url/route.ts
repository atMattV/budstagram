import { NextResponse } from 'next/server';
import { generateUploadURL } from '@vercel/blob';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST() {
  // Presign a one-time, direct-upload URL
  const signed: any = await generateUploadURL({ access: 'public' });

  // SDK versions differ on return shape; normalize to { uploadUrl }
  const uploadUrl =
    typeof signed === 'string' ? signed : signed?.url ?? signed?.uploadUrl;

  return NextResponse.json(
    { uploadUrl },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
