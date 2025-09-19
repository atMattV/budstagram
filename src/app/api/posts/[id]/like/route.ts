import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

const COOKIE = 'bud_device'
const maxAge = 60 * 60 * 24 * 400 // ~400 days

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const jar = cookies()
  let deviceId = jar.get(COOKIE)?.value
  let shouldSet = false
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    shouldSet = true
  }

  try {
    // Idempotent like: if already exists -> no-op
    const existing = await prisma.like.findUnique({
      where: { postId_deviceId: { postId: params.id, deviceId } },
      select: { id: true },
    })

    let likes: number

    if (existing) {
      // ensure counter is consistent (cheap count on this post)
      likes = await prisma.like.count({ where: { postId: params.id } })
      await prisma.post.update({ where: { id: params.id }, data: { likes } })
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.like.create({ data: { postId: params.id, deviceId } })
        await tx.post.update({
          where: { id: params.id },
          data: { likes: { increment: 1 } },
        })
      })
      const updated = await prisma.post.findUnique({
        where: { id: params.id },
        select: { likes: true },
      })
      likes = updated?.likes ?? 0
    }

    const res = NextResponse.json({ id: params.id, liked: true, likes })
    if (shouldSet) {
      res.cookies.set(COOKIE, deviceId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge,
      })
    }
    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
