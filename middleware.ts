import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect admin area: require role ADMIN or MOD
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as any
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('next', '/admin')
      return NextResponse.redirect(url)
    }
    const role = (token as any).role
    if (!(role === 'ADMIN' || role === 'MOD')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protect dashboard: require logged-in USER (or higher)
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as any
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('next', '/dashboard')
      return NextResponse.redirect(url)
    }
    const role = (token as any).role
    // Only USER can access dashboard; ADMIN/MOD are redirected to /admin
    if (role !== 'USER') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}


