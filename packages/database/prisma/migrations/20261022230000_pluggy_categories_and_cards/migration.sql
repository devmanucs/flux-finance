-- AlterTable
ALTER TABLE "categories" ADD COLUMN "pluggy_category_id" TEXT;

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN "credit_card" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "categories_pluggy_category_id_key" ON "categories"("pluggy_category_id");
