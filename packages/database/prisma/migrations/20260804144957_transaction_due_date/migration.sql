-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "due_date" TIMESTAMPTZ,
ADD COLUMN "is_paid" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: transações já existentes já tiveram seu efeito aplicado no saldo
-- da conta (comportamento antigo, sem o gate de "paga"). Marcar como pagas
-- preserva o saldo atual; só transações novas nascem não pagas.
UPDATE "transactions" SET "is_paid" = true;

-- CreateIndex
CREATE INDEX "transactions_account_id_due_date_is_paid_idx" ON "transactions"("account_id", "due_date", "is_paid");
