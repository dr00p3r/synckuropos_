
import puppeteer from 'puppeteer';
// @ts-ignore
import lighthouse from 'lighthouse';
// @ts-ignore
import { launch } from 'chrome-launcher';

const TARGET_URL = 'http://localhost:5173';

async function runAudit() {
    let chrome;
    let browser;

    try {
        console.log("Launching Chrome...");
        // @ts-ignore
        chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'] });
        const port = chrome.port;
        console.log(`Chrome launched on port ${port}`);

        // 2. Run Lighthouse (LCP, FCP, TBT)
        console.log("Running Lighthouse...");
        const options = { logLevel: 'info' as 'info', output: 'json' as 'json', onlyCategories: ['performance'], port };
        const runnerResult = await lighthouse(TARGET_URL, options);
        // @ts-ignore
        const reportJson = runnerResult.lhr;

        const lcp = reportJson.audits['largest-contentful-paint'].numericValue! / 1000; // seconds
        console.log(`LCP: ${lcp}`);

    } catch (error) {
        console.error("Audit failed:", error);
    } finally {
        if (browser) await browser.disconnect();
        if (chrome) await chrome.kill();
    }
}

runAudit();
