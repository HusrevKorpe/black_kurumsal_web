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

| Komut                   | Ne yapar                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm check`            | typecheck + lint + birim/bileşen testleri (push öncesi otomatik)                                                  |
| `pnpm test`             | Vitest birim + bileşen testleri                                                                                   |
| `pnpm test:integration` | Gerçek Postgres (`black_test`) üzerinde servis testleri                                                           |
| `pnpm test:e2e`         | Playwright (masaüstü + mobil, axe erişilebilirlik dahil), dev sunucusunu kendisi açar                             |
| `pnpm lighthouse`       | Lighthouse CI mobil turu; önce `pnpm build` (perf/bp/seo ≥ 0.90, a11y ≥ 0.95)                                     |
| `pnpm media:cleanup`    | Yetim medya raporu (kuru çalışma); `--apply` siler, `--grace=SAAT` bekleme süresi                                 |
| `pnpm staff:owner`      | İlk patron hesabı (canlı kurulum): `--email= --name=`; şifreyi üretip bir kez yazar, hesap varsa şifreyi sıfırlar |
| `pnpm db:migrate`       | Şema değişikliğinden sonra migration üret ve uygula                                                               |
| `pnpm db:studio`        | Prisma Studio                                                                                                     |
| `pnpm build`            | Üretim derlemesi (`prisma generate` dahil)                                                                        |

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

## Canlıya çıkış (M5)

Sıra önemli; her adım bir öncekinin çıktısını kullanır. Hesap girişleri (`supabase login`, Sentry, Vercel) hesap sahibince yapılır.

1. **Supabase prod projesi.** `supabase login` → proje aç (panel ya da `supabase projects create`): bölge `eu-central-1`
   (Frankfurt), güçlü DB şifresi. `supabase link --project-ref <ref>` → `supabase/config.toml` sonuna canlı bloğunu ekle →
   `supabase config push` (diff'i okuyup onayla: `media` bucket'ı public + 10 MiB + görsel MIME, kayıt kapalı, site URL).

   ```toml
   [remotes.production]
   project_id = "<ref>"
   [remotes.production.auth]
   site_url = "https://<domain>"
   additional_redirect_urls = ["https://<domain>/**"]
   ```

2. **Sentry.** sentry.io → yeni proje (Next.js) → DSN. Settings → Auth Tokens → organization token (kaynak haritası
   yüklemesi için). `SENTRY_ORG` = org slug, `SENTRY_PROJECT` = proje slug.
3. **Vercel.** `vercel link` (yeni proje; ticari site → Pro takım) → `vercel git connect` (push = deploy) → değişkenler
   (`printf '%s' '<değer>' | vercel env add <AD> production`):

   | Değişken                                                                                  | Değer                                                                       |
   | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
   | `DATABASE_URL`                                                                            | Dashboard → Connect → Transaction pooler (6543)                             |
   | `DIRECT_DATABASE_URL`                                                                     | Dashboard → Connect → Session pooler (5432; migration, IPv4 uyumlu)         |
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Project Settings → API Keys                                                 |
   | `SUPABASE_STORAGE_BUCKET`                                                                 | `media`                                                                     |
   | `NEXT_PUBLIC_SITE_URL`                                                                    | `https://<domain>` (domain yoksa Vercel adresi; sitemap/OG/JSON-LD buradan) |
   | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`             | 2. adım                                                                     |
   | `CRON_SECRET`                                                                             | `openssl rand -hex 32`                                                      |

4. **Şema + ilk patron.** `vercel env pull .env.canli --environment=production` (bu adı Next okumaz; yerel build canlıya
   bağlanmaz), sonra `DOTENV_CONFIG_PATH=.env.canli pnpm db:deploy` ve
   `DOTENV_CONFIG_PATH=.env.canli pnpm staff:owner --email=<patron e-posta> --name="<Ad Soyad>"` (şifre bir kez yazdırılır,
   ilk girişte panelden değiştirilir). Seed canlıda çalıştırılmaz; dükkanlar ve sorumlular panelden girilir.
5. **Domain.** `vercel domains add <domain>` + DNS kaydı (Vercel'in verdiği A/CNAME); sonra `NEXT_PUBLIC_SITE_URL` ve Supabase
   `site_url`/`additional_redirect_urls` domaine çekilir (`supabase config push`), yeniden deploy.
6. **Duman testi.** Giriş; panelden görsel yükleme (prod Storage); "şu an açık" (Europe/Istanbul); telefon/WhatsApp
   linkleri; `/sitemap.xml`, `/robots.txt`, OG görselleri; Sentry'ye test hatası düşüyor mu; `/api/cron/medya-temizle`
   secret'sız 401, `Authorization: Bearer <CRON_SECRET>` ile 200.

## Klasörler

```
src/app/(public)   açık site       src/features/<alan>  actions · service · queries · schema
src/app/admin      panel           src/components       ui (shadcn) · public · admin
src/lib            db, env, auth, i18n, utils           prisma/schema/*.prisma, prisma/seed
tests/integration  DB testleri     e2e/                 Playwright
```
