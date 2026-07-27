import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, images (static assets)
     * This still runs for /admin/* so sessions stay fresh and
     * unauthenticated visitors get bounced to /admin/login.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icon-light-32x32.png|icon-dark-32x32.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
