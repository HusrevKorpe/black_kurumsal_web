import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Auth kullanıcısını oluşturur; varsa bulur ve şifresini seed değerine çeker
 * (geliştirmede tahmin edilebilir giriş için). Kullanıcı kimliğini döndürür.
 */
export async function ensureAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  fullName: string,
): Promise<string> {
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (!created.error && created.data.user) return created.data.user.id

  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (list.error) throw new Error(`Kullanıcı listesi alınamadı: ${list.error.message}`)
  const existing = list.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!existing) throw new Error(`Kullanıcı oluşturulamadı (${email}): ${created.error?.message}`)

  const updated = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  })
  if (updated.error) throw new Error(`Şifre güncellenemedi (${email}): ${updated.error.message}`)
  return existing.id
}
