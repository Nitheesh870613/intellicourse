export function cleanJSON(text) {
    if (!text) return "";
    return text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/[\u0000-\u001F]+/g, " ")   // remove control chars
        .replace(/\r?\n/g, "\\n")            // prevent breaking strings
        .replace(/\t/g, " ")
        .trim();
}
