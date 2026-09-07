# Black Kurumsal — Proje Planı

> Durum: M1–M4 tamamlandı (07.09.2026). Sıradaki iş: CI'ın GitHub'da doğrulanması (ilk push), canlıya çıkış (M5).
> Bu belge tek doğruluk kaynağıdır. Karar değişirse önce burası güncellenir.

## 1. Amaç

Black markası altındaki 11 dükkanı tek kurumsal sitede toplamak. Müşteri siteye girer,
dükkanı bulur, fotoğraflara ve fiyatlara bakar, telefonla ya da WhatsApp'tan ulaşır.
Dükkan çalışanları içeriği telefondan yönetir. Patron her şeyi tek panelden görür.

Bu gerçek ve kullanılacak bir iş. Hata ve kötü tasarım kabul edilmez.

## 2. Kalite Kuralları (değiştirilemez)

1. **Testler en iyi şekilde yapılır.** Birim (Vitest), bileşen (Testing Library),
   entegrasyon (gerçek Postgres) ve uçtan uca (Playwright). Kritik akış testsiz "bitti" sayılmaz.
2. **Hiçbir kod dosyası 500 satırı geçmez.** ESLint `max-lines` kuralı hata seviyesinde.
   400 satıra yaklaşan dosya bölünür.
3. **Tamamen profesyonel iş.** TypeScript strict, Zod ile sınır doğrulama, yetki kontrolü
   sunucuda, hata izleme, erişilebilirlik, mobil öncelik.
4. **Her karar en mantıklısı.** Ucuz olan değil doğru olan seçilir, gerekçesi yazılır.

Kalite kapıları: `pnpm check` = typecheck + lint + test. Commit öncesi lint-staged,
push öncesi typecheck + test. CI'da build + e2e.

## 3. Kapsam

### Faz 1 (bu plan)

- Ana sayfa: kampanya vitrini, mekan/bölge kartları, kategori kartları, tüm dükkanlar.
- Mekan sayfaları: Black Garden, Çarşı, Iyaş. Garden'ın adresi, saatleri, galerisi ve içindeki dükkanlar.
- Dükkan sayfaları: galeri, açıklama, öne çıkan özellikler, fiyat listesi, çalışma saatleri,
  "şu an açık/kapalı", adres + harita, telefon ve WhatsApp butonları, dükkana özel kampanyalar.
- Kampanyalar sayfası.
- Admin panel (mobil öncelikli): dükkan bilgileri, saatler, galeri, fiyat listesi, kampanyalar,
  mekanlar, kullanıcılar, site ayarları, işlem günlüğü.
- İki rol: **Patron** (her şey) ve **Dükkan Sorumlusu** (atanan dükkanlar).
- SEO: sayfa başına metadata, Open Graph görseli, sitemap, robots, yapısal veri (LocalBusiness).
- Hata izleme (Sentry), 404/500 sayfaları, yükleme durumları.

### Faz 2 (sonra)

- Müşteri üyeliği, QR üye kartı, %10 indirim kampanyası, KVKK metinleri.
- Kupon kodu ve indirim takibi.
- İngilizce arayüz (metinler baştan tek sözlükte tutulur).

### Kapsam dışı (kararlaştırıldı)

- Online randevu/rezervasyon: yok, sadece telefon + WhatsApp.
- Online ödeme: yok.
- "Fiyat listesini başka dükkandan kopyala": istenmiyor, her dükkanın fiyatı farklı.

## 4. Dükkanlar ve Mekanlar

| Mekan / Bölge | Tür                            | Dükkanlar                                           |
| ------------- | ------------------------------ | --------------------------------------------------- |
| Black Garden  | Mekan (tek giriş, ortak adres) | Black Tavuk, Black Makarna, Black Tost, Black Sushi |
| Çarşı         | Bölge                          | Black PlayStation, Black İnternet Kafe, Black Tost  |
| Iyaş          | Bölge                          | Black PlayStation, Black İnternet Kafe, Black Tost  |
| —             | —                              | Lavinya Apart (Black markası taşımaz)               |

