-- Kural (bkz. 20260907125547_enable_rls): public şemasındaki her tablo RLS ile açılır.
-- Politika tanımlanmaz → Supabase'in REST/GraphQL API'si üzerinden anon anahtarla okunamaz/yazılamaz.
-- Uygulama Prisma ile `postgres` rolünden bağlanır ve RLS'i atlar. tests/integration/rls.test.ts zorlar.
ALTER TABLE "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
