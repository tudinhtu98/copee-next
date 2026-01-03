import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as any

  // Không force redirect nữa, để user ở trang chủ và hiển thị modal
  // Modal sẽ xuất hiện tự động khi user.hasPassword === false

  // Protect settings: require any logged-in user
  if (pathname.startsWith('/settings')) {
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('next', '/settings')
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Protect admin area: require role ADMIN or MOD
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('next', '/admin')
      return NextResponse.redirect(url)
    }
    const role = (token as any).role
    // Nếu không có role, mặc định là USER và redirect về dashboard
    if (!role || !(role === 'ADMIN' || role === 'MOD')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protect dashboard: require logged-in USER (or higher)
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('next', '/dashboard')
      return NextResponse.redirect(url)
    }
    const role = (token as any).role
    // Chỉ USER mới vào dashboard; ADMIN/MOD được redirect sang /admin
    // Nếu không có role, mặc định coi như USER
    if (role && role !== 'USER') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/settings/:path*', '/admin/:path*', '/dashboard/:path*'],
}


