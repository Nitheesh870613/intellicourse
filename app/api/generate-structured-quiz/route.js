import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { quizzes, chapters, courses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Improved Quiz Generation API Route with Structured Prompt
 * 
 * Uses the provided structured prompt to ensure stable JSON output
 * with proper validation and fallback handling
 */

const quizPrompt = `You are an AI course quiz generator for an e-learning app. Generate quiz questions based on the provided course chapter content. Follow this EXACT JSON structure (strictly JSON, no markdown, no explanations outside JSON):

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
- Return only valid JSON (no extra text, comments, or markdown).
- Generate exactly 4-6 questions per quiz.

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

async function generateQuizWithStructuredPrompt(chapterId, chapterTitle, chapterContent, difficulty = 'beginner', courseId = null) {
  try {
    // Validate inputs
    if (!chapterContent || chapterContent.length < 100) {
      throw new Error("Chapter content too short for quiz generation (minimum 100 characters required).");
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    console.log('🧠 Generating structured quiz for:', chapterTitle);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const input = {
      chapter_title: chapterTitle,
      chapter_content: chapterContent,
      difficulty: difficulty || "beginner"
    };

    const fullPrompt = quizPrompt + "\n\nGenerate quiz for:\n" + JSON.stringify(input, null, 2);

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();

    console.log('📝 Raw AI response length:', responseText.length);

    // --- Safe JSON parsing with multiple attempts ---
    let quizData;
    try {
      // First attempt: direct parsing
      quizData = JSON.parse(responseText);
    } catch (firstError) {
      console.warn('⚠️ First JSON parse failed, trying to extract JSON...');
      
      try {
        // Second attempt: extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          quizData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON structure found in response');
        }
      } catch (secondError) {
        console.error("❌ JSON parse error:", secondError.message);
        console.error("Raw response:", responseText);
        return { 
          success: false, 
          message: "Invalid JSON from AI", 
          raw: responseText.substring(0, 500) + "...",
          suggestion: "AI returned malformed JSON. Try regenerating the quiz."
        };
      }
    }

    // --- Validate quizData structure ---
    const validationResult = validateQuizStructure(quizData);
    if (!validationResult.valid) {
      console.error("❌ Quiz validation failed:", validationResult.errors);
      return {
        success: false,
        message: "Quiz data validation failed",
        errors: validationResult.errors,
        suggestion: "AI generated incomplete quiz structure. Try again."
      };
    }

    // --- Enhance metadata ---
    quizData.metadata = {
      ...quizData.metadata,
      total_questions: quizData.quiz.length,
      generated_at: new Date().toISOString(),
      version: "1.0",
      chapter_id: chapterId,
      course_id: courseId
    };

    console.log(`✅ Generated ${quizData.quiz.length} valid questions`);

    // --- Store to Database ---
    try {
      const [savedQuiz] = await db.insert(quizzes).values({
        chapterId: chapterId,
        courseId: courseId,
        quizData: quizData,
        difficulty: difficulty,
      }).returning();

      console.log('💾 Quiz saved to database with ID:', savedQuiz.id);

      return { 
        success: true, 
        quiz: quizData,
        quizId: savedQuiz.id,
        message: `Successfully generated ${quizData.quiz.length} questions`
      };

    } catch (dbError) {
      console.error('❌ Database save error:', dbError.message);
      return {
        success: false,
        message: "Quiz generated but failed to save to database",
        quiz: quizData,
        dbError: dbError.message,
        suggestion: "Check database connection and schema."
      };
    }

  } catch (error) {
    console.error("⚠️ Quiz generation error:", error.message);
    return {
      success: false,
      message: error.message,
      suggestion: "Check API key, chapter content, and database schema."
    };
  }
}

function validateQuizStructure(quizData) {
  const errors = [];

  // Check main structure
  if (!quizData || typeof quizData !== 'object') {
    errors.push('Quiz data is not a valid object');
    return { valid: false, errors };
  }

  // Check required fields
  if (!quizData.chapter_title) errors.push('Missing chapter_title');
  if (!quizData.difficulty) errors.push('Missing difficulty');
  if (!quizData.quiz || !Array.isArray(quizData.quiz)) {
    errors.push('Quiz array is missing or invalid');
    return { valid: false, errors };
  }

  // Check quiz questions
  if (quizData.quiz.length === 0) {
    errors.push('No quiz questions generated');
  }

  quizData.quiz.forEach((question, index) => {
    if (!question.question_id) errors.push(`Question ${index + 1}: Missing question_id`);
    if (!question.question_text) errors.push(`Question ${index + 1}: Missing question_text`);
    if (!question.question_type) errors.push(`Question ${index + 1}: Missing question_type`);
    if (!question.correct_answer) errors.push(`Question ${index + 1}: Missing correct_answer`);
    
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(`Question ${index + 1}: Invalid or insufficient options`);
    } else {
      // Check if correct answer matches one of the options
      if (!question.options.includes(question.correct_answer)) {
        errors.push(`Question ${index + 1}: Correct answer doesn't match any option`);
        // Auto-fix: set correct answer to first option
        question.correct_answer = question.options[0];
        console.warn(`🔧 Auto-fixed question ${index + 1} correct answer`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

// POST endpoint for structured quiz generation
export async function POST(request) {
  try {
    console.log('🚀 Structured quiz generation API called');
    const { chapterId, courseId, testData } = await request.json();

    if (!chapterId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chapter ID is required' 
      }, { status: 400 });
    }

    let chapterData;

    // Handle test data (for testing purposes)
    if (testData) {
      console.log('🧪 Using test data for quiz generation');
      chapterData = {
        id: chapterId,
        title: testData.title,
        content: testData.content,
        courseId: courseId
      };
    } else {
      // Fetch chapter data from database
      console.log('📖 Fetching chapter data...');
      const chapter = await db
        .select()
        .from(chapters)
        .where(eq(chapters.id, chapterId))
        .limit(1);

      if (!chapter || chapter.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Chapter not found' 
        }, { status: 404 });
      }

      chapterData = chapter[0];
    }

    // Get course info for difficulty level
    let courseDifficulty = testData?.difficulty || 'beginner';
    if (!testData && (courseId || chapterData.courseId)) {
      try {
        const course = await db
          .select()
          .from(courses)
          .where(eq(courses.id, courseId || chapterData.courseId))
          .limit(1);
        
        if (course && course.length > 0) {
          courseDifficulty = course[0].difficulty?.toLowerCase() || 'beginner';
        }
      } catch (courseError) {
        console.warn('⚠️ Could not fetch course difficulty, using default');
      }
    }

    // Check if quiz already exists (skip for test data)
    if (!testData) {
      const existingQuiz = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.chapterId, chapterId))
        .limit(1);

      if (existingQuiz && existingQuiz.length > 0) {
        console.log('ℹ️ Quiz already exists, returning existing quiz');
        return NextResponse.json({
          success: true,
          quiz: existingQuiz[0].quizData,
          quizId: existingQuiz[0].id,
          message: 'Quiz already exists for this chapter',
          fromCache: true
        });
      }
    }

    // Generate new quiz
    const result = await generateQuizWithStructuredPrompt(
      chapterId,
      chapterData.title,
      chapterData.content,
      courseDifficulty,
      courseId || chapterData.courseId
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Structured quiz generation API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate quiz',
      suggestion: 'Check server logs for detailed error information'
    }, { status: 500 });
  }
}

// GET endpoint to fetch existing quiz
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Chapter ID is required' 
      }, { status: 400 });
    }

    console.log('📚 Fetching quiz for chapter:', chapterId);

    const quiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.chapterId, chapterId))
      .limit(1);

    if (!quiz || quiz.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No quiz found for this chapter',
        hasQuiz: false
      });
    }

    const quizData = quiz[0];

    return NextResponse.json({
      success: true,
      quiz: quizData.quizData,
      quizId: quizData.id,
      difficulty: quizData.difficulty,
      createdAt: quizData.createdAt,
      hasQuiz: true
    });

  } catch (error) {
    console.error('❌ Get quiz API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quiz'
    }, { status: 500 });
  }
}
