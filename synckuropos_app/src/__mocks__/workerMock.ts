// Mock for Vite's ?worker imports
// This mock is used by Jest to handle worker imports that use Vite's special syntax

class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;

    postMessage(_data: unknown): void {
        // No-op in tests
    }

    terminate(): void {
        // No-op in tests
    }

    addEventListener(_type: string, _listener: EventListener): void {
        // No-op in tests
    }

    removeEventListener(_type: string, _listener: EventListener): void {
        // No-op in tests
    }
}

export default MockWorker;
