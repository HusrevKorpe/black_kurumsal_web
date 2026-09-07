import 'dotenv/config'
import { ZodError } from 'zod'
import { ensureOwner } from '@/features/staff/bootstrap'
import { generatePassword } from '@/lib/auth/generate-password'
import { db } from '@/lib/db'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * İlk patron hesabı (canlı kurulum). Hesap zaten varsa şifresini sıfırlar, kaydı OWNER ve aktif yapar.
 *   pnpm staff:owner --email=patron@ornek.com --name="Ad Soyad"
 * Canlı veritabanına karşı çalıştırmak için önce Vercel'deki değişkenleri indirin:
 *   vercel env pull .env.canli --environment=production
 *   DOTENV_CONFIG_PATH=.env.canli pnpm staff:owner --email=... --name=...
 * Şifre burada üretilir ve yalnızca bir kez yazdırılır (komut satırından şifre alınmaz; kabuk geçmişine
 * düşmesin). İlk girişten sonra panelden (Kullanıcılar → Şifre sıfırla) değiştirilmelidir.
 */
function readArg(args: string[], name: string): string {
  const prefix = `--${name}=`
  const raw = args.find((arg) => arg.startsWith(prefix))
  if (!raw) throw new Error(`${prefix}... zorunlu`)
  return raw.slice(prefix.length)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const email = readArg(args, 'email')
  const fullName = readArg(args, 'name')
  const password = generatePassword()
  const result = await ensureOwner(db, createSupabaseAdminClient(), { email, fullName, password })
  const lines = [
    result.created
      ? 'Patron hesabı oluşturuldu.'
      : 'Patron hesabı zaten vardı: şifre sıfırlandı, rol OWNER ve aktif yapıldı.',
    `Kimlik : ${result.id}`,
    `E-posta: ${email}`,
    `Şifre  : ${password}`,
    'Bu şifre bir daha gösterilmez. İlk girişten sonra panelden değiştirin.',
  ]
  process.stdout.write(`${lines.join('\n')}\n`)
}

main()
  .catch((error: unknown) => {
    if (error instanceof ZodError) {
      console.error(error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'))
    } else {
      console.error(error)
    }
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
