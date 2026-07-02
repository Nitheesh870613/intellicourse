import fs from "fs/promises";

export async function extractTextFromPdf(filePath) {
  const data = await fs.readFile(filePath);
  const mod = await import("pdf-parse");
  const pdfParse = mod.default || mod;
  const result = await pdfParse(data);
  return result.text || "";
}
