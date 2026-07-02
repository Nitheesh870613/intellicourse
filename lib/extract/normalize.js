export function normalizeExtractedText(raw) {
  if (!raw) {
    return "";
  }
  let text = raw.replace(/\r\n/g, "\n");
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const seen = new Set();
  const deduped = [];
  for (const line of lines) {
    const key = line.length > 160 ? line.slice(0, 160) : line;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(line);
    }
  }
  text = deduped.join("\n\n");
  text = text.replace(/\s+/g, " ");
  text = text.replace(/\n\s*\n/g, "\n\n");
  return text.trim();
}
