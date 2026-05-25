import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/success',
  '/api/checkout',
  '/api/webhooks/stripe',
  '/api/audit',
  '/api/lookup-business',
])

const isAuthRoute  = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export const proxy = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()

  if (isAdminRoute(request)) {
    const adminId = process.env.ADMIN_USER_ID
    if (!adminId || userId !== adminId) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
