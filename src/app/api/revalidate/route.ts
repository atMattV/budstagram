import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { caption, imageUrl } = body

    if (!caption || !imageUrl) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        caption,
        imageUrl,
        published: true,
      },
    })

    // revalidate homepage so new post shows up
    revalidatePath('/')

    return NextResponse.json({ success: true, post })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
