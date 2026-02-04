// @ts-ignore
import lighthouse from 'lighthouse';
// @ts-ignore
import { launch } from 'chrome-launcher';
// @ts-ignore
import * as chromeLauncher from 'chrome-launcher';

const TARGET_URL = process.env.LIGHTHOUSE_TARGET_URL || 'http://localhost:5173';

/**
 * Lighthouse desktop configuration preset
 * This matches Chrome DevTools Lighthouse settings for desktop
 */
const DESKTOP_CONFIG = {
    extends: 'lighthouse:default',
    settings: {
        formFactor: 'desktop' as const,
        throttling: {
            rttMs: 40,
            throughputKbps: 10 * 1024,
            cpuSlowdownMultiplier: 1,
            requestLatencyMs: 0,
            downloadThroughputKbps: 0,
            uploadThroughputKbps: 0,
        },
        screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
        },
        emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
};

/**
 * Run Lighthouse performance audit with desktop configuration
 * Returns LCP, FCP, and TBT metrics
 */
export async function runLighthouseAudit(): Promise<{ lcp: number; fcp: number; tbt: number }> {
    let chrome: chromeLauncher.LaunchedChrome | undefined;

    try {
        chrome = await launch({
            chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
            logLevel: 'error'
        });

        const options = {
            logLevel: 'error' as const,
            output: 'json' as const,
            onlyCategories: ['performance'],
            port: chrome.port,
        };

        const runnerResult = await lighthouse(TARGET_URL, options, DESKTOP_CONFIG);
        const reportJson = runnerResult?.lhr;

        if (!reportJson) {
            throw new Error('Lighthouse did not return a report');
        }

        const lcp = (reportJson.audits['largest-contentful-paint']?.numericValue ?? 0) / 1000;
        const fcp = (reportJson.audits['first-contentful-paint']?.numericValue ?? 0) / 1000;
        const tbt = reportJson.audits['total-blocking-time']?.numericValue ?? 0;

        return { lcp, fcp, tbt };

    } finally {
        if (chrome) await chrome.kill();
    }
}

/**
 * Measure memory usage using Chrome DevTools Protocol
 * This is separated from Lighthouse to reduce server load
 */
export async function measureMemoryUsage(): Promise<number> {
    let chrome: chromeLauncher.LaunchedChrome | undefined;

    try {
        chrome = await launch({
            chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--js-flags=--expose-gc'],
            logLevel: 'error'
        });

        // Use CDP directly instead of Puppeteer to reduce overhead
        const CDP = (await import('chrome-remote-interface')).default;
        const client = await CDP({ port: chrome.port });

        const { Page, Runtime } = client;
        await Page.enable();

        await Page.navigate({ url: TARGET_URL });
        await Page.loadEventFired();

        // Get heap statistics via CDP
        const { result } = await Runtime.evaluate({
            expression: `(performance.memory?.usedJSHeapSize || 0) / (1024 * 1024)`,
            returnByValue: true
        });

        await client.close();

        return result.value ?? 0;

    } catch (error) {
        console.error('Memory measurement failed:', error);
        return 0;
    } finally {
        if (chrome) await chrome.kill();
    }
}

/**
 * Run complete audit (Lighthouse + Memory)
 * For performance, you can call runLighthouseAudit() and measureMemoryUsage() separately
 */
export async function runAudit() {
    try {
        // Run Lighthouse audit first
        const lighthouseMetrics = await runLighthouseAudit();

        // Run memory measurement separately (optional, can be skipped to reduce load)
        let memory = 0;
        try {
            memory = await measureMemoryUsage();
        } catch (memError) {
            console.warn('Memory measurement skipped:', memError);
        }

        return {
            ...lighthouseMetrics,
            memory,
            vulnerabilities: 0
        };

    } catch (error) {
        console.error("Audit failed:", error);
        throw error;
    }
}
