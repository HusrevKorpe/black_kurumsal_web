import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Oturumu kapatır ve giriş sayfasına yollar.
 * GET: requireStaff'in zorunlu çıkışı (Supabase kullanıcısı var ama personel değil).
 * POST: paneldeki "Çıkış" düğmesi.
 */
async function signOutAndRedirect(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  // Yalnızca bu cihazın oturumu kapanır. Varsayılan 'global' patronun telefonundaki oturumu da düşürür.
  await supabase.auth.signOut({ scope: 'local' })
  const reason = request.nextUrl.searchParams.get('reason') ?? 'signed_out'
  const url = new URL('/admin/giris', request.url)
  url.searchParams.set('reason', reason)
  return NextResponse.redirect(url, { status: 303 })
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request)
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request)
}