"Mekan" fiziksel tek yerdir, kendi sayfası, adresi ve saati vardır. "Bölge" sadece
gruplama etiketidir. Çarşı veya Iyaş dükkanları aynı binadaysa panelden "Mekan"a çevrilir,
kod değişmez.

## 5. Mimari

| Katman           | Seçim                                                          | Neden                                                                                     |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Uygulama         | Next.js 16 (App Router), TypeScript strict, React 19           | Tek kod tabanında site + panel, SSR/ISR, Vercel ile sorunsuz                              |
| UI               | Tailwind 4 + shadcn/ui (base-nova), lucide ikon                | Hızlı, erişilebilir, tutarlı bileşenler                                                   |
| Veritabanı       | Postgres (Supabase) + Prisma 7 (`@prisma/adapter-pg`)          | Tip güvenli sorgu, migration disiplini                                                    |
| Kimlik           | Supabase Auth (`@supabase/ssr`)                                | Şifre, sıfırlama, oturum yönetimi hazır; Faz 2'de müşteri üyeliğine de yeter              |
| Dosya            | Supabase Storage (`media` bucket, public okuma)                | Sunucudan geçmeden imzalı URL ile doğrudan yükleme (Vercel 4.5MB gövde sınırına takılmaz) |
| Görsel           | Tarayıcıda sıkıştırma (max 1920px, ~0.8 kalite) + `next/image` | Çalışanın kotası ve sitenin hızı korunur                                                  |
| Doğrulama        | Zod 4                                                          | Form ve server action girdileri tek şemadan                                               |
| Hata izleme      | Sentry                                                         | Canlıda hata görünür olur                                                                 |
| Barındırma       | Vercel Pro + Supabase Pro                                      | Sıfır sunucu bakımı; gerekirse VPS'e taşınabilir                                          |
| Yerel geliştirme | Supabase CLI (`supabase start`: db, auth, storage, mailpit)    | Canlıyla aynı davranış                                                                    |

### Veri erişimi ve yetki

- Prisma sunucu tarafında çalışır, RLS kullanılmaz. **Her server action ve her admin
  sayfası yetkiyi sunucuda kontrol eder** (`requireStaff`, `requireShopAccess`).
- Supabase istemcisi tarayıcıda yalnızca oturum (giriş/çıkış) ve imzalı URL'e yükleme için kullanılır.
- Servis anahtarı (`SUPABASE_SECRET_KEY`) yalnızca sunucuda: kullanıcı oluşturma, imzalı URL, dosya silme.

### Önbellek stratejisi

- Herkese açık sayfalar ISR ile statik üretilir (`revalidate = 3600` emniyet kemeri).
- Panelden yapılan **her** içerik değişikliği `revalidatePath('/', 'layout')` ile tüm açık
  siteyi yeniler. Site küçük; "hangi sayfayı yenilemeli" hatası riskine girmeye değmez.
- Admin sayfaları dinamiktir (çerez okur).

### Çalışma saati kuralı

- Dükkanın **kendi** saat kaydı varsa tamamı geçerlidir. Yoksa mekanın saati devralınır.
  İkisi de yoksa "saat bilgisi yok" gösterilir. Gün bazında karışım yapılmaz (kafa karıştırır).
- Kapanış açılıştan küçükse gece yarısını geçer (PlayStation 02:00 kapanır gibi). "Şu an açık"
  hesabı bunu bilir. Saat dilimi: Europe/Istanbul.

### İletişim devralma

- Telefon, WhatsApp, adres, harita: dükkanda doluysa dükkanınki, boşsa mekanınki.

## 6. Veri Modeli (Prisma, `prisma/schema/*.prisma`)

- **Location** (mekan/bölge): slug, name, kind(VENUE|DISTRICT), description, address, mapUrl,
  phone, whatsapp, instagramUrl, coverImage, sortOrder, isActive.
