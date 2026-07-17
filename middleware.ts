import { NextResponse, type NextRequest } from 'next/server'

export const middleware = async (request: NextRequest) => {
  const requestUrl = request.nextUrl
  const authCode = requestUrl.searchParams.get('code')
  const authError = requestUrl.searchParams.get('error')
  const authErrorDescription = requestUrl.searchParams.get('error_description')

  if ((authCode || authError || authErrorDescription) && requestUrl.pathname !== '/auth/callback') {
    const callbackUrl = requestUrl.clone()
    callbackUrl.pathname = '/auth/callback'

    if (!callbackUrl.searchParams.get('next')) {
      const nextPath = `${requestUrl.pathname}${requestUrl.pathname === '/' ? '' : requestUrl.search}`
      callbackUrl.searchParams.set('next', nextPath || '/map')
    }

    return NextResponse.redirect(callbackUrl)
  }

  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
