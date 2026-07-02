/**
 * Quiz Generation Module
 * Generates student-friendly quiz questions based on module content.
 */

import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build-and-missing-env',
});

/**
 * Generate quiz questions for a module
 */
export async function generateModuleQuiz(moduleTitle, moduleContent, difficulty = 'Intermediate', questionCount = 5) {
    console.log(`🧠 Generating quiz for: "${moduleTitle}"`);

    try {
        // Generate quiz directly as JSON
        const quiz = await generateQuizJSON(moduleTitle, moduleContent, difficulty, questionCount);

        if (quiz && quiz.length > 0) {
            console.log(`✅ Quiz: ${quiz.length} questions generated`);
            return quiz;
        }
    } catch (err) {
        console.error('Quiz generation error:', err.message);
    }

    console.log('⚠️ Using fallback quiz');
    return createFallbackQuiz(moduleTitle, difficulty, questionCount);
}

/**
 * Generate quiz as JSON directly
 */
async function generateQuizJSON(moduleTitle, moduleContent, difficulty, questionCount) {
    // Take first 2000 chars of content for quiz
    const contentSummary = moduleContent.substring(0, 2000);

    const prompt = `Create ${questionCount} diverse multiple-choice quiz questions about: ${moduleTitle}

Based on this content:
${contentSummary}

CRITICAL QUALITY GUIDELINES:
• Vary question types: conceptual understanding, practical application, scenario-based, troubleshooting
• Make questions test genuine comprehension, not just memorization
• Write natural, conversational questions (avoid robotic phrasing)
• Create plausible but clearly incorrect distractors (wrong answers)
• AVOID lazy patterns like "All of the above" or "None of the above" unless truly appropriate
• Write educational explanations that teach WHY (not just confirm "this is correct")
• Use specific scenarios and realistic contexts when possible
• Level: ${difficulty}

Return ONLY a JSON array with this exact format:
[
  {
    "id": "q1",
    "question": "Natural, engaging question that tests real understanding?",
    "options": ["A) Plausible but wrong", "B) Correct answer", "C) Common misconception", "D) Another believable distractor"],
    "correct_answer": "B) Correct answer",
    "explanation": "Educational explanation of WHY this is correct and what makes the other options wrong"
  }
]

REQUIREMENTS:
- Exactly ${questionCount} questions
- Exactly 4 options per question (A, B, C, D)
- correct_answer must EXACTLY match one option
- Explanations should be 1-2 sentences, teaching not just confirming

Return ONLY the JSON array, nothing else.`;

    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'system',
                content: 'You are an expert educator creating quiz questions. Generate thoughtful, varied questions that genuinely test understanding. Output ONLY valid JSON. No markdown, no explanations, just the JSON array.'
            },
            { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2500,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Clean and parse JSON
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '');
    }

    // Find the JSON array
    const startIdx = jsonStr.indexOf('[');
    const endIdx = jsonStr.lastIndexOf(']');

    if (startIdx === -1 || endIdx === -1) {
        throw new Error('No JSON array found in response');
    }

    jsonStr = jsonStr.substring(startIdx, endIdx + 1);

    const quiz = JSON.parse(jsonStr);

    if (!Array.isArray(quiz) || quiz.length === 0) {
        throw new Error('Invalid quiz array');
    }

    // Validate and fix each question
    return quiz.map((q, i) => ({
        id: q.id || `q${i + 1}`,
        question: q.question || `Question ${i + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4
            ? q.options
            : ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4'],
        correct_answer: q.correct_answer || q.options?.[0] || 'A) Option 1',
        explanation: q.explanation || 'This is the correct answer.',
        difficulty: difficulty
    }));
}

/**
 * Create fallback quiz when generation fails
 */
function createFallbackQuiz(moduleTitle, difficulty, count = 5) {
    const questions = [];
    const topicName = moduleTitle.replace(/^(Introduction to|Fundamentals of|Core Concepts in|Advanced Topics in|Practical Applications of|Best Practices for|Deep Dive into|Mastering)\s*/i, '');

    const fallbackQuestions = [
        {
            question: `What is the main purpose of ${topicName}?`,
            options: ['A) To improve efficiency', 'B) To reduce complexity', 'C) To enhance functionality', 'D) All of the above'],
            correct_answer: 'D) All of the above',
            explanation: `${topicName} serves multiple important purposes in its domain.`
        },
        {
            question: `Which of the following is a key characteristic of ${topicName}?`,
            options: ['A) Scalability', 'B) Reliability', 'C) Maintainability', 'D) All of the above'],
            correct_answer: 'D) All of the above',
            explanation: 'These are all important characteristics to consider.'
        },
        {
            question: `When should you consider using ${topicName}?`,
            options: ['A) When building new projects', 'B) When optimizing existing systems', 'C) When learning new concepts', 'D) All scenarios above'],
            correct_answer: 'D) All scenarios above',
            explanation: 'This topic is applicable in various scenarios.'
        },
        {
            question: `What is a common mistake when working with ${topicName}?`,
            options: ['A) Over-engineering', 'B) Under-planning', 'C) Ignoring best practices', 'D) All of the above'],
            correct_answer: 'D) All of the above',
            explanation: 'All of these are common mistakes to avoid.'
        },
        {
            question: `What is the best practice for ${topicName}?`,
            options: ['A) Start simple', 'B) Document your work', 'C) Test thoroughly', 'D) All of the above'],
            correct_answer: 'D) All of the above',
            explanation: 'Following all these practices leads to better outcomes.'
        }
    ];

    for (let i = 0; i < count; i++) {
        const fallback = fallbackQuestions[i % fallbackQuestions.length];
        questions.push({
            id: `q${i + 1}`,
            question: fallback.question,
            options: fallback.options,
            correct_answer: fallback.correct_answer,
            explanation: fallback.explanation,
            difficulty: difficulty
        });
    }

    return questions;
}

/**
 * Validate quiz array
 */
export function validateQuizArray(quiz) {
    if (!Array.isArray(quiz)) return false;

    return quiz.every(q =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.correct_answer &&
        q.explanation
    );
}
