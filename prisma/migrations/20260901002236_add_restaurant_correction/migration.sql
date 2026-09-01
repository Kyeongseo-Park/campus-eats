-- CreateTable
CREATE TABLE "restaurant_corrections" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '대기',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restaurant_corrections_restaurant_id_idx" ON "restaurant_corrections"("restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_corrections_status_idx" ON "restaurant_corrections"("status");

-- AddForeignKey
ALTER TABLE "restaurant_corrections" ADD CONSTRAINT "restaurant_corrections_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_corrections" ADD CONSTRAINT "restaurant_corrections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
