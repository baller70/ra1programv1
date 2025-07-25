
import { NextRequest, NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
  '/api/health'
])

const isAdminRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/parents(.*)',
  '/payments(.*)',
  '/communication(.*)',
  '/contracts(.*)',
  '/settings(.*)',
  '/analytics(.*)',
  '/ai-insights(.*)',
  '/admin(.*)',
  '/api/admin(.*)',
  '/api/parents(.*)',
  '/api/payments(.*)',
  '/api/communication(.*)',
  '/api/contracts(.*)',
  '/api/dashboard(.*)',
  '/api/analytics(.*)',
  '/api/ai(.*)',
  '/api/templates(.*)',
  '/api/messages(.*)',
  '/api/emails(.*)',
  '/api/gmail(.*)',
  '/api/stripe(.*)',
  '/api/teams(.*)',
  '/api/recurring-messages(.*)',
  '/api/background-jobs(.*)',
  '/api/ai-recommendations(.*)',
  '/api/settings(.*)',
  '/api/notifications(.*)',
  '/api/user(.*)'
])

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth()

  // Allow access to public routes
  if (isPublicRoute(request)) {
    return NextResponse.next()
  }

  // Require authentication for protected routes
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Check admin access for admin routes
  if (isAdminRoute(request)) {
    const userRole = (sessionClaims?.metadata as { role?: string } | undefined)?.role || (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
    if (userRole !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
