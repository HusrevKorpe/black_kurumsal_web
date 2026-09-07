import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // CLI (migrate, studio) her zaman direkt bağlantıyı kullanır.
    url: env('DIRECT_DATABASE_URL'),
  },
})
