import * as cheerio from "cheerio";

export async function extractTextFromWeb(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove non-content elements like navigation, footer, scripts, and styles
  $("script, style, noscript, header, footer, nav, iframe, aside").remove();

  const text = $("body").text() || "";
  return text.replace(/\s+/g, " ").trim();
}
