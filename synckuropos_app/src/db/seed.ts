import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from './client';
import * as schema from './schema';

export async function seedInitialData() {
    const db = getDb();
    const now = Date.now();

    const existingAdminRows = await db.select().from(schema.users)
        .where(eq(schema.users.username, 'admin')).limit(1);
    const existingAdmin = existingAdminRows[0] ?? null;

    const passwordHash = await bcrypt.hash('admin123', 10);

    if (!existingAdmin) {
        await db.insert(schema.users).values({
            userId: crypto.randomUUID(),
            username: 'admin',
            passwordHash,
            role: 'admin',
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 0,
        });
        console.log('Seeded initial admin user.');
    } else if (!existingAdmin.passwordHash) {
        // Always patch if hash is missing
        await db.update(schema.users)
            .set({ passwordHash, updatedAt: now })
            .where(eq(schema.users.username, 'admin'));

        console.log('Patched admin user with missing passwordHash.');
    }


    // 2. Seed Consumidor Final if not exists
    const existingFinalRows = await db.select().from(schema.customers).where(eq(schema.customers.customerId, '9999999999')).limit(1);
    const existingFinal = existingFinalRows[0] ?? null;
    if (!existingFinal) {
        await db.insert(schema.customers).values({
            customerId: '9999999999',
            fullname: 'Consumidor Final',
            phone: undefined,
            email: undefined,
            address: undefined,
            allowCredit: false,
            creditLimit: 0,
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 0,
        });
        console.log('Seeded Consumidor Final.');
    }

    // 3. Seed IVA inicial (15%) si no existe ninguna tasa
    const existingTaxRates = await db.select().from(schema.taxRates).limit(1);
    if (existingTaxRates.length === 0) {
        await db.insert(schema.taxRates).values({
            id: crypto.randomUUID(),
            rate: 0.15,
            effectiveFrom: now,
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 0,
        });
        console.log('Seeded initial IVA rate (15%).');
    }
}
