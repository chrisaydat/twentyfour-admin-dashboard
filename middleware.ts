import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  try {
    const supabase = createMiddlewareClient({ req, res })

    // Try to get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Handle protected routes
    if (!session && req.nextUrl.pathname.startsWith('/(dashboard)')) {
      // Save the original URL to redirect back after login
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Handle auth routes when already logged in
    if (session && req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  } catch (e) {
    console.error('Middleware error:', e)
    // On error, allow the request to continue
    return res
  }
}

export const config = {
  matcher: ['/(dashboard)/:path*', '/auth/:path*']
}
