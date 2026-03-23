// Mock for src/db/replication.ts
// This mock avoids the import.meta.env issue in Jest

export interface Replications {
    products?: unknown;
    users?: unknown;
    customers?: unknown;
    supplyings?: unknown;
    comboProducts?: unknown;
    debts?: unknown;
    debtPayments?: unknown;
    sales?: unknown;
    saleDetails?: unknown;
}

export async function startReplications(): Promise<Replications> {
    return {};
}

export async function stopReplications(): Promise<void> {
    // No-op in tests
}

export async function setReplicationAuth(_token: string | null): Promise<void> {
    // No-op in tests
}
