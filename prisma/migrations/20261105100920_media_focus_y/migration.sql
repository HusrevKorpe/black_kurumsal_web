-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "focusY" INTEGER;

ALTER TABLE "Media" ADD CONSTRAINT "Media_focusY_range" CHECK ("focusY" IS NULL OR ("focusY" BETWEEN 0 AND 100));
