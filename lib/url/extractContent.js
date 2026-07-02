/**
 * URL Content Extractor
 * 
 * Extracts readable text content from webpage URLs.
 * Removes scripts, styles, navigation, and other non-content elements.
 */

import * as cheerio from 'cheerio';
import { getBrowserContext } from '@/lib/browser';

/**
 * Validate URL format and protocol
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Clean and prepare extracted text for LLM processing
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned text
 */
export function cleanExtractedText(text) {
    if (!text) return '';

    return text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove common boilerplate phrases
        .replace(/cookie(s)?.*?accept/gi, '')
        .replace(/subscribe.*?newsletter/gi, '')
        .replace(/sign up.*?free/gi, '')
        // Remove URLs in text
        .replace(/https?:\/\/[^\s]+/g, '')
        // Remove email addresses
        .replace(/[\w.-]+@[\w.-]+\.\w+/g, '')
        // Clean up
        .trim();
}

/**
 * Extract readable content from a webpage URL
 * @param {string} url - URL to extract content from
 * @returns {Promise<{title: string, content: string, wordCount: number}>}
 */
export async function extractContentFromUrl(url) {
    if (!isValidUrl(url)) {
        throw new Error('Invalid URL format. Only HTTP/HTTPS URLs are supported.');
    }

    try {
        // Try Playwright first for best compatibility (SPAs, JS-heavy sites)
        console.log(`🌐 Scraping via Playwright: ${url}`);
        const context = await getBrowserContext();

        if (context) {
            const page = await context.newPage();
            try {
                // Block heavy resources
                await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());

                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

                // Extract content using page evaluation for better readability parsing if needed
                // For now, grabbing body content similar to cheerio approach but rendered
                const content = await page.evaluate(() => {
                    // Simple extraction logic inside browser
                    // Remove junk
                    const removeSelectors = [
                        'nav', 'header', 'footer', 'script', 'style', 'form', 'noscript', 'iframe', 'svg', 'img', 'video', 'audio',
                        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
                        '.nav', '.menu', '.sidebar', '.footer', '.header', '.ads', '.advertisement', '.social',
                        '[class*="cookie"]', '[class*="popup"]', '[class*="modal"]', '[id*="cookie"]'
                    ];
                    removeSelectors.forEach(s => {
                        document.querySelectorAll(s).forEach(el => el.remove());
                    });

                    return document.body.innerText;
                });

                const title = await page.title();
                await page.close();

                // Process scraped text
                const cleaned = cleanExtractedText(content);
                const wordCount = cleaned.split(/\s+/).length;

                if (wordCount > 50) {
                    return {
                        title: title || 'Extracted Content',
                        content: cleaned,
                        wordCount,
                        url,
                    };
                }
                console.log('⚠️ Playwright returned sparse content, trying fallback...');
            } catch (pError) {
                console.warn(`Playwright failed for ${url}: ${pError.message}`);
                await page.close().catch(() => { });
            }
        }
    } catch (e) {
        console.error('Playwright extraction error:', e);
    }

    // Fallback to fetch + cheerio (lighter, robust for static)
    console.log(`📡 Fallback Scraping via Fetch: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract page title
        const title = $('title').text().trim() || $('h1').first().text().trim() || 'Extracted Content';

        // Remove non-content elements
        $('nav, header, footer, script, style, form, noscript, iframe, svg, img, video, audio').remove();
        $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
        $('.nav, .menu, .sidebar, .footer, .header, .ads, .advertisement, .social').remove();
        $('[class*="cookie"], [class*="popup"], [class*="modal"], [id*="cookie"]').remove();

        let content = $('body').text();
        const cleaned = cleanExtractedText(content);

        return {
            title,
            content: cleaned,
            wordCount: cleaned.split(/\s+/).length,
            url,
        };

    } catch (fError) {
        throw new Error(`All extraction methods failed for ${url}: ${fError.message}`);
    }
}
