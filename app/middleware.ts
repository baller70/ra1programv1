
import { NextRequest, NextResponse } from 'next/server'

// Temporarily disabled Clerk middleware for development
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const isPublicRoute = createRouteMatcher([
//   '/api/webhooks(.*)',
//   '/api/health',
//   '/api/parents(.*)',
//   '/api/payments(.*)',
//   '/api/payment-plans(.*)',
//   '/api/dashboard(.*)',
//   '/api/ai(.*)', // AI API routes for testing
//   '/api/messages(.*)', // Messages API for testing AI messaging
//   '/parents(.*)', // Parents page for testing AI functions
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/',
//   // Note: Pages like /parents, /settings require authentication
//   // API routes are protected by individual requireAuth() calls
// ])

// export default clerkMiddleware(async (auth, request) => {
//   if (!isPublicRoute(request)) {
//     await auth.protect()
//   }
// })

// Temporary middleware for development - allows all requests
export default function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
