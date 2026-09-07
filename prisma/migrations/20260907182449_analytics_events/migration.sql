-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'CALL_CLICK', 'WHATSAPP_CLICK', 'DIRECTIONS_CLICK', 'INSTAGRAM_CLICK', 'SHOP_CARD_CLICK', 'LOCATION_CARD_CLICK', 'CAMPAIGN_CLICK', 'GALLERY_OPEN');

-- CreateEnum
CREATE TYPE "DeviceKind" AS ENUM ('MOBILE', 'DESKTOP');

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "path" VARCHAR(200) NOT NULL,
    "shopId" TEXT,
    "locationId" TEXT,
    "campaignId" TEXT,
    "source" VARCHAR(80),
    "device" "DeviceKind" NOT NULL,
    "visitorHash" CHAR(16) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shopId_createdAt_idx" ON "AnalyticsEvent"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_locationId_createdAt_idx" ON "AnalyticsEvent"("locationId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_campaignId_createdAt_idx" ON "AnalyticsEvent"("campaignId", "createdAt");

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
