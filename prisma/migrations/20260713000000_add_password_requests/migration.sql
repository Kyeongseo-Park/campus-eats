-- CreateTable
CREATE TABLE "password_requests" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '대기',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_requests_status_idx" ON "password_requests"("status");