- **Shop** (dükkan): slug, name, type(PLAYSTATION|INTERNET_CAFE|FOOD|APART|OTHER), location,
  description, address, mapUrl, phone, whatsapp, instagramUrl, features[], coverImage, logoImage,
  seoTitle, seoDescription, sortOrder, isActive.
- **OpeningHours**: shop **veya** location'a bağlı, dayOfWeek(1-7 ISO), opensAt/closesAt "HH:mm", isClosed.
- **Media**: bucket, path, mimeType, sizeBytes, width, height, alt, uploadedBy.
- **GalleryImage**: media(1:1), shop veya location, caption, sortOrder.
- **PriceCategory** → **PriceItem**: name, description, price(Decimal, boş olabilir: bilgi listesi),
  unit("saat", "gece", "porsiyon"...), image, isAvailable, isFeatured, sortOrder.
- **Campaign**: title, description, image(zorunlu), scope(GLOBAL|LOCATION|SHOP), startsAt, endsAt,
  ctaLabel, ctaUrl, isActive, sortOrder.
- **StaffUser**: id = Supabase auth uid, email, fullName, role(OWNER|MANAGER), isActive.
- **StaffShopAssignment**: staff ↔ shop.
- **SiteSettings**: tek satır; marka adı, hero metinleri, iletişim, sosyal medya, logo.
- **AuditLog**: kim, ne zaman, neyi değiştirdi.

Kategori (Eğlence / Yeme-İçme / Konaklama) tabloda tutulmaz, `type`'tan türetilir.
Apart odaları Faz 1'de fiyat listesiyle ("Oda Tipleri" kategorisi, resimli kalemler) çözülür;
ayrı oda/rezervasyon modeli rezervasyon istenirse gelir.

## 7. Sayfa Haritası

Açık site:

- `/` ana sayfa
- `/[shopSlug]` dükkan sayfası (ör. `/black-playstation-carsi`); rezerve kelimeler slug olamaz
- `/mekan/[slug]` mekan/bölge sayfası (ör. `/mekan/black-garden`)
- `/kampanyalar`
- `/sitemap.xml`, `/robots.txt`, dükkan başına `opengraph-image`

Panel (`/admin`, giriş zorunlu, `proxy.ts` korur):

- `/admin/giris`, `/admin` özet
- `/admin/dukkanlar`, `/admin/dukkanlar/[id]` (sekmeler: Bilgiler · Saatler · Galeri · Fiyat Listesi)
- `/admin/mekanlar`, `/admin/mekanlar/[id]` (Patron)
- `/admin/kampanyalar` (Patron: hepsi; Sorumlu: kendi dükkanları)
- `/admin/kullanicilar` (Patron), `/admin/ayarlar` (Patron), `/admin/gunluk` (Patron)

## 8. Klasör Yapısı

```
src/
  app/                    rotalar (ince: veri çek, bileşen çağır)
    (public)/             açık site: layout, page, [shopSlug], mekan/[slug], kampanyalar
    admin/                panel: (auth)/giris, (panel)/...
    api/cron/             zamanlanmış görevler (vercel.json → crons), CRON_SECRET korumalı
    global-error.tsx      kök layout çökerse (kendi <html>'ini kurar, Sentry'ye bildirir)
  instrumentation.ts      Sentry sunucu/edge kurulumu + onRequestError
  instrumentation-client.ts Sentry tarayıcı kurulumu (Zod/env import ETMEZ: her sayfaya girer)
  components/
    ui/                   shadcn
    public/               site bileşenleri
    admin/                panel bileşenleri
  features/<alan>/        alan bazlı: actions.ts, queries.ts, schema.ts, components/
    shops/ locations/ hours/ media/ pricing/ campaigns/ staff/ settings/ audit/
  lib/
    db.ts                 Prisma istemcisi (tekil)
    supabase/             server.ts, client.ts, admin.ts
    auth/                 getSession, requireStaff, requireShopAccess
    i18n/tr.ts            tüm arayüz metinleri (Faz 2 İngilizce için)
    utils/                slugify, time, format
  generated/prisma/       üretilen istemci (git'te yok)
prisma/schema/*.prisma, prisma/migrations, prisma/seed.ts
scripts/                  bakım betikleri (cleanup-media.ts: `tsx --conditions=react-server` ile server-only geçer)
e2e/                      Playwright (+ a11y.spec.ts: axe, WCAG 2.2 AA + best-practice, sıfır ihlal)
tests/                    entegrasyon testleri
lighthouserc.cjs          Lighthouse CI (mobil; perf/bp/seo ≥ 0.90, a11y ≥ 0.95)
supabase/config.toml      yerel yığın
```

