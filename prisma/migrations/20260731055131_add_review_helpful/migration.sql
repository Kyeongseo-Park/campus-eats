-- CreateTable
CREATE TABLE "review_helpfuls" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpfuls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_helpfuls_user_id_review_id_key" ON "review_helpfuls"("user_id", "review_id");

-- AddForeignKey
ALTER TABLE "review_helpfuls" ADD CONSTRAINT "review_helpfuls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpfuls" ADD CONSTRAINT "review_helpfuls_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
