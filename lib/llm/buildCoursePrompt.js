/**
 * Unified Course Prompt Builder
 * 
 * Creates a single, consistent LLM prompt for course generation
 * Used by: AI generation, file-to-course, url-to-course
 * 
 * This ensures ALL course generation methods produce identical output format.
 */

/**
 * Build the unified course generation prompt
 * @param {object} options - Generation options
 * @param {string} options.topic - Course topic (for AI generation)
 * @param {string} options.extractedText - Extracted text (for file/URL generation)
 * @param {string} options.difficulty - Difficulty level
 * @param {number} options.moduleCount - Number of modules to generate
 * @param {boolean} options.includeQuiz - Whether to include quizzes
 * @param {boolean} options.includeVideos - Whether to include video suggestions
 * @param {string} options.sourceType - 'prompt' | 'file' | 'url'
 * @returns {string} - Complete LLM prompt
 */
export function buildCoursePrompt(options) {
    const {
        topic = '',
        extractedText = '',
        difficulty = 'intermediate',
        moduleCount = 5,
        includeQuiz = true,
        includeVideos = false,
        sourceType = 'prompt',
    } = options;

    // Determine mode-specific instructions
    const isExtraction = sourceType === 'file' || sourceType === 'url';

    const sourceInstruction = isExtraction
        ? `Convert the following extracted content into a structured educational course.
Use ONLY the information provided in the source content below.
Do NOT invent facts not present in the source.
Rewrite the content professionally - do not copy raw text verbatim.

SOURCE CONTENT:
${extractedText.substring(0, 25000)}
`
        : `Create a comprehensive educational course on: "${topic}"
Generate original, accurate educational content.
`;

    const prompt = `You are an expert educational content creator for IntelliCourse.
${sourceInstruction}

REQUIREMENTS:
- Difficulty: ${difficulty}
- Number of Modules: ${moduleCount}
- Include Quizzes: ${includeQuiz ? 'YES - 3-5 questions per module' : 'NO'}
- Include Video Suggestions: ${includeVideos ? 'YES - 2-3 per module' : 'NO'}

CRITICAL OUTPUT RULES:
1. Output ONLY valid JSON - no markdown, no code fences, no explanations
2. Follow the exact schema below
3. Every module MUST have a detailed description (2-3 paragraphs)
4. Module descriptions should contain the FULL educational content
5. Include practical examples, key concepts, best practices
6. NEVER use placeholder text like "Lorem ipsum" or "content here"

JSON SCHEMA (follow exactly):
{
  "course_title": "Descriptive course title",
  "overview": "2-3 sentence course overview",
  "category": "Technology | Science | Business | Arts | Health | Other",
  "difficulty": "${difficulty}",
  "modules": [
    {
      "title": "Module title",
      "description": "DETAILED module content as markdown. Include:\\n\\n## Introduction\\nIntroductory paragraph...\\n\\n## Key Concepts\\n- Concept 1: explanation\\n- Concept 2: explanation\\n\\n## Practical Examples\\nReal-world examples...\\n\\n## Best Practices\\n- Practice 1\\n- Practice 2\\n\\n## Summary\\nKey takeaways...",
      "objectives": ["Learning objective 1", "Learning objective 2", "Learning objective 3"],
      ${includeQuiz ? `"quiz": [
        {
          "question": "Clear question text?",
          "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
          "correctAnswer": "A"
        }
      ],` : '"quiz": [],'}
      ${includeVideos ? `"videos": [
        {
          "title": "Relevant video title",
          "searchQuery": "YouTube search query for this topic"
        }
      ]` : '"videos": []'}
    }
  ]
}

CONTENT QUALITY REQUIREMENTS:
- Each module description should be 300-500 words minimum
- Include real examples, not abstract concepts only
- Write in an educational, clear tone
- Structure content with markdown headers (##, ###)
- Include bullet points and numbered lists where appropriate
- End each module with a summary or key takeaways section

Generate the course now:`;

    return prompt;
}

/**
 * Clean LLM response and extract JSON
 * @param {string} response - Raw LLM response
 * @returns {string} - Cleaned JSON string
 */
export function cleanLLMResponse(raw) {
    let text = (raw || "").replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid JSON");
    return text.substring(start, end + 1);
}

/**
 * Validate and normalize course JSON structure
 * @param {object} course - Parsed course object
 * @returns {object} - Normalized course object
 */
export function normalizeCourseJSON(course) {
    if (!course) {
        throw new Error('Invalid course: empty object');
    }

    // Normalize title
    const title = course.course_title || course.title || 'Untitled Course';
    const description = course.overview || course.description || '';
    const category = course.category || 'General';
    const difficulty = course.difficulty || 'Intermediate';

    // Normalize modules
    const modules = (course.modules || []).map((module, index) => {
        if (!module.title) {
            throw new Error(`Module ${index + 1} missing title`);
        }

        return {
            title: module.title,
            description: module.description || module.content || '',
            objectives: module.objectives || [],
            orderIndex: index,
            quiz: (module.quiz || []).map(q => ({
                question: q.question,
                options: q.options || [],
                correctAnswer: q.correctAnswer || q.answer || 'A',
            })),
            videos: (module.videos || []).map(v => ({
                title: v.title || 'Video',
                url: v.url || '',
                searchQuery: v.searchQuery || '',
            })),
        };
    });

    if (modules.length === 0) {
        throw new Error('Course must have at least one module');
    }

    return {
        title,
        course_title: title,
        description,
        overview: description,
        category,
        difficulty,
        modules,
        chapterCount: modules.length,
    };
}
