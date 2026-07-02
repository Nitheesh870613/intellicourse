import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { moduleProgress, courseAnalytics, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Fetch progress for a course
export async function GET(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
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

    // Fetch module progress
    const moduleProgressData = await db
      .select()
      .from(moduleProgress)
      .where(
        and(
          eq(moduleProgress.userId, user.id),
          eq(moduleProgress.courseId, courseId)
        )
      );

    // Fetch course analytics
    const [analytics] = await db
      .select()
      .from(courseAnalytics)
      .where(
        and(
          eq(courseAnalytics.userId, user.id),
          eq(courseAnalytics.courseId, courseId)
        )
      )
      .limit(1);

    return NextResponse.json({
      moduleProgress: moduleProgressData,
      analytics: analytics || null
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// POST - Update module progress
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
      isCompleted,
      quizScore,
      timeSpent
    } = body;

    if (!courseId || !moduleId || moduleIndex === undefined) {
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

    // Check if progress exists
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

    let progressData;

    if (existingProgress) {
      // Update existing progress
      const updateData = {
        lastAccessedAt: new Date(),
        updatedAt: new Date()
      };

      if (isCompleted !== undefined) {
        updateData.isCompleted = isCompleted;
        if (isCompleted) updateData.completedAt = new Date();
      }

      if (quizScore !== undefined) {
        updateData.quizScore = quizScore;
        updateData.quizAttempts = existingProgress.quizAttempts + 1;
        updateData.bestQuizScore = Math.max(
          existingProgress.bestQuizScore || 0,
          quizScore
        );
      }

      if (timeSpent !== undefined) {
        updateData.timeSpent = (existingProgress.timeSpent || 0) + timeSpent;
      }

      [progressData] = await db
        .update(moduleProgress)
        .set(updateData)
        .where(eq(moduleProgress.id, existingProgress.id))
        .returning();
    } else {
      // Create new progress
      [progressData] = await db
        .insert(moduleProgress)
        .values({
          userId: user.id,
          courseId,
          moduleId,
          moduleIndex,
          isCompleted: isCompleted || false,
          completedAt: isCompleted ? new Date() : null,
          quizScore: quizScore || null,
          quizAttempts: quizScore !== undefined ? 1 : 0,
          bestQuizScore: quizScore || 0,
          timeSpent: timeSpent || 0,
          lastAccessedAt: new Date()
        })
        .returning();
    }

    // Update course analytics
    await updateCourseAnalytics(user.id, courseId, moduleId, moduleIndex);

    return NextResponse.json({
      success: true,
      progress: progressData
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// Helper function to update course analytics
async function updateCourseAnalytics(userId, courseId, moduleId, moduleIndex) {
  try {
    // Get all module progress for this course
    const allProgress = await db
      .select()
      .from(moduleProgress)
      .where(
        and(
          eq(moduleProgress.userId, userId),
          eq(moduleProgress.courseId, courseId)
        )
      );

    const completedModules = allProgress.filter(p => p.isCompleted).length;
    const totalModules = allProgress.length || 1;
    const progressPercentage = Math.round((completedModules / totalModules) * 100);

    const quizScores = allProgress
      .filter(p => p.quizScore !== null)
      .map(p => p.quizScore);
    const averageQuizScore = quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

    const totalTimeSpent = allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const totalQuizAttempts = allProgress.reduce((sum, p) => sum + (p.quizAttempts || 0), 0);

    // Check if analytics exist
    const [existing] = await db
      .select()
      .from(courseAnalytics)
      .where(
        and(
          eq(courseAnalytics.userId, userId),
          eq(courseAnalytics.courseId, courseId)
        )
      )
      .limit(1);

    const analyticsData = {
      totalTimeSpent,
      modulesCompleted: completedModules,
      totalModules,
      progressPercentage,
      averageQuizScore,
      totalQuizAttempts,
      lastAccessedModuleId: moduleId,
      lastAccessedModuleIndex: moduleIndex,
      lastAccessedAt: new Date(),
      completedAt: progressPercentage === 100 ? new Date() : null,
      updatedAt: new Date()
    };

    if (existing) {
      await db
        .update(courseAnalytics)
        .set(analyticsData)
        .where(eq(courseAnalytics.id, existing.id));
    } else {
      await db
        .insert(courseAnalytics)
        .values({
          userId,
          courseId,
          ...analyticsData
        });
    }
  } catch (error) {
    console.error('Error updating course analytics:', error);
  }
}
