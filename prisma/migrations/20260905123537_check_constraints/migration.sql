-- OpeningHours: dükkan VEYA mekan, tam olarak biri dolu.
ALTER TABLE "OpeningHours"
  ADD CONSTRAINT "OpeningHours_owner_check"
  CHECK (("shopId" IS NOT NULL)::int + ("locationId" IS NOT NULL)::int = 1);

-- OpeningHours: gün 1-7, saat biçimi HH:mm, kapalı değilse saatler dolu.
ALTER TABLE "OpeningHours"
  ADD CONSTRAINT "OpeningHours_day_check" CHECK ("dayOfWeek" BETWEEN 1 AND 7);
ALTER TABLE "OpeningHours"
  ADD CONSTRAINT "OpeningHours_time_format_check"
  CHECK (
    ("opensAt" IS NULL OR "opensAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') AND
    ("closesAt" IS NULL OR "closesAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
  );
ALTER TABLE "OpeningHours"
  ADD CONSTRAINT "OpeningHours_open_requires_times_check"
  CHECK ("isClosed" = true OR ("opensAt" IS NOT NULL AND "closesAt" IS NOT NULL));

-- GalleryImage: dükkan VEYA mekan, tam olarak biri dolu.
ALTER TABLE "GalleryImage"
  ADD CONSTRAINT "GalleryImage_owner_check"
  CHECK (("shopId" IS NOT NULL)::int + ("locationId" IS NOT NULL)::int = 1);

-- Campaign: kapsam ile hedef uyumlu.
ALTER TABLE "Campaign"
  ADD CONSTRAINT "Campaign_scope_target_check"
  CHECK (
    ("scope" = 'GLOBAL'   AND "shopId" IS NULL     AND "locationId" IS NULL) OR
    ("scope" = 'LOCATION' AND "shopId" IS NULL     AND "locationId" IS NOT NULL) OR
    ("scope" = 'SHOP'     AND "shopId" IS NOT NULL AND "locationId" IS NULL)
  );

-- Campaign: bitiş başlangıçtan önce olamaz.
ALTER TABLE "Campaign"
  ADD CONSTRAINT "Campaign_dates_check"
  CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" >= "startsAt");

-- PriceItem: fiyat negatif olamaz.
ALTER TABLE "PriceItem"
  ADD CONSTRAINT "PriceItem_price_nonnegative_check" CHECK ("price" IS NULL OR "price" >= 0);

-- SiteSettings: tek satır.
ALTER TABLE "SiteSettings"
  ADD CONSTRAINT "SiteSettings_singleton_check" CHECK ("id" = 1);