## 9. Test Stratejisi

| Seviye          | Araç                                                       | Kapsam                                                                               |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Birim           | Vitest                                                     | saat devralma, "şu an açık", slugify, Zod şemaları, yetki kuralları                  |
| Bileşen         | Vitest + Testing Library (jsdom)                           | ShopCard, HoursTable, CampaignCarousel, formlar                                      |
| Entegrasyon     | Vitest + gerçek Postgres (`black_test` DB)                 | queries/actions: yetki sınırı, cascade silme, sıralama                               |
| Uçtan uca       | Playwright (Chromium, mobil viewport dahil)                | açık sayfalar, giriş, dükkan düzenle, galeri yükle, fiyat ekle, kampanya yayınla     |
| Erişilebilirlik | Playwright + axe-core (`e2e/a11y.spec.ts`)                 | açık sayfalar, mobil menü, panel sayfaları: WCAG 2.2 AA + best-practice, sıfır ihlal |
| Performans      | Lighthouse CI (`pnpm lighthouse`, üretim derlemesi, mobil) | 4 açık sayfa × 3 koşu, medyan; perf/bp/seo ≥ 0.90, a11y ≥ 0.95                       |

Kapsam hedefi: alan mantığı (`features/*`, `lib/*`) %90+.

## 10. Yol Haritası

1. **M1 Temel** ✅ — iskelet, araçlar, lint kuralları (max-lines 500), Prisma şeması + 3 migration,
   seed (11 dükkan, 3 mekan, görseller, 2 hesap), Supabase auth, roller, proxy koruması.
2. **M2 Açık site** ✅ — layout, ana sayfa, mekan, dükkan, kampanyalar, saat/iletişim devralma,
   "şu an açık", SEO (metadata, JSON-LD, sitemap, robots), 404/500 sayfaları.
3. **M3 Panel** ✅ — dükkan CRUD, saatler, galeri (tarayıcıda sıkıştırma + imzalı yükleme + sıralama + kapak),
   fiyat listesi, kampanyalar, mekanlar, kullanıcılar (+şifre sıfırlama), ayarlar, işlem günlüğü, özet.
4. **M4 Sertleştirme** ✅ — testler (93 birim/bileşen, 44 entegrasyon, 56 e2e masaüstü+mobil, axe erişilebilirlik dahil),
   Sentry (sunucu + edge + tarayıcı, yalnızca hata izleme), yetim medya temizliği (haftalık cron + CLI),
   Lighthouse CI mobil turu (tüm kategoriler ≥ 0.90; a11y/bp/seo 1.00), CI iş akışı (build → e2e → lighthouse).
   Kalan: CI'ın GitHub'da ilk push ile doğrulanması (uzak depo: github.com/HusrevKorpe/black_kurumsal_web).
5. **M5 Canlı** — Supabase prod projesi (+ `media` bucket, public), Sentry projesi (DSN + org/project/auth token),
   Vercel (env: `NEXT_PUBLIC_SENTRY_DSN`, `CRON_SECRET`, Sentry build değişkenleri), domain, içerik girişi.

## 12. Bilinen Kararlar / Notlar (uygulama sırasında)

- Supabase yerel `config.toml`: `[auth] enable_signup=false` (kayıt kapalı), `[auth.email] enable_signup=true`
  (e-posta sağlayıcısı açık; kapatılırsa "Email logins are disabled" hatası). Studio, realtime, edge, analytics kapalı.
