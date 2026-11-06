-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "shopId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_isActive_startsAt_idx" ON "CalendarEvent"("isActive", "startsAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_shopId_idx" ON "CalendarEvent"("shopId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Bitiş başlangıçtan önce olamaz.
ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_dates_check" CHECK ("endsAt" IS NULL OR "endsAt" >= "startsAt");

-- Her yeni tablo gibi RLS açık, politika yok (bkz. 20260907125547_enable_rls).
ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;
