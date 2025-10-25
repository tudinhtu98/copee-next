import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function POST(req: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: 'API base URL is not configured' }, { status: 500 })
  }

  const payload = await req.text()
  const endpoint = API_BASE_URL.replace(/\/$/, '') + '/auth/register'
  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': req.headers.get('content-type') ?? 'application/json',
    },
    body: payload,
  })

  const body = await upstream.text()
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  })
}
