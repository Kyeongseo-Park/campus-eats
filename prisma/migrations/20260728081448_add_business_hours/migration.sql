-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "business_hours_raw" TEXT,
ADD COLUMN     "business_hours" JSONB;
