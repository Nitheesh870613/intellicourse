import officeParser from "officeparser";

export async function extractTextFromPpt(filePath) {
  try {
    const text = await officeParser.parseOfficeAsync(filePath, {
      newlineDelimiter: " ",
      ignoreNotes: false,
    });

    if (!text) {
      return "";
    }

    return text.replace(/\s+/g, " ").trim();
  } catch (error) {
    console.error("Failed to extract PPT/PPTX text", error);
    throw new Error("Failed to extract PPT/PPTX text");
  }
}
