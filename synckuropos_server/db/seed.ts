import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './client.js';
import * as schema from './schema.js';

export const SEED_IDS = {
    ADMIN_USER: '00000000-0000-0000-0000-000000000001',
    TAX_RATE_15: '00000000-0000-0000-0000-000000000002',
    CONSUMIDOR_FINAL: '9999999999',
} as const;

export async function ensureServerSeed() {
    const now = Date.now();

    const passwordHash = await bcrypt.hash('admin123', 10);

    const existingAdminRows = await db.select().from(schema.users)
        .where(eq(schema.users.userId, SEED_IDS.ADMIN_USER)).limit(1);
    const existingAdmin = existingAdminRows[0] ?? null;

    if (!existingAdmin) {
        await db.insert(schema.users).values({
            userId: SEED_IDS.ADMIN_USER,
            username: 'admin',
            passwordHash,
            role: 'admin',
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 1,
        });
        console.log('[Seed] Created admin user.');
    } else if (!existingAdmin.passwordHash) {
        await db.update(schema.users)
            .set({ passwordHash, updatedAt: now })
            .where(eq(schema.users.userId, SEED_IDS.ADMIN_USER));
        console.log('[Seed] Patched admin passwordHash.');
    }

    const existingFinalRows = await db.select().from(schema.customers)
        .where(eq(schema.customers.customerId, SEED_IDS.CONSUMIDOR_FINAL)).limit(1);
    const existingFinal = existingFinalRows[0] ?? null;
    if (!existingFinal) {
        await db.insert(schema.customers).values({
            customerId: SEED_IDS.CONSUMIDOR_FINAL,
            fullname: 'Consumidor Final',
            phone: null,
            email: null,
            address: null,
            allowCredit: false,
            creditLimit: 0,
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 1,
        });
        console.log('[Seed] Created Consumidor Final.');
    }

    const existingTaxRates = await db.select().from(schema.taxRates)
        .where(eq(schema.taxRates.id, SEED_IDS.TAX_RATE_15)).limit(1);
    if (existingTaxRates.length === 0) {
        await db.insert(schema.taxRates).values({
            id: SEED_IDS.TAX_RATE_15,
            rate: 0.15,
            effectiveFrom: now,
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 1,
        });
        console.log('[Seed] Created IVA rate (15%).');
    }
}
