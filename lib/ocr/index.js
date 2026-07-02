/**
 * Unified OCR/Text Extraction Index
 * Chooses correct extractor based on MIME type
 */

import { extractTextFromPDF } from './pdf.js';
import { extractTextFromImage, getImageMimeType } from './image.js';
import { extractTextFromDocx, extractTextFromTxt } from './docx.js';

/**
 * Detect file type from MIME and filename
 * @param {string} mimeType 
 * @param {string} fileName 
 * @returns {'pdf' | 'image' | 'docx' | 'txt' | 'unknown'}
 */
export function detectFileType(mimeType, fileName) {
    const ext = fileName?.split('.').pop()?.toLowerCase();

    console.log(`🔍 Detecting file type: MIME=${mimeType}, ext=${ext}`);

    // PDF
    if (mimeType === 'application/pdf' || ext === 'pdf') {
        return 'pdf';
    }

    // Images
    if (mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) {
        return 'image';
    }

    // DOCX
    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        ext === 'docx'
    ) {
        return 'docx';
    }

    // Plain text
    if (mimeType === 'text/plain' || ['txt', 'md', 'text'].includes(ext)) {
        return 'txt';
    }

    return 'unknown';
}

/**
 * Extract text from any supported file type
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @param {string} fileName 
 * @returns {Promise<{text: string, type: string, metadata: object}>}
 */
export async function extractText(buffer, mimeType, fileName) {
    const fileType = detectFileType(mimeType, fileName);

    console.log(`📁 File type: ${fileType}`);
    console.log(`   File: ${fileName}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);

    let text = '';
    let metadata = {};

    try {
        switch (fileType) {
            case 'pdf': {
                const result = await extractTextFromPDF(buffer);
                text = result.text;
                metadata = { pages: result.pages };
                break;
            }

            case 'image': {
                const imageMime = mimeType?.startsWith('image/') ? mimeType : getImageMimeType(fileName);
                const result = await extractTextFromImage(buffer, imageMime);
                text = result.text;
                metadata = { confidence: result.confidence };
                break;
            }

            case 'docx': {
                const result = await extractTextFromDocx(buffer);
                text = result.text;
                break;
            }

            case 'txt': {
                text = extractTextFromTxt(buffer);
                break;
            }

            default:
                throw new Error(`Unsupported file type: ${mimeType || fileName}`);
        }
    } catch (error) {
        console.error(`❌ Extraction error for ${fileType}:`, error.message);
        throw error;
    }

    console.log(`✅ Extraction complete: ${text.length} characters`);

    return {
        text,
        type: fileType,
        metadata,
    };
}

export { extractTextFromPDF } from './pdf.js';
export { extractTextFromImage, getImageMimeType } from './image.js';
export { extractTextFromDocx, extractTextFromTxt } from './docx.js';
