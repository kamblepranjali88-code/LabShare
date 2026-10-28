import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route protection map: path prefix -> minimum allowed roles
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/dashboard': ['user', 'owner', 'manager', 'admin'],
  '/bookings': ['user', 'owner', 'manager', 'admin'],
  '/resources': ['user', 'owner', 'manager', 'admin'],
  '/checkin': ['user', 'owner', 'manager', 'admin'],
  '/incidents': ['user', 'owner', 'manager', 'admin'],
  '/credentials': ['user', 'owner', 'manager', 'admin'],
  '/owner': ['owner', 'manager', 'admin'],
  '/admin': ['admin'],
  '/api/booking': ['user', 'owner', 'manager', 'admin'],
  '/api/admin': ['admin'],
  '/api/owner': ['owner', 'manager', 'admin'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // If user is not logged in and accessing a protected route, redirect to login
  const isProtected = Object.keys(PROTECTED_ROUTES).some(prefix =>
    pathname.startsWith(prefix)
  )

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If logged in, check role-based access
  if (user && isProtected) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'user'
    const matchedPrefix = Object.keys(PROTECTED_ROUTES).find(prefix =>
      pathname.startsWith(prefix)
    )

    if (matchedPrefix) {
      const allowedRoles = PROTECTED_ROUTES[matchedPrefix]
      if (!allowedRoles.includes(userRole)) {
        const forbiddenUrl = request.nextUrl.clone()
        forbiddenUrl.pathname = '/403'
        return NextResponse.redirect(forbiddenUrl)
      }
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
