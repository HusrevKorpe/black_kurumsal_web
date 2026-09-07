-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "HoursException" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "locationId" TEXT,
    "date" DATE NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT true,
    "opensAt" VARCHAR(5),
    "closesAt" VARCHAR(5),
    "note" VARCHAR(80),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoursException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HoursException_date_idx" ON "HoursException"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HoursException_shopId_date_key" ON "HoursException"("shopId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HoursException_locationId_date_key" ON "HoursException"("locationId", "date");

-- CreateIndex
CREATE INDEX "Location_deletedAt_idx" ON "Location"("deletedAt");

-- CreateIndex
CREATE INDEX "Shop_deletedAt_idx" ON "Shop"("deletedAt");

-- AddForeignKey
ALTER TABLE "HoursException" ADD CONSTRAINT "HoursException_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursException" ADD CONSTRAINT "HoursException_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- HoursException: dükkan VEYA mekan, tam olarak biri dolu (OpeningHours ile aynı kural).
ALTER TABLE "HoursException"
  ADD CONSTRAINT "HoursException_owner_check"
  CHECK (("shopId" IS NOT NULL)::int + ("locationId" IS NOT NULL)::int = 1);

-- HoursException: saat biçimi HH:mm, kapalı değilse saatler dolu.
ALTER TABLE "HoursException"
  ADD CONSTRAINT "HoursException_time_format_check"
  CHECK (
    ("opensAt" IS NULL OR "opensAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') AND
    ("closesAt" IS NULL OR "closesAt" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
  );
ALTER TABLE "HoursException"
  ADD CONSTRAINT "HoursException_open_requires_times_check"
  CHECK ("isClosed" = true OR ("opensAt" IS NOT NULL AND "closesAt" IS NOT NULL));

-- Yeni tablo: RLS açılır (politika yok → anon/authenticated hiçbir satırı göremez).
-- tests/integration/rls.test.ts bunu zorlar.
ALTER TABLE "HoursException" ENABLE ROW LEVEL SECURITY;
