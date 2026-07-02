import { createWorker } from "tesseract.js";

export async function extractTextFromImage(filePath) {
  const worker = await createWorker("eng", 1);

  try {
    const {
      data: { text },
    } = await worker.recognize(filePath);

    return (text || "").replace(/\s+/g, " ").trim();
  } finally {
    await worker.terminate();
  }
}
