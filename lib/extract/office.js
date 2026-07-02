import officeParser from "officeparser";

export async function extractTextFromOffice(filePath) {
  const text = await officeParser.parseOfficeAsync(filePath, {
    newlineDelimiter: " ",
    ignoreNotes: false
  });
  return text || "";
}
