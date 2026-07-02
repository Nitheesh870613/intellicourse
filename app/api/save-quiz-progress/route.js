import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';  // ✅ Correct App Router import
import { db } from '@/lib/db';
import { userProgress } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Save Quiz Progress API Route
 * 
 * Saves user quiz scores and progress to the database
 * Handles retakes by updating existing records
 */

export async function POST(request) {
  try {
    // Get authenticated user
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      chapterId,
      quizScore,
      totalQuestions,
      correctAnswers,
      timeSpent
    } = await request.json();

    // Validate required fields
    if (!chapterId || quizScore === undefined || !totalQuestions || correctAnswers === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: chapterId, quizScore, totalQuestions, correctAnswers'
      }, { status: 400 });
    }

    // Check if user progress already exists for this chapter
    const existingProgress = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.chapterId, chapterId)
        )
      )
      .limit(1);

    let savedProgress;

    if (existingProgress && existingProgress.length > 0) {
      // Update existing progress (retake scenario)
      const currentProgress = existingProgress[0];

      [savedProgress] = await db
        .update(userProgress)
        .set({
          quizScore: quizScore,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          completedAt: new Date(),
          attempts: currentProgress.attempts + 1,
          updatedAt: new Date()
        })
        .where(eq(userProgress.id, currentProgress.id))
        .returning();

      console.log(`Updated quiz progress for user ${userId}, chapter ${chapterId} (attempt ${savedProgress.attempts})`);
    } else {
      // Create new progress record
      [savedProgress] = await db
        .insert(userProgress)
        .values({
          userId: userId,
          chapterId: chapterId,
          quizScore: quizScore,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          completedAt: new Date(),
          attempts: 1
        })
        .returning();

      console.log(`Created new quiz progress for user ${userId}, chapter ${chapterId}`);
    }

    return NextResponse.json({
      message: 'Quiz progress saved successfully',
      progress: {
        id: savedProgress.id,
        chapterId: savedProgress.chapterId,
        quizScore: savedProgress.quizScore,
        totalQuestions: savedProgress.totalQuestions,
        correctAnswers: savedProgress.correctAnswers,
        attempts: savedProgress.attempts,
        completedAt: savedProgress.completedAt
      }
    });

  } catch (error) {
    console.error('Save quiz progress API error:', error);
    return NextResponse.json(
      { error: 'Failed to save quiz progress' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's quiz progress for a chapter
export async function GET(request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    // Fetch user's progress for this chapter
    const progress = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.chapterId, chapterId)
        )
      )
      .limit(1);

    if (!progress || progress.length === 0) {
      return NextResponse.json({
        hasProgress: false,
        message: 'No quiz progress found for this chapter'
      });
    }

    const userProgressData = progress[0];

    return NextResponse.json({
      hasProgress: true,
      progress: {
        id: userProgressData.id,
        chapterId: userProgressData.chapterId,
        quizScore: userProgressData.quizScore,
        totalQuestions: userProgressData.totalQuestions,
        correctAnswers: userProgressData.correctAnswers,
        attempts: userProgressData.attempts,
        completedAt: userProgressData.completedAt,
        createdAt: userProgressData.createdAt
      }
    });

  } catch (error) {
    console.error('Get quiz progress API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz progress' },
      { status: 500 }
    );
  }
}
