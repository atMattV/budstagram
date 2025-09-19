import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

const COOKIE = 'bud_device'
const maxAge = 60 * 60 * 24 * 400

export async function GET(
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
    const liked = await prisma.like.findUnique({
      where: { postId_deviceId: { postId: params.id, deviceId } },
      select: { id: true },
    })

    const res = NextResponse.json({ liked: Boolean(liked) })
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
