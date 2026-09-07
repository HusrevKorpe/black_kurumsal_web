import 'dotenv/config'
import { execSync } from 'node:child_process'

/** Test veritabanına migration uygular (bir kez, tüm entegrasyon dosyaları için). */
export default function globalSetup() {
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error('TEST_DATABASE_URL tanımlı değil (.env)')
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DIRECT_DATABASE_URL: url, DATABASE_URL: url },
  })
}
