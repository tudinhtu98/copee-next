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
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}

async function proxy(req: NextRequest, path: string[]) {
  const session = await getServerSession(authOptions as any) as any
  const token = session?.accessToken
  const url = process.env.NEXT_PUBLIC_API_BASE_URL + '/' + path.join('/') + (req.nextUrl.search || '')
  const res = await fetch(url, {
    method: req.method,
    headers: { 'Content-Type': req.headers.get('content-type') || 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: req.method === 'GET' ? undefined : await req.text(),
    cache: 'no-store',
  })
  const text = await res.text()
  return new NextResponse(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } })
}
