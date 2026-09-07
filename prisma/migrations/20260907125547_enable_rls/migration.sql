-- Satır düzeyi güvenlik (RLS): Supabase'in REST/GraphQL API'si `public` şemasını tarayıcıya giden
-- publishable anahtarla dışa açar. Politika tanımlanmadığı için anon/authenticated rolleri hiçbir satırı
-- göremez ve yazamaz. Uygulama Prisma ile `postgres` rolü üzerinden bağlanır; bu rol RLS'i atlar (bypassrls).
-- Kural: her yeni tablo bu şekilde açılır; tests/integration/rls.test.ts bunu zorlar.
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpeningHours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GalleryImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffShopAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
