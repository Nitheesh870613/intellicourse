import { YoutubeTranscript } from "youtube-transcript";

export async function extractTextFromYouTube(input) {
  const items = await YoutubeTranscript.fetchTranscript(input);
  if (!items || !Array.isArray(items)) {
    return "";
  }
  return items.map((item) => item.text).join(" ");
}
