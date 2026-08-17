import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protege las páginas del dashboard: sin cookie de sesión → /login.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('vigia_token')?.value

  const isPublic = pathname === '/login'
  const isApi = pathname.startsWith('/api')
  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')

  if (isApi || isStatic) {
    return NextResponse.next()
  }

  if (isPublic) {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}