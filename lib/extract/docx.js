import fs from "node:fs/promises";
import mammoth from "mammoth";

export async function extractTextFromDocx(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });

    const text = result?.value || "";
    if (!text) {
      return "";
    }

    return text.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("Failed to extract DOCX text", error);
    return "";
  }
}
