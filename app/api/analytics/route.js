import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  courseAnalytics,
  moduleProgress,
  quizAttempts,
  users,
  courses
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// GET - Fetch analytics for a user
export async function GET(request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const type = searchParams.get('type') || 'overview'; // overview, course, quiz

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (type === 'overview') {
      // Dashboard overview analytics
      const allCourseAnalytics = await db
        .select()
        .from(courseAnalytics)
        .where(eq(courseAnalytics.userId, user.id));

      const totalCourses = allCourseAnalytics.length;
      const completedCourses = allCourseAnalytics.filter(a => a.completedAt).length;
      const inProgressCourses = totalCourses - completedCourses;

      const totalTimeSpent = allCourseAnalytics.reduce(
        (sum, a) => sum + (a.totalTimeSpent || 0),
        0
      );

      const totalModulesCompleted = allCourseAnalytics.reduce(
        (sum, a) => sum + (a.modulesCompleted || 0),
        0
      );

      const averageQuizScore =
        allCourseAnalytics.length > 0
          ? Math.round(
              allCourseAnalytics.reduce((sum, a) => sum + (a.averageQuizScore || 0), 0) /
                allCourseAnalytics.length
            )
          : 0;

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentProgress = await db
        .select()
        .from(moduleProgress)
        .where(
          and(
            eq(moduleProgress.userId, user.id),
            sql`${moduleProgress.lastAccessedAt} >= ${sevenDaysAgo}`
          )
        )
        .orderBy(desc(moduleProgress.lastAccessedAt))
        .limit(10);

      return NextResponse.json({
        overview: {
          totalCourses,
          completedCourses,
          inProgressCourses,
          totalTimeSpent,
          totalModulesCompleted,
          averageQuizScore,
          averageCompletionRate:
            totalCourses > 0
              ? Math.round((completedCourses / totalCourses) * 100)
              : 0
        },
        recentActivity: recentProgress
      });
    } else if (type === 'course' && courseId) {
      // Specific course analytics
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

      const moduleProgressData = await db
        .select()
        .from(moduleProgress)
        .where(
          and(
            eq(moduleProgress.userId, user.id),
            eq(moduleProgress.courseId, courseId)
          )
        )
        .orderBy(moduleProgress.moduleIndex);

      const quizAttemptsData = await db
        .select()
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, user.id),
            eq(quizAttempts.courseId, courseId)
          )
        )
        .orderBy(desc(quizAttempts.createdAt));

      return NextResponse.json({
        analytics,
        moduleProgress: moduleProgressData,
        quizAttempts: quizAttemptsData
      });
    } else if (type === 'quiz' && courseId) {
      // Quiz performance analytics
      const allAttempts = await db
        .select()
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, user.id),
            eq(quizAttempts.courseId, courseId)
          )
        )
        .orderBy(desc(quizAttempts.createdAt));

      // Group by module
      const moduleStats = {};
      allAttempts.forEach(attempt => {
        const key = attempt.moduleId;
        if (!moduleStats[key]) {
          moduleStats[key] = {
            moduleId: attempt.moduleId,
            moduleIndex: attempt.moduleIndex,
            attempts: [],
            bestScore: 0,
            averageScore: 0,
            totalAttempts: 0
          };
        }
        moduleStats[key].attempts.push(attempt);
        moduleStats[key].bestScore = Math.max(moduleStats[key].bestScore, attempt.score);
        moduleStats[key].totalAttempts++;
      });

      // Calculate averages
      Object.keys(moduleStats).forEach(key => {
        const stats = moduleStats[key];
        stats.averageScore = Math.round(
          stats.attempts.reduce((sum, a) => sum + a.score, 0) / stats.totalAttempts
        );
      });

      return NextResponse.json({
        totalAttempts: allAttempts.length,
        moduleStats: Object.values(moduleStats),
        recentAttempts: allAttempts.slice(0, 10)
      });
    }

    return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
