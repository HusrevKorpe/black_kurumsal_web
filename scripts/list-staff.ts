import 'dotenv/config'
import { db } from '@/lib/db'

/**
 * Panel kullanıcılarını listeler (yalnızca okur). Şifre unutulduğunda e-postayı bulmak için:
 *   DOTENV_CONFIG_PATH=.env.canli pnpm staff:list
 */
async function main(): Promise<void> {
  const users = await db.staffUser.findMany({
    select: { email: true, fullName: true, role: true, isActive: true },
    orderBy: { role: 'asc' },
  })
  const lines = users.map(
    (u) => `${u.role.padEnd(8)} ${u.isActive ? 'aktif' : 'kapalı'}  ${u.email}  (${u.fullName})`,
  )
  process.stdout.write(`${lines.join('\n') || 'Kullanıcı yok.'}\n`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
