/**
 * Browser-based URL Content Extractor using Playwright
 * 
 * Bypasses:
 * - Cloudflare protection
 * - Anti-bot rules
 * - JavaScript-rendered content
 * - 403 Forbidden errors
 * 
 * Used when fetch-based extraction fails.
 */

import { chromium } from 'playwright';

/**
 * Extract content from URL using headless browser
 * @param {string} url - URL to extract content from
 * @param {object} options - Extraction options
 * @returns {Promise<{content: string, title: string, wordCount: number}>}
 */
export async function extractContentWithBrowser(url, options = {}) {
    const {
        timeout = 30000,
        waitForSelector = null,
    } = options;

    let browser = null;

    try {
        console.log('🌐 Launching headless browser for:', url);

        // Launch browser with optimized settings
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
            ],
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 },
            javaScriptEnabled: true,
        });

        const page = await context.newPage();

        // Navigate to URL
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout,
        });

        // Wait for optional selector (for dynamic content)
        if (waitForSelector) {
            await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => { });
        }

        // Wait a bit for JS to execute
        await page.waitForTimeout(1500);

        // Get page title
        const title = await page.title();

        // Remove unwanted elements
        await page.evaluate(() => {
            const removeSelectors = [
                'nav', 'header', 'footer',
                'script', 'style', 'noscript', 'iframe',
                '.nav', '.menu', '.sidebar', '.footer', '.header',
                '.ads', '.ad', '.advertisement', '.social',
                '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
                '.cookie', '.popup', '.modal', '#cookie',
                '.comments', '#comments', '.related-posts',
            ];

            removeSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => el.remove());
            });
        });

        // Extract readable content
        const content = await page.evaluate(() => {
            // Try to find main content area
            const contentSelectors = [
                'article',
                'main',
                '[role="main"]',
                '.post-content',
                '.article-content',
                '.entry-content',
                '.content',
                '#content',
                '.post',
                '.article',
            ];

            for (const selector of contentSelectors) {
                const element = document.querySelector(selector);
                if (element && element.innerText.length > 200) {
                    return element.innerText;
                }
            }

            // Fallback to body
            return document.body.innerText;
        });

        await browser.close();

        // Clean up the extracted text
        const cleanedContent = content
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim();

        // Limit content length
        const maxLength = 30000;
        const finalContent = cleanedContent.length > maxLength
            ? cleanedContent.substring(0, maxLength) + '...'
            : cleanedContent;

        const wordCount = finalContent.split(/\s+/).length;

        console.log(`✅ Browser extracted ${wordCount} words from "${title}"`);

        return {
            content: finalContent,
            title: title || 'Extracted Content',
            wordCount,
            url,
            method: 'browser',
        };

    } catch (error) {
        if (browser) {
            await browser.close();
        }

        console.error('❌ Browser extraction failed:', error.message);
        throw new Error(`Browser extraction failed: ${error.message}`);
    }
}

/**
 * Check if URL likely needs browser extraction
 * (sites that commonly block fetch requests)
 */
export function needsBrowserExtraction(url) {
    const protectedDomains = [
        'medium.com',
        'substack.com',
        'dev.to',
        'hashnode.dev',
        'geeksforgeeks.org',
        'tutorialspoint.com',
        'freecodecamp.org',
        'thesideblogger.com',
    ];

    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return protectedDomains.some(domain => hostname.includes(domain));
    } catch {
        return false;
    }
}