- Çıkış `signOut({ scope: 'local' })`: yalnızca o cihaz. Varsayılan 'global' patronun diğer cihazlarını da düşürüyordu.
- Personel olmayan Supabase kullanıcısı `/admin/cikis?reason=unauthorized` ile zorunlu çıkışa yönlenir (giriş sayfası
  ile proxy arasında döngü olmasın).
- Sorumlu patron sayfasına girerse `/admin?yetki=yok` ile özet sayfasına döner (500 yerine uyarı).
- Yerel Supabase 127.0.0.1 olduğundan `images.dangerouslyAllowLocalIP` yalnızca yerelde açık; canlıda kapalı.
- Prisma 7: `prisma` ve `@prisma/client` 7.10.0'a sabitlendi (`latest` etiketi 8 RC gösteriyor).
- Entegrasyon testleri `black_test` veritabanında; `resetDatabase` URL'de `black_test` yoksa çalışmayı reddeder.
- Sunucudan istemciye ikon bileşeni (fonksiyon) geçirilmez; nav ikonları ada göre istemcide çözülür.
- **Sentry (07.09.2026):** `NEXT_PUBLIC_SENTRY_DSN` boşsa SDK kapalı (yerel/test/CI). Ortak ayar `lib/sentry/options.ts`.
  Server action hataları `runAction` içinde yutulduğundan orada `captureException` çağrılır (Next'in `onRequestError`'ı
  onları göremez). Yalnızca hata izleme: tracing/replay/debug kodu `compiler.define` bayraklarıyla paketten çıkar
  (`withSentryConfig.bundleSizeOptimizations` Turbopack'te çalışmıyor). Olaylar `/monitoring` tünelinden geçer
  (rezerve slug). Kaynak haritası yalnızca `SENTRY_AUTH_TOKEN` varsa yüklenir.
- **İstemci paketi disiplini:** `instrumentation-client.ts` her sayfaya girer; `@/lib/env` (Zod) import etmesi açık
  siteye ~85 KB gz ekledi, kaldırıldı. Ana sayfa JS'i ~315 KB gz (framework + Sentry + base-ui Sheet). Kural: açık site
  bileşenlerine Zod/Supabase/Prisma sızmaz; `pnpm build` sonrası `.next/server/app/index.html` script listesi kontrol edilir.
- **Lighthouse dersleri:** `next/image` `priority` yalnızca preload ekler; LCP görseline ayrıca `fetchPriority="high"`
  verilir (CoverImage). `experimental.inlineCss` açık: Tailwind CSS (~16 KB) HTML'e gömülür, ilk ziyarette render'ı
  engelleyen istek kalkar (Next belgesinin Tailwind + ilk ziyaretçi önerisi). Kampanya kartı başlığı sayfaya göre
  h2/h3 (`headingLevel`), yoksa axe `heading-order` düşer. Geist Mono yalnızca panel layout'unda yüklenir (slug/e-posta
  alanları); açık sayfalarda 2 yazı tipi preload'u (~38 KB) LCP görseliyle bant genişliği için yarışmaz, hata sayfası
  digest'i sistem eş genişlikli yazı tipine düşer. Ana sayfa HTML'i ~59 KB gz (RSC payload 37 KB + gömülü CSS 15 KB).
  Lighthouse yerel makinede ±0.1 oynar (arka plan yükü); CI'da 3 koşu medyanı esas alınır.
- **Yetim medya:** `features/media/orphans.ts` — hiçbir ilişkisi olmayan Media satırları + Media satırı olmayan Storage
  dosyaları. 24 saat bekleme (yükleme iki adımlı, form henüz kaydedilmemiş olabilir). Silmeden önce bağlılık transaction
  içinde yeniden kontrol edilir; sonuç AuditLog'a `media.cleanup` olarak yazılır. Haftalık Vercel Cron
  (`/api/cron/medya-temizle`, Pazartesi 04:00 UTC, `CRON_SECRET` Bearer; anahtar yoksa 503) + yerelde `pnpm media:cleanup`
  (varsayılan kuru çalışma, `--apply`, `--grace=SAAT`).
