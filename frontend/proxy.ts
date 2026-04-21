// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const publicPaths = ['/login', '/signup']
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  )

  const csrfToken = request.headers.get('x-csrf-token')
  const accessToken = request.cookies.get('accessToken')?.value

  const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
  if (!isPublicPath && protectedMethods.includes(request.method) && !csrfToken) {
    return new NextResponse(JSON.stringify({ message: 'CSRF token missing' }), {
      status: 403,
    })
  }

  if (!isPublicPath && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublicPath && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}