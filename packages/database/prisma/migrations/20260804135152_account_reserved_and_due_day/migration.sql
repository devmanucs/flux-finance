-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'MEAL_VOUCHER';

-- AlterTable: add new columns
ALTER TABLE "accounts" ADD COLUMN "due_day" INTEGER;
ALTER TABLE "accounts" ADD COLUMN "paid_at" TIMESTAMPTZ;
ALTER TABLE "accounts" ADD COLUMN "is_reserved" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: due_date -> due_day (dia do mês), is_paid -> paid_at
UPDATE "accounts" SET "due_day" = EXTRACT(DAY FROM "due_date")::INTEGER WHERE "due_date" IS NOT NULL;
UPDATE "accounts" SET "paid_at" = now() WHERE "is_paid" = true;

-- Drop old columns/index
DROP INDEX IF EXISTS "accounts_user_id_due_date_is_paid_idx";
ALTER TABLE "accounts" DROP COLUMN "due_date";
ALTER TABLE "accounts" DROP COLUMN "is_paid";

-- CreateIndex
CREATE INDEX "accounts_user_id_due_day_paid_at_idx" ON "accounts"("user_id", "due_day", "paid_at");
