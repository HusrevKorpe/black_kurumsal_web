-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_locationId_fkey";

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "locationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
