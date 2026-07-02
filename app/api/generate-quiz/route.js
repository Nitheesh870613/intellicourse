import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';
import { quizzes, chapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Quiz Generation API Route
 * 
 * Generates quiz questions based on chapter content using Gemini AI
 * and saves them to the database
 */

async function generateQuizWithAI(chapterContent, chapterTitle, difficulty = 'Beginner') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const prompt = `Generate 5-8 multiple-choice questions based on the following content:

CHAPTER TITLE: ${chapterTitle}
DIFFICULTY LEVEL: ${difficulty}
CHAPTER CONTENT: ${chapterContent}

Requirements:
1. Create questions that test understanding of the key concepts
2. Each question should have exactly 4 options
3. Questions should be appropriate for ${difficulty} level learners
4. Include clear explanations for correct answers
5. Focus on practical understanding and application

Format the output as valid JSON with this exact structure:
{
  "questions": [
    {
      "question": "Clear, specific question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

Guidelines for ${difficulty} level:
${difficulty === 'Beginner' ? 
  '- Focus on basic concepts and definitions\n- Use simple, clear language\n- Test fundamental understanding' :
  difficulty === 'Intermediate' ?
  '- Include scenario-based questions\n- Test practical application\n- Mix conceptual and applied knowledge' :
  '- Include complex problem-solving questions\n- Test deep understanding and analysis\n- Focus on optimization and best practices'
}

Return ONLY valid JSON, no additional text.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let quizData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse quiz data from AI');
    }

    // Validate quiz structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz structure from AI');
    }

    // Validate each question
    quizData.questions.forEach((question, index) => {
      if (!question.question || !question.options || !Array.isArray(question.options) || 
          question.options.length !== 4 || !question.correctAnswer || !question.explanation) {
        throw new Error(`Invalid question structure at index ${index}`);
      }
      
      // Ensure correct answer matches one of the options
      if (!question.options.includes(question.correctAnswer)) {
        console.warn(`Question ${index + 1}: Correct answer doesn't match options, fixing...`);
        question.correctAnswer = question.options[0];
      }
    });

    return quizData.questions;

  } catch (error) {
    console.error('Quiz generation error:', error);
    throw error;
  }
}

// POST endpoint for quiz generation
export async function POST(request) {
  try {
    console.log('Quiz generation API called');
    const { chapterId } = await request.json();
    console.log('Chapter ID received:', chapterId);

    if (!chapterId) {
      console.error('No chapter ID provided');
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    // Check environment variables
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    console.log('Fetching chapter data from database...');
    // Fetch chapter data from database
    const chapter = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);

    console.log('Chapter query result:', { found: chapter?.length > 0, chapterCount: chapter?.length });

    if (!chapter || chapter.length === 0) {
      console.error('Chapter not found in database:', chapterId);
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const chapterData = chapter[0];
    console.log('Chapter data:', { 
      id: chapterData.id, 
      title: chapterData.title, 
      hasContent: !!chapterData.content,
      contentLength: chapterData.content?.length || 0
    });

    if (!chapterData.content) {
      console.error('Chapter has no content:', chapterData.title);
      return NextResponse.json({ error: 'Chapter content is required for quiz generation' }, { status: 400 });
    }

    // Check if quiz already exists for this chapter
    const existingQuiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.chapterId, chapterId))
      .limit(1);

    if (existingQuiz && existingQuiz.length > 0) {
      return NextResponse.json({ 
        message: 'Quiz already exists for this chapter',
        quizExists: true 
      }, { status: 200 });
    }

    console.log('Generating quiz for chapter:', chapterData.title);

    // Generate quiz questions using AI
    const questions = await generateQuizWithAI(
      chapterData.content,
      chapterData.title,
      'Beginner' // You can make this dynamic based on course difficulty
    );

    console.log(`Generated ${questions.length} quiz questions`);

    // Save quiz questions to database
    const savedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      const [savedQuestion] = await db
        .insert(quizzes)
        .values({
          chapterId: chapterId,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          difficulty: 'Beginner', // Make this dynamic if needed
          orderIndex: i
        })
        .returning();

      savedQuestions.push(savedQuestion);
    }

    console.log('Quiz questions saved to database');

    return NextResponse.json({
      message: 'Quiz generated successfully',
      questionsCount: savedQuestions.length,
      chapterId: chapterId,
      chapterTitle: chapterData.title
    });

  } catch (error) {
    console.error('Quiz generation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch quiz questions for a chapter
export async function GET(request) {
  try {
    console.log('GET quiz questions API called');
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    console.log('Fetching quiz for chapter ID:', chapterId);

    if (!chapterId) {
      console.error('No chapter ID provided in GET request');
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    console.log('Querying quiz questions from database...');
    // Fetch quiz questions from database
    const quizQuestions = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.chapterId, chapterId))
      .orderBy(quizzes.orderIndex);

    console.log('Quiz questions found:', quizQuestions?.length || 0);

    if (!quizQuestions || quizQuestions.length === 0) {
      console.log('No quiz questions found for chapter:', chapterId);
      return NextResponse.json({ 
        questions: [],
        message: 'No quiz found for this chapter'
      });
    }

    // Fetch chapter info
    const chapter = await db
      .select({
        id: chapters.id,
        title: chapters.title,
        difficulty: chapters.difficulty || 'Beginner'
      })
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);

    const chapterInfo = chapter[0] || {};

    return NextResponse.json({
      chapterId: chapterId,
      chapterTitle: chapterInfo.title || 'Unknown Chapter',
      difficulty: chapterInfo.difficulty || 'Beginner',
      questions: quizQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        orderIndex: q.orderIndex
      }))
    });

  } catch (error) {
    console.error('Quiz fetch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz questions' },
      { status: 500 }
    );
  }
}
