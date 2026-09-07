import { describe, expect, it } from 'vitest'
import { db } from '@/lib/db'

/**
 * Supabase REST/GraphQL API'si `public` şemasını publishable anahtarla dışa açar. RLS açık ve politika yok
 * → anon/authenticated hiçbir satırı göremez. Yeni tablo eklenip RLS unutulursa bu test kırılır
 * (migration'a `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;` eklenmeli).
 */
describe('satır düzeyi güvenlik', () => {
  it('public şemasındaki her tabloda RLS açık', async () => {
    const rows = await db.$queryRaw<{ relname: string }[]>`
      SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
      ORDER BY c.relname
    `
    expect(rows.map((r) => r.relname)).toEqual([])
  })
})
