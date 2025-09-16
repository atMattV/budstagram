import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await prisma.post.update({
      where: { id: params.id },
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
