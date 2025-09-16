import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/admin')) return NextResponse.next()

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Basic ')) {
    return new NextResponse('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Budstagram Admin"' },
    })
  }

  const [, encoded] = auth.split(' ')
  const [u, p] = Buffer.from(encoded, 'base64').toString().split(':')
  if (u === process.env.ADMIN_USER && p === process.env.ADMIN_PASS) return NextResponse.next()

  return new NextResponse('Unauthorized', { status: 401 })
}

export const config = { matcher: ['/admin/:path*'] }
