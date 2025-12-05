import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

type RouteContext = {
  params: Promise<{ path: string[] }> | { path: string[] }
}

async function getPath(ctx: RouteContext): Promise<string[]> {
  const params = ctx.params instanceof Promise ? await ctx.params : ctx.params
  return params.path
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const path = await getPath(ctx)
  return proxy(req, path)
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const path = await getPath(ctx)
  return proxy(req, path)
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const path = await getPath(ctx)
  return proxy(req, path)
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const path = await getPath(ctx)
  return proxy(req, path)
}

async function proxy(req: NextRequest, path: string[]) {
  // Check if request already has Authorization header (from Chrome Extension)
  // If yes, use it; otherwise use session token (for Next.js frontend)
  const requestAuthHeader = req.headers.get('authorization')
  let token: string | null = null

  if (requestAuthHeader && requestAuthHeader.startsWith('Bearer ')) {
    // Use token from request header (Chrome Extension API key)
    token = requestAuthHeader.substring(7) // Remove 'Bearer ' prefix
  } else {
    // Use session token (Next.js frontend)
    const session = (await getServerSession(authOptions as any)) as any
    token = session?.accessToken
  }

  if (!token) {
    console.error('[proxy] missing access token', { path })
    return NextResponse.json({ message: 'Missing access token' }, { status: 401 })
  }

  const baseUrl =
    process.env.API_BASE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')

  if (!baseUrl) {
    console.error('[proxy] missing API base URL configuration')
    return NextResponse.json({ message: 'API base URL is not configured' }, { status: 500 })
  }

  const url = baseUrl + '/' + path.join('/') + (req.nextUrl.search || '')

  const res = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: req.method === 'GET' ? undefined : await req.text(),
    cache: 'no-store',
  })

  const text = await res.text()

  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  })
}
