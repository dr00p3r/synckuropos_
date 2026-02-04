import { useEffect, useRef } from 'react';
import TelemetryWorker from '../workers/telemetry.worker?worker';

// Define a custom interface for the window object to include our worker
declare global {
    interface Window {
        __TELEMETRY_WORKER__?: Worker;
        __TELEMETRY_CONSUMERS__?: number;
    }
}

export const useTelemetry = () => {
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize consumer count if needed
        if (typeof window.__TELEMETRY_CONSUMERS__ === 'undefined') {
            window.__TELEMETRY_CONSUMERS__ = 0;
        }
        window.__TELEMETRY_CONSUMERS__++;

        // Initialize Singleton Worker on window
        if (!window.__TELEMETRY_WORKER__) {
            window.__TELEMETRY_WORKER__ = new TelemetryWorker();
            window.__TELEMETRY_WORKER__.postMessage({ type: 'INIT' });
        }

        const worker = window.__TELEMETRY_WORKER__;
        workerRef.current = worker;

        // Error handlers
        const handleODError = (event: ErrorEvent) => {
            worker.postMessage({
                type: 'LOG_ERROR',
                payload: {
                    message: event.message,
                    stack: event.error?.stack,
                    source: event.filename,
                    lineno: event.lineno
                }
            });
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            worker.postMessage({
                type: 'LOG_ERROR',
                payload: {
                    message: event.reason?.message || 'Unhandled Rejection',
                    stack: event.reason?.stack,
                    reason: event.reason
                }
            });
        };

        // Heartbeat loop
        // Ensure only one interval is running per component mount
        const heartbeatInterval = setInterval(() => {
            worker.postMessage({
                type: 'HEARTBEAT',
                payload: { timestamp: Date.now() }
            });
        }, 10000);

        window.addEventListener('error', handleODError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            if (window.__TELEMETRY_CONSUMERS__) {
                window.__TELEMETRY_CONSUMERS__--;
            }

            clearInterval(heartbeatInterval);
            window.removeEventListener('error', handleODError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    const logMetric = (type: string, data: any) => {
        if (window.__TELEMETRY_WORKER__) {
            window.__TELEMETRY_WORKER__.postMessage({
                type: 'LOG_METRIC',
                payload: { type, data }
            });
        } else {
            console.error('[useTelemetry] Worker not initialized');
        }
    };

    const setAuth = (userId: string | null) => {
        if (window.__TELEMETRY_WORKER__) {
            window.__TELEMETRY_WORKER__.postMessage({
                type: 'SET_AUTH',
                payload: userId
            });
        }
    };

    return { logMetric, setAuth };
};
