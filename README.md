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

Seed hesapları: `patron@black.local / Patron12345!` (Patron) · `sorumlu@black.local / Sorumlu12345!` (Çarşı sorumlusu)

## Komutlar

| Komut                   | Ne yapar                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`            | typecheck + lint + birim/bileşen testleri (push öncesi otomatik)                                                          |
| `pnpm test`             | Vitest birim + bileşen testleri                                                                                           |
| `pnpm test:integration` | Gerçek Postgres (`black_test`) üzerinde servis testleri                                                                   |
| `pnpm test:e2e`         | Playwright (masaüstü + mobil, axe erişilebilirlik dahil), dev sunucusunu kendisi açar                                     |
| `pnpm lighthouse`       | Lighthouse CI mobil turu; önce `pnpm build` (perf/bp/seo ≥ 0.90, a11y ≥ 0.95)                                             |
| `pnpm media:cleanup`    | Yetim medya raporu (kuru çalışma); `--apply` siler, `--grace=SAAT` bekleme süresi                                         |
| `pnpm staff:owner`      | İlk patron hesabı (canlı kurulum): `--email= --name=`; şifreyi üretip bir kez yazar, hesap varsa şifreyi sıfırlar         |
| `pnpm storage:init`     | Medya bucket'ını oluşturur/ayarlarını doğrular (public, 10 MiB, görsel MIME); canlıda `DOTENV_CONFIG_PATH=.env.canli` ile |
| `pnpm content:init`     | İçerik iskeleti (canlı ilk kurulum): site ayarı, 3 mekan/bölge, 11 dükkan; yalnızca eksikleri açar, var olana dokunmaz    |
| `pnpm content:demo`     | Örnek içerik (gösterim): varsayılan 5 dükkanı + Garden + kampanyaları demo veriyle doldurur; yalnızca boş kayda yazar     |
| `pnpm db:migrate`       | Şema değişikliğinden sonra migration üret ve uygula                                                                       |
| `pnpm db:studio`        | Prisma Studio                                                                                                             |
| `pnpm build`            | Üretim derlemesi (`prisma generate` dahil)                                                                                |

## Kurallar

- Hiçbir kod dosyası 500 satırı geçmez (`max-lines`, lint hatası).
- Her tablo migration'da `ENABLE ROW LEVEL SECURITY` ile açılır (politika yok → Supabase REST/GraphQL anon'a kapalı;
  Prisma `postgres` rolüyle RLS'i atlar). `tests/integration/rls.test.ts` bunu zorlar.
- Her server action `runAction` ile sarılır ve yetkiyi sunucuda `assertShopAccess` / `assertOwner` ile doğrular.
- Panelden yapılan her değişiklik `revalidatePublicSite()` ile açık siteyi yeniler.
- Panel şifresi kuralı (12 karakter, küçük+büyük harf, rakam) üç yerde tanımlıdır ve birlikte
  değişir: `src/features/staff/schema.ts` (asıl kapı), `src/lib/auth/generate-password.ts` ve
  `supabase/config.toml`. Kullanıcı `auth.admin.*` ile açıldığından GoTrue'nun kuralı devreye
  girmez; config'deki değerler kullanıcıya açık akışlar için yedek sınırdır.
- Siteye yeni bir dış kaynak (harita, yazı tipi, betik, API) eklenirse `next.config.ts` içindeki CSP'nin
  ilgili yönergesi de güncellenir; yoksa tarayıcı sessizce engeller.
- Görseller tarayıcıda sıkıştırılır ve imzalı URL ile doğrudan Storage'a yüklenir; sunucudan dosya geçmez.
- Açık site bileşenlerine Zod, Supabase ya da Prisma sızmaz; `instrumentation-client.ts` her sayfaya girer, hafif kalır.
  Sentry SDK'sı ve mobil menü çekmecesi ilk pakete girmez; sayfa yüklendikten sonra boşta indirilir (LCP için).

## Hata izleme ve bakım

- Şema değişikliği canlıya çıkarken: deploy'dan önce `DOTENV_CONFIG_PATH=.env.canli pnpm db:deploy`.
  Bekleyen migration: `20260907174949_hours_exceptions_and_soft_delete` (özel günler + işaretli silme),
  `20260907182449_analytics_events` + `20260907182508_analytics_rls` (ziyaret sayacı).
- Silme işaretlemedir: dükkan/mekan silinince `deletedAt` dolar, kayıt ve depodaki fotoğrafları
  veritabanında kalır ama siteden ve panelden düşer. **Panelde geri getirecek ekran yoktur**;
  geri almak ya da kalıcı temizlemek veritabanından elle yapılır. Silinen kaydın slug'ı tutulu
  kalır: aynı adresle yeni dükkan açılamaz.
- Sentry: `NEXT_PUBLIC_SENTRY_DSN` doluysa açık, boşsa tamamen kapalı. Yalnızca hata izleme (tracing/replay paketten çıkarılmış).
  Kaynak haritası yüklemek için Vercel/CI'da `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
