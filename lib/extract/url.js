import * as cheerio from "cheerio";

export async function extractTextFromWebPage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch URL");
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  $("script, style, noscript, header, footer, nav").remove();
  const text = $("body").text();
  return text || "";
}
