import { extractTextFromPdf } from "./pdf";
import { extractTextFromPpt } from "./ppt";
import { extractTextFromDocx } from "./docx";
import { extractTextFromImage } from "./image";
import { extractTextFromWeb } from "./web";
import { extractTextFromYouTube } from "./youtube";

export async function extractTextAuto({ filePath, mimetype = "", url }) {
  if (url) {
    if (/youtube\.com|youtu\.be/.test(url)) {
      return extractTextFromYouTube(url);
    }

    return extractTextFromWeb(url);
  }

  const lowerMime = (mimetype || "").toLowerCase();
  const lowerPath = (filePath || "").toLowerCase();

  if (lowerMime.includes("pdf") || lowerPath.endsWith(".pdf")) {
    return extractTextFromPdf(filePath);
  }

  if (
    lowerMime.includes("presentation") ||
    lowerPath.endsWith(".ppt") ||
    lowerPath.endsWith(".pptx")
  ) {
    return extractTextFromPpt(filePath);
  }

  if (
    lowerMime.includes("word") ||
    lowerPath.endsWith(".doc") ||
    lowerPath.endsWith(".docx")
  ) {
    return extractTextFromDocx(filePath);
  }

  if (
    lowerMime.startsWith("image/") ||
    /\.(png|jpe?g|gif|bmp|tiff|webp)$/i.test(lowerPath)
  ) {
    return extractTextFromImage(filePath);
  }

  throw new Error("Unsupported file type");
}
