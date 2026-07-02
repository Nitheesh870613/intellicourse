/**
 * PDF Text Extraction
 * Uses dynamic import for CommonJS compatibility with Next.js App Router
 */

/**
 * Extract text from a PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<{text: string, pages: number}>}
 */
export async function extractTextFromPDF(buffer) {
    console.log('📄 Starting PDF text extraction...');
    console.log(`   Buffer size: ${(buffer.length / 1024).toFixed(2)} KB`);

    try {
        // Dynamic import for CommonJS module compatibility
        const pdfParse = (await import('pdf-parse')).default;  // ✅ Correct import path

        const data = await pdfParse(buffer, {
            max: 50, // Max pages to prevent memory issues
        });

        const text = data.text?.trim() || '';

        console.log(`✅ PDF extraction complete`);
        console.log(`   Pages: ${data.numpages}`);
        console.log(`   Characters: ${text.length}`);

        return {
            text,
            pages: data.numpages || 0,
        };
    } catch (error) {
        console.error('❌ PDF extraction failed:', error.message);

        // Fallback: try alternative import
        try {
            console.log('🔄 Trying fallback PDF extraction...');
            const pdfParseAlt = require('pdf-parse');
            const data = await pdfParseAlt(buffer);
            const text = data.text?.trim() || '';

            console.log(`✅ Fallback PDF extraction complete: ${text.length} chars`);
            return { text, pages: data.numpages || 0 };
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError.message);
            throw new Error(`PDF extraction failed: ${error.message}`);
        }
    }
}

/**
 * Check if PDF has extractable text or is scanned
 * @param {string} text - Extracted text
 * @returns {boolean}
 */
export function isScannedPDF(text) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    return cleanText.length < 100;
}
