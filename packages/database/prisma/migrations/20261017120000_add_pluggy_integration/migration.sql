-- CreateTable
CREATE TABLE "pluggy_connections" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "item_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPDATED',
    "last_synced_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pluggy_connections_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "accounts"
    ADD COLUMN "pluggy_account_id" TEXT,
    ADD COLUMN "pluggy_connection_id" INTEGER;

ALTER TABLE "transactions"
    ADD COLUMN "pluggy_transaction_id" TEXT;

-- CreateTable
CREATE TABLE "pluggy_webhook_events" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_started_at" TIMESTAMPTZ,
    "next_attempt_at" TIMESTAMPTZ,
    "processed_at" TIMESTAMPTZ,

    CONSTRAINT "pluggy_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pluggy_connections_item_id_key" ON "pluggy_connections"("item_id");
CREATE INDEX "pluggy_connections_user_id_idx" ON "pluggy_connections"("user_id");
CREATE UNIQUE INDEX "accounts_pluggy_account_id_key" ON "accounts"("pluggy_account_id");
CREATE INDEX "accounts_pluggy_connection_id_idx" ON "accounts"("pluggy_connection_id");
CREATE UNIQUE INDEX "transactions_pluggy_transaction_id_key" ON "transactions"("pluggy_transaction_id");
CREATE UNIQUE INDEX "pluggy_webhook_events_event_id_key" ON "pluggy_webhook_events"("event_id");
CREATE INDEX "pluggy_webhook_events_status_next_attempt_at_received_at_idx"
    ON "pluggy_webhook_events"("status", "next_attempt_at", "received_at");

-- AddForeignKey
ALTER TABLE "pluggy_connections"
    ADD CONSTRAINT "pluggy_connections_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "accounts"
    ADD CONSTRAINT "accounts_pluggy_connection_id_fkey"
    FOREIGN KEY ("pluggy_connection_id") REFERENCES "pluggy_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
