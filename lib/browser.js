
let browserInstance = null;
let contextInstance = null;

export async function getBrowserContext() {
    console.warn("⚠️ Playwright is currently disabled to ensure build stability. Falling back to fetch/cheerio.");
    return null;

    // ORIGINAL IMPLEMENTATION (Restorable if build environment supports binaries)
    /*
    if (contextInstance) return contextInstance;
    try {
        const { chromium } = await import('playwright');
        browserInstance = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
        contextInstance = await browserInstance.newContext();
        return contextInstance;
    } catch (e) { return null; }
    */
}

export async function closeBrowser() {
    // No-op
}
