export function repairLLMOutput(course) {
    if (!course) return course;

    // Ensure title
    if (!course.title || typeof course.title !== "string") {
        course.title = "Untitled Course";
    }

    // Ensure modules array
    if (!Array.isArray(course.modules)) {
        course.modules = [];
    }

    course.modules = course.modules.map((m, idx) => {
        const module = { ...m };

        // Title fallback
        if (!module.title) module.title = `Module ${idx + 1}`;

        // Description fallback
        if (!module.description) module.description = "";

        // Content Extraction/Repair (V2 Schema)
        if (!Array.isArray(module.content)) {
            // Fallback default content if missing
            module.content = [
                { section: "Introduction", text: "Introduction to this module." },
                { section: "Core Concepts", text: "- Key concept 1" },
                { section: "Real-World Examples", text: "1. Example usage" },
                { section: "Best Practices", text: "- Follow best practices" },
                { section: "Common Mistakes to Avoid", text: "- Avoid common pitfalls" },
                { section: "Key Takeaways", text: "- Summary point 1" }
            ];
        } else {
            // Ensure each content item has section and text
            module.content = module.content.map(c => ({
                section: c.section || "Section",
                text: c.text || ""
            }));
        }

        // QUIZ FIX
        if (!Array.isArray(module.quiz)) module.quiz = [];
        module.quiz = module.quiz.map((q, qIndex) => ({
            question: q?.question || `Question ${qIndex + 1}`,
            options: Array.isArray(q?.options) ? q.options : ["A", "B", "C", "D"],
            answer: q?.answer || "A"
        }));

        // VIDEOS FIX
        if (!Array.isArray(module.videos)) module.videos = [];
        module.videos = module.videos.map((v, vIndex) => ({
            title: v?.title || `Video ${vIndex + 1}`,
            url: v?.url || "" // Will be replaced by YouTube ranking later
        }));

        return module;
    });

    return course;
}
