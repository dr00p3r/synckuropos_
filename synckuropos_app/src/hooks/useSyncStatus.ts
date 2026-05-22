import { useState, useEffect, useCallback } from 'react';
import type { SyncState } from '../db/syncEngine';

const SYNC_STATE_KEY = 'sync_engine_state_v1';

function readState(): SyncState {
    try {
        const raw = localStorage.getItem(SYNC_STATE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
        lastSyncAt: 0,
        lastSyncStatus: 'idle',
        consecutiveFailures: 0,
        nextRetryAt: 0,
    };
}

export function useSyncStatus() {
    const [state, setState] = useState<SyncState>(readState);

    useEffect(() => {
        const interval = setInterval(() => {
            setState(readState());
        }, 5_000);
        return () => clearInterval(interval);
    }, []);

    const formatLastSync = useCallback(() => {
        if (state.lastSyncAt === 0) return 'Nunca sincronizado';
        const diff = Math.floor((Date.now() - state.lastSyncAt) / 1000);
        if (diff < 60) return 'Hace unos segundos';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
        return `Hace ${Math.floor(diff / 3600)} horas`;
    }, [state.lastSyncAt]);

    const isOffline = state.consecutiveFailures > 2;

    return {
        ...state,
        formatLastSync,
        isOffline,
    };
}
