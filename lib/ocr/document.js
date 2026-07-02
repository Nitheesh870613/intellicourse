import mammoth from 'mammoth';

/**
 * Extract text from a DOCX file buffer
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<{text: string, html: string}>}
 */
export async function extractTextFromDocx(buffer) {
    console.log('📝 Starting DOCX text extraction...');
    console.log(`   Buffer size: ${(buffer.length / 1024).toFixed(2)} KB`);

    try {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value?.trim() || '';

        // Also get HTML for better formatting
        const htmlResult = await mammoth.convertToHtml({ buffer });
        const html = htmlResult.value || '';

        console.log(`✅ DOCX extraction complete`);
        console.log(`   Characters extracted: ${text.length}`);

        if (result.messages?.length > 0) {
            console.log(`   Warnings: ${result.messages.length}`);
        }

        return {
            text,
            html,
        };
    } catch (error) {
        console.error('❌ DOCX extraction failed:', error.message);
        throw new Error(`DOCX extraction failed: ${error.message}`);
    }
}

/**
 * Extract text from a plain text file
 * @param {Buffer} buffer - Text file buffer
 * @returns {string}
 */
export function extractTextFromTxt(buffer) {
    console.log('📄 Reading plain text file...');
    const text = buffer.toString('utf-8').trim();
    console.log(`   Characters: ${text.length}`);
    return text;
}
