import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate Course Quizzes API Route
 * 
 * This route is called after a course is created to automatically
 * generate quizzes for all chapters in the course
 */

export async function POST(request) {
  try {
    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    console.log('Generating quizzes for course:', courseId);

    // Fetch all chapters for this course
    const courseChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.courseId, courseId))
      .orderBy(chapters.orderIndex);

    if (!courseChapters || courseChapters.length === 0) {
      return NextResponse.json({
        error: 'No chapters found for this course'
      }, { status: 404 });
    }

    console.log(`Found ${courseChapters.length} chapters to generate quizzes for`);

    // Generate quizzes for each chapter
    const quizGenerationResults = [];

    for (const chapter of courseChapters) {
      try {
        console.log(`Generating quiz for chapter: ${chapter.title}`);

        // Call the quiz generation API for each chapter
        const quizResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/generate-quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterId: chapter.id }),
        });

        const quizResult = await quizResponse.json();

        if (quizResponse.ok) {
          quizGenerationResults.push({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            success: true,
            questionsCount: quizResult.questionsCount || 0
          });
          console.log(`✅ Quiz generated for chapter: ${chapter.title}`);
        } else {
          quizGenerationResults.push({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            success: false,
            error: quizResult.error || 'Unknown error'
          });
          console.warn(`❌ Failed to generate quiz for chapter: ${chapter.title}`, quizResult.error);
        }
      } catch (chapterError) {
        quizGenerationResults.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          success: false,
          error: chapterError.message
        });
        console.error(`❌ Error generating quiz for chapter: ${chapter.title}`, chapterError);
      }
    }

    // Calculate success statistics
    const successfulQuizzes = quizGenerationResults.filter(result => result.success);
    const failedQuizzes = quizGenerationResults.filter(result => !result.success);

    console.log(`Quiz generation completed: ${successfulQuizzes.length}/${courseChapters.length} successful`);

    return NextResponse.json({
      message: 'Course quiz generation completed',
      courseId: courseId,
      totalChapters: courseChapters.length,
      successfulQuizzes: successfulQuizzes.length,
      failedQuizzes: failedQuizzes.length,
      results: quizGenerationResults
    });

  } catch (error) {
    console.error('Course quiz generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate course quizzes: ' + error.message },
      { status: 500 }
    );
  }
}
