import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicEnv } from '@/lib/env'

const LOGIN_PATH = '/admin/giris'
const SIGN_OUT_PATH = '/admin/cikis'

/**
 * /admin altındaki her istekte oturumu yeniler ve giriş yapılmamışsa giriş sayfasına yollar.
 * Rol ve aktiflik kontrolü veritabanı ister; o iş admin layout'undaki requireStaff'ta yapılır.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims?.sub)
  const { pathname, search } = request.nextUrl
  const isLoginPage = pathname === LOGIN_PATH
  if (pathname === SIGN_OUT_PATH) return response

  if (!isAuthenticated && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = ''
    url.searchParams.set('next', pathname + search)
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
