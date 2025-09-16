// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Force Node runtime (required for @vercel/blob) and disable static caching.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    // Never trust caches on mutation endpoints.
    // Read multipart form-data
    const form = await req.formData();
    const caption = (form.get('caption') as string) || '';
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Upload to Vercel Blob (public)
    const blob = await put(file.name || 'upload', file, { access: 'public' });

    // Persist post
    const post = await prisma.post.create({
      data: {
        caption,
        imageUrl: blob.url,
        published: true,
      },
      select: {
        id: true,
        imageUrl: true,
        caption: true,
        createdAt: true,
        likes: true,
        author: true,
        verified: true,
        published: true,
      },
    });

    // Revalidate feed
    revalidatePath('/');

    return NextResponse.json(
      { success: true, post },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'Upload failed';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
