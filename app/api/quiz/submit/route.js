import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { quizAttempts, moduleProgress, users, courses } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * POST - Submit Quiz and Return Review Data
 * 
 * RESPONSE FORMAT (MANDATORY per spec):
 * {
 *   "score": 4,
 *   "total": 5,
 *   "answers": [
 *     {
 *       "questionId": "q1",
 *       "selected": "Supervised algorithm",
 *       "correct": "Unsupervised clustering algorithm",
 *       "isCorrect": false,
 *       "explanation": "K-Means groups data..."
 *     }
 *   ]
 * }
 */
export async function POST(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      courseId,
      moduleId,
      moduleIndex,
      answers,        // { questionId: selectedOption } or { 0: selectedOption }
      questions,      // Array of quiz questions with correct answers
      timeSpent
    } = body;

    if (!courseId || !moduleId || moduleIndex === undefined || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If questions not provided, try to get from course modules
    let quizQuestions = questions;
    if (!quizQuestions || quizQuestions.length === 0) {
      // Fetch course to get quiz data
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);

      if (course?.modules && Array.isArray(course.modules)) {
        const module = course.modules[moduleIndex];
        quizQuestions = module?.quiz || [];
      }
    }

    // Build review data with correct answers
    const reviewAnswers = [];
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    if (quizQuestions && quizQuestions.length > 0) {
      quizQuestions.forEach((question, index) => {
        // Support both index-based and questionId-based answers
        const questionId = question.id || `q${index}`;
        const selected = answers[questionId] || answers[index] || answers[String(index)] || null;

        // Get correct answer - support multiple field names
        const correctAnswer = question.correctAnswer || question.correct_answer || question.answer;

        // Check if correct
        const isCorrect = selected === correctAnswer;

        if (selected === null || selected === undefined) {
          skippedCount++;
        } else if (isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }

        reviewAnswers.push({
          questionId: questionId,
          question: question.question,
          selected: selected,
          correct: correctAnswer,
          isCorrect: isCorrect,
          explanation: question.explanation || null,
          options: question.options || []
        });
      });
    }

    const totalQuestions = quizQuestions?.length || Object.keys(answers).length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Get attempt number
    const previousAttempts = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, user.id),
          eq(quizAttempts.courseId, courseId),
          eq(quizAttempts.moduleId, moduleId)
        )
      )
      .orderBy(desc(quizAttempts.attemptNumber));

    const attemptNumber = previousAttempts.length > 0
      ? previousAttempts[0].attemptNumber + 1
      : 1;

    // Save quiz attempt with full review data
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId: user.id,
        courseId,
        moduleId,
        moduleIndex,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        skippedAnswers: skippedCount,
        timeSpent: timeSpent || null,
        answers: reviewAnswers, // Store full review data
        isPassed: score >= 70,
        attemptNumber
      })
      .returning();

    // Update module progress with quiz score
    const [existingProgress] = await db
      .select()
      .from(moduleProgress)
      .where(
        and(
          eq(moduleProgress.userId, user.id),
          eq(moduleProgress.courseId, courseId),
          eq(moduleProgress.moduleId, moduleId)
        )
      )
      .limit(1);

    if (existingProgress) {
      await db
        .update(moduleProgress)
        .set({
          quizScore: score,
          quizAttempts: (existingProgress.quizAttempts || 0) + 1,
          bestQuizScore: Math.max(existingProgress.bestQuizScore || 0, score),
          updatedAt: new Date()
        })
        .where(eq(moduleProgress.id, existingProgress.id));
    }

    // Return review data per spec
    return NextResponse.json({
      success: true,
      score: correctCount,
      total: totalQuestions,
      percentage: score,
      answers: reviewAnswers,
      attemptNumber,
      bestScore: existingProgress
        ? Math.max(existingProgress.bestQuizScore || 0, score)
        : score,
      isPassed: score >= 70
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch quiz attempts and review data
 * Returns previous attempt with correct answers for review mode
 */
export async function GET(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const moduleId = searchParams.get('moduleId');

    if (!courseId || !moduleId) {
      return NextResponse.json(
        { error: 'Course ID and Module ID required' },
        { status: 400 }
      );
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all attempts for this module (most recent first)
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, user.id),
          eq(quizAttempts.courseId, courseId),
          eq(quizAttempts.moduleId, moduleId)
        )
      )
      .orderBy(desc(quizAttempts.createdAt));

    const bestScore = attempts.length > 0
      ? Math.max(...attempts.map(a => a.score))
      : 0;

    const latestAttempt = attempts[0] || null;

    return NextResponse.json({
      success: true,
      attempts,
      totalAttempts: attempts.length,
      bestScore,
      latestAttempt,
      // Return review data from latest attempt
      reviewData: latestAttempt ? {
        score: latestAttempt.correctAnswers,
        total: latestAttempt.totalQuestions,
        percentage: latestAttempt.score,
        answers: latestAttempt.answers,
        submittedAt: latestAttempt.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz attempts' },
      { status: 500 }
    );
  }
}
