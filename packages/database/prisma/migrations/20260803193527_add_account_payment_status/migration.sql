-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "due_date" TIMESTAMPTZ,
ADD COLUMN     "is_paid" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "accounts_user_id_due_date_is_paid_idx" ON "accounts"("user_id", "due_date", "is_paid");
