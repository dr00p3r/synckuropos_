import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function ensureServerSchema() {
    const statements = [
        `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "paymentMethod" text DEFAULT 'cash' NOT NULL`,
        `ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "saleId" text`,
        `CREATE TABLE IF NOT EXISTS "tax_rates" (
            "id" text PRIMARY KEY NOT NULL,
            "rate" real NOT NULL,
            "effectiveFrom" bigint NOT NULL,
            "_deleted" boolean DEFAULT false NOT NULL,
            "createdAt" bigint NOT NULL,
            "updatedAt" bigint NOT NULL,
            "synced" integer DEFAULT 0 NOT NULL
        )`,
        `DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'sales'
                  AND column_name = 'isPartOfDebt'
            ) THEN
                UPDATE "sales" SET "paymentMethod" = 'credit' WHERE "isPartOfDebt" = true;
            END IF;
        END $$`,
        `INSERT INTO "debts" (
            "debtId",
            "customerId",
            "saleId",
            "amount",
            "_deleted",
            "createdAt",
            "updatedAt",
            "synced"
        )
        SELECT
            'credit-sale-debt-' || s."saleId",
            s."customerId",
            s."saleId",
            s."totalAmount",
            s."_deleted",
            s."createdAt",
            s."updatedAt",
            1
        FROM "sales" s
        WHERE s."paymentMethod" = 'credit'
          AND s."customerId" <> '9999999999'
          AND NOT EXISTS (
              SELECT 1
              FROM "debts" d
              WHERE d."saleId" = s."saleId"
                 OR (
                    d."saleId" IS NULL
                    AND d."customerId" = s."customerId"
                    AND d."amount" = s."totalAmount"
                    AND d."createdAt" = s."createdAt"
                 )
          )
        ON CONFLICT ("debtId") DO NOTHING`,
        `ALTER TABLE "sales" DROP COLUMN IF EXISTS "isPartOfDebt"`,
        `CREATE TABLE IF NOT EXISTS "bank_accounts" (
            "id" text PRIMARY KEY NOT NULL,
            "bankName" text NOT NULL,
            "accountNumber" text NOT NULL,
            "accountHolder" text NOT NULL,
            "_deleted" boolean DEFAULT false NOT NULL,
            "createdAt" bigint NOT NULL,
            "updatedAt" bigint NOT NULL,
            "synced" integer DEFAULT 0 NOT NULL
        )`,
    ];

    for (const statement of statements) {
        await pool.query(statement);
    }
}
