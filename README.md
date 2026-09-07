# Black Kurumsal

Black markasının dükkanlarını tek çatı altında toplayan kurumsal site ve mobil öncelikli yönetim paneli.
Ayrıntılı plan ve kararlar: [plan.md](./plan.md).

## Yığın

Next.js 16 (App Router) · TypeScript · Tailwind 4 + shadcn/ui · Prisma 7 + Postgres (Supabase) · Supabase Auth & Storage · Vitest · Playwright

## Yerel geliştirme

Gereksinimler: Node 22+, pnpm 11, Docker (OrbStack/Docker Desktop), Supabase CLI.

```bash
pnpm install
pnpm supabase:start          # yerel Postgres + Auth + Storage (ilk seferde imaj indirir)
cp .env.example .env         # supabase start çıktısındaki anahtarları yaz
pnpm db:migrate              # migration uygula, istemciyi üret
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c 'CREATE DATABASE black_test'
pnpm db:seed                 # 3 mekan, 11 dükkan, kampanyalar, örnek görseller, giriş hesapları
pnpm dev                     # http://localhost:3000
```

Seed hesapları: `patron@black.local / Patron123!` (Patron) · `sorumlu@black.local / Sorumlu123!` (Çarşı sorumlusu)

## Komutlar

| Komut                   | Ne yapar                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `pnpm check`            | typecheck + lint + birim/bileşen testleri (push öncesi otomatik)                      |
| `pnpm test`             | Vitest birim + bileşen testleri                                                       |
| `pnpm test:integration` | Gerçek Postgres (`black_test`) üzerinde servis testleri                               |
| `pnpm test:e2e`         | Playwright (masaüstü + mobil, axe erişilebilirlik dahil), dev sunucusunu kendisi açar |
| `pnpm lighthouse`       | Lighthouse CI mobil turu; önce `pnpm build` (perf/bp/seo ≥ 0.90, a11y ≥ 0.95)         |
| `pnpm media:cleanup`    | Yetim medya raporu (kuru çalışma); `--apply` siler, `--grace=SAAT` bekleme süresi     |
| `pnpm db:migrate`       | Şema değişikliğinden sonra migration üret ve uygula                                   |
| `pnpm db:studio`        | Prisma Studio                                                                         |
| `pnpm build`            | Üretim derlemesi (`prisma generate` dahil)                                            |

## Kurallar

- Hiçbir kod dosyası 500 satırı geçmez (`max-lines`, lint hatası).
- Her server action `runAction` ile sarılır ve yetkiyi sunucuda `assertShopAccess` / `assertOwner` ile doğrular.
- Panelden yapılan her değişiklik `revalidatePublicSite()` ile açık siteyi yeniler.
- Görseller tarayıcıda sıkıştırılır ve imzalı URL ile doğrudan Storage'a yüklenir; sunucudan dosya geçmez.
- Açık site bileşenlerine Zod, Supabase ya da Prisma sızmaz; `instrumentation-client.ts` her sayfaya girer, hafif kalır.
  Sentry SDK'sı ve mobil menü çekmecesi ilk pakete girmez; sayfa yüklendikten sonra boşta indirilir (LCP için).

## Hata izleme ve bakım

- Sentry: `NEXT_PUBLIC_SENTRY_DSN` doluysa açık, boşsa tamamen kapalı. Yalnızca hata izleme (tracing/replay paketten çıkarılmış).
  Kaynak haritası yüklemek için Vercel/CI'da `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
- Yetim medya: canlıda haftalık Vercel Cron (`/api/cron/medya-temizle`, `CRON_SECRET` gerekli), yerelde `pnpm media:cleanup`.

## Klasörler

```
src/app/(public)   açık site       src/features/<alan>  actions · service · queries · schema
src/app/admin      panel           src/components       ui (shadcn) · public · admin
src/lib            db, env, auth, i18n, utils           prisma/schema/*.prisma, prisma/seed
tests/integration  DB testleri     e2e/                 Playwright
```
