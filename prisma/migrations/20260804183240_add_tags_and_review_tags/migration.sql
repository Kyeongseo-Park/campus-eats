-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "group" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_tags" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "review_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_label_key" ON "tags"("label");

-- CreateIndex
CREATE INDEX "review_tags_tag_id_idx" ON "review_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_tags_review_id_tag_id_key" ON "review_tags"("review_id", "tag_id");

-- AddForeignKey
ALTER TABLE "review_tags" ADD CONSTRAINT "review_tags_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tags" ADD CONSTRAINT "review_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
