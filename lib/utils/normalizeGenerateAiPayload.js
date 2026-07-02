export function toTitleCase(str) {
    if (!str || typeof str !== "string") return str;
    return str
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
}

export function normalizeGenerateAiPayload(raw) {
    const normalized = { ...raw };

    // Normalize difficulty (Beginner | Intermediate | Advanced)
    if (normalized.difficulty && typeof normalized.difficulty === "string") {
        normalized.difficulty = toTitleCase(normalized.difficulty);
    }

    // Normalize includeVideos
    if (typeof normalized.includeVideos === "string") {
        normalized.includeVideos = ["1", "true", "yes", "on"].includes(
            normalized.includeVideos.toLowerCase()
        );
    } else {
        normalized.includeVideos = Boolean(normalized.includeVideos);
    }

    // Normalize includeQuiz
    if (typeof normalized.includeQuiz === "string") {
        normalized.includeQuiz = ["1", "true", "yes", "on"].includes(
            normalized.includeQuiz.toLowerCase()
        );
    } else {
        normalized.includeQuiz = Boolean(normalized.includeQuiz);
    }

    // Normalize moduleCount to integer >= 1
    if ("moduleCount" in normalized) {
        const num = Number(normalized.moduleCount);
        normalized.moduleCount = Number.isFinite(num)
            ? Math.max(1, Math.floor(num))
            : 5;
    }

    return normalized;
}
