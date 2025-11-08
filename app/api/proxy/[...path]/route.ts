import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}

async function proxy(req: NextRequest, path: string[]) {
  const session = (await getServerSession(authOptions as any)) as any
  const token = session?.accessToken

  if (!token) {
    console.error('[proxy] missing access token', { path })
    return NextResponse.json({ message: 'Missing access token in session' }, { status: 401 })
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

  if (!res.ok) {
    console.error('[proxy] upstream returned error', {
      status: res.status,
      body: text,
    })
  }

  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  })
}