- **CI:** e2e üretim derlemesine karşı koşar (`pnpm start`), yerelde dev sunucusu. Lighthouse build sonrası ayrı adım.
- **İlk CI koşusu dersi (07.09.2026):** `PageProps`/`LayoutProps` Next'in `.next/types` altına ürettiği global tipler;
  yerelde `next dev` ürettiği için `tsc` geçiyordu, temiz CI ortamında `.next` olmadığından 21 hata düştü. `pnpm typecheck`
  artık `next typegen && tsc --noEmit` (tam build yapmadan rota tiplerini üretir). `next-env.d.ts` de bu yüzden commit'lenmez.
  İkinci koşu: `supabase status -o env` değerleri çift tırnaklı basar, `$GITHUB_ENV` tırnak soymaz → anahtar `"sb_…"`
  olarak gitti, Storage "Invalid Compact JWS" verdi; iş akışına `tr -d '"'` eklendi.
  Üçüncü koşu: `.lighthouseci` nokta ile başladığından upload-artifact@v4 atlıyordu → `include-hidden-files: true`.
- **CI'da Lighthouse performansı (07.09.2026, AÇIK KARAR):** entegrasyon/build/e2e CI'da yeşil; performans medyanı
  0,87–0,89 (eşik 0,90). Tek düşük metrik LCP (~3,7 s, puan 0,55); FCP/SI/TBT/CLS tam puan. LCP öğesi hero görseli
  (4 KB AVIF, preload'lu, ~50 ms'de iniyor); süreyi yiyen faz **Render Delay** (2–3,4 s) = görsel indikten sonra boyanana
  kadar ana iş parçacığında koşan JS (hydration + Sentry, ~315 KB gz). Runner benchmarkIndex ~2200, Mac ~3100: runner
  orta sınıf mobil cihaza daha yakın; Mac'te görsel bazen JS'in önüne geçtiği için 0,97, bazen arkasına düştüğü için 0,90.
  Seçenekler: (a) LCP öncesi JS'i azaltmak (Sentry init'i idle'a ertelemek, hydration yükü) → gerçek mobil kazanç, hedef
  0,90 korunur; (b) CI eşiğini 0,85'e çekip 0,90'ı yerel hedef bırakmak (stopgap). Karar kullanıcıda.
- **axe turunun bulguları (07.09.2026, hepsi düzeltildi):** gizli dosya girdisi (`ImageUploadButton`) etiketsizdi →
  `aria-label` + `tabIndex=-1`; Sheet/Dialog kapatma düğmesinin ekran okuyucu metni İngilizce "Close" idi →
  `tr.common.close`; kampanya kartı h3'ü `/kampanyalar`'da h1'in altına düşüyordu → `headingLevel`. Ölçüm notu:
  Sheet 200 ms opaklık geçişiyle açılır; axe yarı saydam panelde kontrastı yanlış ölçer, test `opacity: 1` bekler.
- **Server action dönüşleri serileştirilebilir olmalı:** `PriceItem.price` (Prisma Decimal) action dönüşüyle istemciye
  gidiyordu ("Only plain objects can be passed to Client Components" uyarısı). Fiyat kalemi action'ları artık
  `PriceItemView` döndürür. Kural: action ve sayfa prop'larında Decimal/sınıf örneği yok; sınırda görünüm nesnesi.

## 11. Varsayımlar (cevap gelince güncellenir)

- Çarşı ve Iyaş şimdilik **bölge**; aynı binadaysa panelden mekana çevrilir.
- Garden içindeki dükkanların telefonu boş bırakılırsa Garden'ın numarası gösterilir.
- Logo yok varsayıldı; koyu tema, marka rengi tek değişkenden (`--brand`) değiştirilir.
- Domain sonra.
