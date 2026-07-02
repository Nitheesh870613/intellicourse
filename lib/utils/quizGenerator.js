import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { quizzes } from '@/lib/db/schema';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced quiz generation prompt
const quizPrompt = `You are an AI course quiz generator for an e-learning app.
Generate quiz questions based on the provided course chapter content.
Follow this EXACT JSON structure (strictly JSON, no markdown, no explanations outside JSON):

{
  "chapter_title": "",
  "chapter_summary": "",
  "difficulty": "beginner | intermediate | advanced",
  "quiz": [
    {
      "question_id": "",
      "question_text": "",
      "question_type": "mcq | true_false | fill_blank | code_output",
      "options": ["", "", "", ""],
      "correct_answer": "",
      "explanation": ""
    }
  ],
  "metadata": {
    "total_questions": 0,
    "generated_at": "",
    "version": "1.0"
  }
}

## Rules:
- Use the provided chapter_content and difficulty level.
- Every question must be meaningful and test understanding.
- Avoid duplicates.
- Ensure correct_answer always matches one option.
- Each question should have a clear, single correct answer.
- Include explanations (1-2 lines) explaining why that answer is correct.
- If the content has code examples, include at least one "code_output" question type.
- Generate 5-8 questions per chapter.
- Return only valid JSON (no extra text, comments, or markdown).

## Example Input:
{
  "chapter_title": "Introduction to Python",
  "chapter_content": "Python is an interpreted, high-level programming language...",
  "difficulty": "beginner"
}

## Example Output:
{
  "chapter_title": "Introduction to Python",
  "chapter_summary": "Basics of Python, syntax, variables, and data types.",
  "difficulty": "beginner",
  "quiz": [
    {
      "question_id": "Q1",
      "question_text": "What type of language is Python?",
      "question_type": "mcq",
      "options": ["Compiled", "Interpreted", "Assembly", "Machine"],
      "correct_answer": "Interpreted",
      "explanation": "Python executes code line-by-line using an interpreter."
    },
    {
      "question_id": "Q2",
      "question_text": "Which of these is a valid Python variable name?",
      "question_type": "mcq",
      "options": ["2name", "my-variable", "_name", "class"],
      "correct_answer": "_name",
      "explanation": "Variable names can start with an underscore but not a number."
    }
  ],
  "metadata": {
    "total_questions": 2,
    "generated_at": "2025-11-03T12:00:00Z",
    "version": "1.0"
  }
}`;

/**
 * Generate quiz for a chapter using Gemini AI
 * @param {string} chapterId - Chapter ID
 * @param {string} courseId - Course ID
 * @param {string} chapterTitle - Chapter title
 * @param {string} chapterContent - Chapter content
 * @param {string} difficulty - Difficulty level (beginner, intermediate, advanced)
 * @returns {Object} - Quiz generation result
 */
export async function generateQuiz(chapterId, courseId, chapterTitle, chapterContent, difficulty = 'beginner') {
  try {
    // Validate inputs
    if (!chapterContent || chapterContent.length < 100) {
      throw new Error("Chapter content too short for quiz generation (minimum 100 characters required).");
    }

    if (!chapterId || !courseId || !chapterTitle) {
      throw new Error("Missing required parameters: chapterId, courseId, or chapterTitle.");
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured.");
    }

    console.log(`Generating quiz for chapter: ${chapterTitle}`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const input = {
      chapter_title: chapterTitle,
      chapter_content: chapterContent,
      difficulty: difficulty || "beginner"
    };

    // Generate quiz content
    const result = await model.generateContent([
      quizPrompt + "\n\n" + JSON.stringify(input)
    ]);

    const responseText = result.response.text();
    console.log('Raw Gemini response received');

    // Safe JSON parsing
    let quizData;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (err) {
      console.error("❌ JSON parse error:", err.message);
      console.error("Raw response:", responseText