- Yetim medya: canlıda haftalık Vercel Cron (`/api/cron/medya-temizle`, `CRON_SECRET` gerekli), yerelde `pnpm media:cleanup`.
- İstatistik (`/admin/istatistik`, patron): sayfa görüntüleme ve tıklama sayaçları kendi veritabanımızda; dışarıya
  hiçbir betik yüklenmez. Olaylar 400 gün saklanır, haftalık Vercel Cron (`/api/cron/istatistik-temizle`,
  `CRON_SECRET` gerekli) eskiyeni siler. Ziyaretçi imzası günlük tuzla hash'lenir; tuz `ANALYTICS_SALT`
  (tanımsızsa `SUPABASE_SECRET_KEY`). Robotlar ve panelde oturumu açık personel sayılmaz; aynı ziyaretçinin
  aynı olayı 30 saniyelik pencerede bir kez sayılır (arka arkaya tıklama sayacı şişirmez).

## Canlıya çıkış (M5)

Sıra önemli; her adım bir öncekinin çıktısını kullanır. Hesap girişleri (`supabase login`, Sentry, Vercel) hesap sahibince yapılır.

1. **Supabase prod projesi** (07.09.2026'da yapıldı: org "Black", proje `black-kurumsal`, ref `isqneubsobtzkylkfadz`,
   Frankfurt). `supabase login` → `supabase projects create` → `supabase link --project-ref <ref>` →
   `supabase/config.toml` sonundaki `[remotes.production]` bloğu → `supabase config push` (TTY dışında onay sormadan
   uygular; auth site URL, kayıt kapalı, 10 MiB limit). Bucket'ı config push oluşturmaz:
   `DOTENV_CONFIG_PATH=.env.canli pnpm storage:init`. Anahtarlar: `supabase projects api-keys --reveal` (bayraksız
   secret maskeli gelir). `.env.canli` (gitignore'lu) bu adımda hazırlandı: DB şifresi, URL, anahtarlar, pooler
   bağlantıları, `CRON_SECRET`.

   ```toml
   [remotes.production]
   project_id = "<ref>"
   [remotes.production.auth]
   site_url = "https://<domain>"
   additional_redirect_urls = ["https://<domain>/**"]
   ```

2. **Sentry.** sentry.io → yeni proje (Next.js) → DSN. Settings → Auth Tokens → organization token (kaynak haritası
   yüklemesi için). `SENTRY_ORG` = org slug, `SENTRY_PROJECT` = proje slug.
3. **Vercel** (07.09.2026'da yapıldı: proje `black-kurumsal`, takım 979268, GitHub bağlı → `main`'e push = canlı
   deploy, adres https://black-kurumsal.vercel.app). Şimdilik Hobby; satış/yayın olunca Pro. Değişkenler yalnızca
   production ortamında (`printf '%s' '<değer>' | vercel env add <AD> production`; preview deploy canlı DB'ye
   bağlanmasın diye preview'a verilmedi):

   | Değişken                                                                                  | Değer                                                                       |
   | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
   | `DATABASE_URL`                                                                            | Dashboard → Connect → Transaction pooler (6543)                             |
   | `DIRECT_DATABASE_URL`                                                                     | Dashboard → Connect → Session pooler (5432; migration, IPv4 uyumlu)         |
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Project Settings → API Keys                                                 |
   | `SUPABASE_STORAGE_BUCKET`                                                                 | `media`                                                                     |
   | `NEXT_PUBLIC_SITE_URL`                                                                    | `https://<domain>` (domain yoksa Vercel adresi; sitemap/OG/JSON-LD buradan) |
   | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`             | 2. adım                                                                     |
   | `CRON_SECRET`                                                                             | `openssl rand -hex 32`                                                      |
   | `ANALYTICS_SALT` (isteğe bağlı)                                                           | `openssl rand -hex 16`; tanımsızsa `SUPABASE_SECRET_KEY` kullanılır         |

4. **Şema + ilk patron.** `.env.canli` 1. adımda hazır (yoksa `vercel env pull .env.canli --environment=production`;
   bu adı Next okumaz, yerel build canlıya bağlanmaz). `DOTENV_CONFIG_PATH=.env.canli pnpm db:deploy` (07.09.2026'da
   uygulandı, RLS dahil) ve
   `DOTENV_CONFIG_PATH=.env.canli pnpm staff:owner --email=<patron e-posta> --name="<Ad Soyad>"` (şifre bir kez yazdırılır,
   ilk girişte panelden değiştirilir). Ardından içerik iskeleti: `DOTENV_CONFIG_PATH=.env.canli pnpm content:init`
   (site ayarı, 3 mekan/bölge, 11 dükkan; `src/features/content/skeleton-data.ts` tek doğruluk kaynağı; yalnızca eksik
   kayıtları açar, panelden yapılan düzenlemelere dokunmaz, tekrar çalıştırmak güvenlidir; işlem günlüğüne düşer). Seed
   canlıda çalıştırılmaz: telefon, adres, saat, fiyat, açıklama, görsel ve sorumlular panelden girilir. Komut açık siteyi
   yenilemez (sayfalar 1 saat önbellekli); sonrasında deploy ya da panelden ilk düzenleme siteyi tazeler.
   **Örnek içerik (gösterim için):** `DOTENV_CONFIG_PATH=.env.canli pnpm content:demo` varsayılan 5 dükkanı (PlayStation Çarşı,
   İnternet Kafe Çarşı, Tost Iyaş, Tavuk Garden, Lavinya Apart), Black Garden mekanını ve 3 örnek kampanyayı uydurma ama
   gerçekçi veriyle doldurur (`src/features/content/demo-data.ts`); yalnızca boş kayıtlara yazar, panelden girilmiş içeriğe
   dokunmaz, günlüğe `content.demo` düşer. Patron panelden gerçeğini girer ya da siler; `--dukkan=slug,slug` ile seçim.
5. **Domain.** `vercel domains add <domain>` + DNS kaydı (Vercel'in verdiği A/CNAME); sonra `NEXT_PUBLIC_SITE_URL` ve Supabase
   `site_url`/`additional_redirect_urls` domaine çekilir (`supabase config push`), yeniden deploy.
6. **Duman testi.** Giriş; panelden görsel yükleme (prod Storage); "şu an açık" (Europe/Istanbul); telefon/WhatsApp
   linkleri; `/sitemap.xml`, `/robots.txt`, OG görselleri; Sentry'ye test hatası düşüyor mu; `/api/cron/medya-temizle`
   secret'sız 401, `Authorization: Bearer <CRON_SECRET>` ile 200 (aynısı `/api/cron/istatistik-temizle` için);
   siteyi gerçek telefondan gezip `/admin/istatistik`'te sayaçların arttığını görmek. Durum (07.09.2026): sayfalar, 404, `/admin` → giriş
   yönlendirmesi, robots/sitemap ve cron doğrulandı; giriş, görsel yükleme, saat ve telefon/WhatsApp kontrolü panelden
   ilk veri girilince yapılır. Sentry ve domain karar gereği satışa ertelendi.

## Pro'ya geçiş (satış / gerçek trafik)

Ücretsiz katmanlar tanıtım ve içerik girişi için yeterli. Site gerçekten satılınca ya da günlük ziyaretçi
~1.000'i geçince aşağıdaki sıra izlenir; domain DNS'i beklerken diğer adımlar ilerleyebilir.
Aylık maliyet: Vercel Pro $20 (koltuk başına) + Supabase Pro $25 + domain ~$12/yıl. Sentry Free yeter.

### 1. Planlar

- **Supabase Pro ($25/ay) — asıl gerekçe yedek.** Free katmanda otomatik yedek **yoktur**: yanlış bir
  `db:deploy` ya da elle silme geri alınamaz. Pro günlük yedek + 7 gün geri dönüş verir. Yanında 8 GB veritabanı (500 MB yerine;
  400 günlük olay saklaması ancak burada rahat eder), 100 GB depolama, hareketsizlikte askıya alma yok.
- **Vercel Pro ($20/ay).** Hobby ticari kullanıma kapalı. Kota aşımında Hobby projeyi kısar, Pro faturalandırır.
- **Spend Management ilk gün kurulur** (Vercel → Settings → Billing): aylık üst sınır + uyarı e-postası.
  Bu olmadan `/api/olay`'a gelen bir taşkın, kesinti yerine fatura üretir.
- Planlar bağlantı adreslerini değiştirmez: `.env.canli` ve Vercel değişkenleri aynı kalır.

### 2. Domain

Adımlar §Canlıya çıkış 5'te. Ek olarak:

- `www` → apex 308 yönlendirmesi (Vercel → Domains, `www` kaydı "Redirect to" ile).
- `NEXT_PUBLIC_SITE_URL` **ve** Supabase `site_url`/`additional_redirect_urls` birlikte güncellenir.
  İkincisi atlanırsa panele giriş sonrası yönlendirme kırılır; birincisi atlanırsa sitemap, robots, OG
  ve JSON-LD eski adresi gösterir, Google yanlış adresi indeksler.

### 3. Staging

Amaç: patronun denemeleri ve migration'lar canlıya değil kopyaya dokunsun. Vercel'in preview ortamı staging olur.

1. Ayrı Supabase projesi (Free katman yeter, staging'de yedek gerekmez):
   `supabase projects create black-kurumsal-staging`.
2. `supabase/config.toml` sonundaki `[remotes.staging]` bloğu yorumdan çıkarılır (ref + adres girilir),
   sonra `supabase config push --project-ref <staging-ref>`.
3. `.env.staging` hazırlanır (`.env*` gitignore'lu; Next okumaz) ve şema/depo/örnek veri kurulur:

   ```bash
   DOTENV_CONFIG_PATH=.env.staging pnpm db:deploy
   DOTENV_CONFIG_PATH=.env.staging pnpm storage:init
   DOTENV_CONFIG_PATH=.env.staging pnpm db:seed   # staging'de seed serbest: gerçek veri değil
   ```

4. Aynı değişkenler Vercel'in **preview** ortamına, staging projesinin değerleriyle:
   `printf '%s' '<değer>' | vercel env add <AD> preview`. Zorunlular: `DATABASE_URL`,
   `DIRECT_DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL` (dal takma adı, ör.
   `https://black-kurumsal-git-<dal>-<takım>.vercel.app`).
5. Vercel → Settings → Deployment Protection: preview dağıtımları şifreye kapatılır.
6. Akış: PR aç → preview (staging veritabanı) → onay → `main` → canlı. Migration önce staging'de çalışır.

`src/app/robots.ts` `VERCEL_ENV`'e bakar: preview dağıtımı `Disallow: /` döner ve site haritası vermez,
böylece staging Google'a düşüp canlıyla çift içerik olmaz (`src/app/robots.test.ts` bunu zorlar).

### 4. Güvenlik sertleştirmesi

Kod tarafı yapıldı (08.09.2026):

- **Güvenlik başlıkları** (`next.config.ts` → `headers()`): CSP, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`, HSTS. CSP bilerek nonce'suz
  kuruldu: nonce her isteği dinamik render'a zorlar ve açık sayfaların ISR/CDN önbelleğini bitirirdi
  (Next belgesi bunu açıkça yazıyor: `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`).
- **Şifre kuralı 12 karakter + küçük harf + büyük harf + rakam.** Zorlayan yer uygulamanın kendi
  şemasıdır (`src/features/staff/schema.ts`); panel kullanıcıyı `auth.admin.*` ile açtığı için
  GoTrue'nun kuralı o yolda çalışmaz. `supabase/config.toml`'daki karşılığı yine de aynı tutuldu ve
  canlıya `supabase config push` ile gider. Mevcut şifreleri etkilemez: patron şifresi bir kez
  yenilenmelidir (panel → Kullanıcılar → Şifre sıfırla).

Pro açılınca panelden yapılacak:

- **Firewall → Custom Rule:** `/api/olay` yoluna IP başına dakikada ~60 istek sınırı. Koddaki sayaç
  (`src/features/analytics/rate-limit.ts`) bellekte ve sunucu örneği başına çalışır, kesin sınır değildir;
  asıl sınır burada kurulur ve istek fonksiyona hiç ulaşmaz.
- Saldırı anında **Attack Challenge Mode**.

### 5. Trafik eşikleri

Açık sayfalar 1 saat ISR önbellekli: ziyaretçi sayısı veritabanını değil CDN'i yorar. Yük `/api/olay`'a
biner; her sayfa görüntüleme 1 fonksiyon çağrısı + 1 satır (5 index dahil ~450 bayt).

| Günlük ziyaretçi | Ne olur                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| ~1.000'e kadar   | Ücretsiz katmanlar yeter                                                                                                          |
| ~1.000 üstü      | Vercel kotası (fonksiyon + edge istek) zorlanır; Supabase 500 MB'ı 400 günlük saklamayla dolar                                    |
| 10.000           | Site ayakta kalır (CDN), ama ayda ~900 bin olay: Pro şart, `RETENTION_DAYS` kısaltılır ya da olaylar günlük özet tabloya toplanır |

## Klasörler

```
src/app/(public)   açık site       src/features/<alan>  actions · service · queries · schema
src/app/admin      panel           src/components       ui (shadcn) · public · admin
src/lib            db, env, auth, i18n, utils           prisma/schema/*.prisma, prisma/seed.ts
tests/integration  DB testleri     e2e/                 Playwright
```
