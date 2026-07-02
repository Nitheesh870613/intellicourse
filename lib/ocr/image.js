
export async function extractTextFromImage(buffer) {
    console.warn("⚠️ OCR is currently disabled for build stability.");
    return "";
}

// Helper function for MIME type detection
export function getImageMimeType(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp'
    };
    return mimeTypes[ext] || 'image/jpeg';
}
