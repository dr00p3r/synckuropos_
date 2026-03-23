
export const qualityService = {
    async getSonarMetrics(): Promise<any> {
        try {
            const API_URL = import.meta.env.VITE_SYNC_SERVER_URL;
            const response = await fetch(`${API_URL}/api/sonar-metrics`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch Sonar metrics:", error);
            return {
                coverage: 0,
                duplications: 0,
                cognitiveComplexity: 0,
                cyclomaticComplexity: 0,
                technicalDebtRatio: 0
            };
        }
    },

    async runLighthouseAudit(maxRetries = 3): Promise<any> {
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const API_URL = import.meta.env.VITE_SYNC_SERVER_URL;
                const response = await fetch(`${API_URL}/api/run-audit`, { method: 'POST' });

                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
                    await delay(waitTime);
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;
            } catch (e) {
                if (attempt === maxRetries - 1) {
                    console.error("Failed to trigger remote audit after retries", e);
                    return {
                        lcp: 0,
                        fcp: 0,
                        tbt: 0,
                        memory: 0,
                        vulnerabilities: 0,
                        error: 'Audit failed or in progress'
                    };
                }
            }
        }

        return {
            lcp: 0,
            fcp: 0,
            tbt: 0,
            memory: 0,
            vulnerabilities: 0,
            error: 'Max retries exceeded'
        };
    },

    /**
     * Measure RAM usage separately from Lighthouse
     * Can be called independently without blocking other metrics
     */
    async measureMemoryUsage(maxRetries = 2): Promise<number> {
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const API_URL = import.meta.env.VITE_SYNC_SERVER_URL;
                const response = await fetch(`${API_URL}/api/measure-memory`, { method: 'POST' });

                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * 3000;
                    await delay(waitTime);
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data.memory ?? 0;
            } catch (e) {
                if (attempt === maxRetries - 1) {
                    console.error("Failed to measure memory after retries", e);
                    return 0;
                }
            }
        }

        return 0;
    }
};
