-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN "kakao_id" TEXT;
ALTER TABLE "restaurants" ALTER COLUMN "min_price" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_kakao_id_key" ON "restaurants"("kakao_id");
