import JSON5 from "json5";

export function safeJSONParse(text) {
    try {
        return JSON.parse(text);
    } catch (e1) {
        try {
            return JSON5.parse(text);
        } catch (e2) {
            throw new Error("Both JSON.parse and JSON5.parse failed.");
        }
    }
}
