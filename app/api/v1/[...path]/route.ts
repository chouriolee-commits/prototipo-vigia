import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Proxy BFF: reenvía al backend usando el token JWT de la cookie httpOnly.
export async function GET(request: NextRequest, ctx: RouteContext<'/api/v1/[...path]'>) {
  return proxy(request, ctx)
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/v1/[...path]'>) {
  return proxy(request, ctx)
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/v1/[...path]'>) {
  return proxy(request, ctx)
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/v1/[...path]'>) {
  return proxy(request, ctx)
}

export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/v1/[...path]'>) {
  return proxy(request, ctx)
}

async function proxy(request: NextRequest, ctx: RouteContext<'/api/v1/[...path]'>) {
  const cookieStore = await cookies()
  const token = cookieStore.get('vigia_token')?.value

  if (!token) {
    return NextResponse.json({ detail: 'No autenticado' }, { status: 401 })
  }

  const { path } = await ctx.params
  const pathname = Array.isArray(path) ? path.join('/') : path

  const url = new URL(request.url)
  const search = url.search

  const backendUrl = `${API_URL}/api/v1/${pathname}${search}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }
  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text()
  }

  const resp = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: body || undefined,
    cache: 'no-store',
  })

  const text = await resp.text()
  const isJson = resp.headers.get('content-type')?.includes('application/json')

  const response = isJson
    ? NextResponse.json(text ? JSON.parse(text) : null, { status: resp.status })
    : new NextResponse(text, { status: resp.status })

  if (resp.status === 401) {
    cookieStore.delete('vigia_token')
  }

  return response
}