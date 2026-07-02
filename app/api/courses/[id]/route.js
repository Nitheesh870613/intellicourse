import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { courses, chapters, users, courseAnalytics, moduleProgress, quizAttempts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logCourseView } from '@/lib/activity-logger';

// GET - Export a single course with all its data
export async function GET(request, context) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params for Next.js 15 compatibility
    const { id: courseId } = await context.params;

    // Get user from database
    const dbUsers = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
    if (dbUsers.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the course
    const courseData = await db.select().from(courses).where(
      and(eq(courses.id, courseId), eq(courses.userId, dbUsers[0].id))
    ).limit(1);

    if (courseData.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courseData[0];

    // Log COURSE_VIEW activity (with 30-min dedup window)
    await logCourseView(userId, courseId, course.title);

    // Get all chapters for this course
    const courseChapters = await db.select().from(chapters).where(eq(chapters.courseId, courseId));

    // Get analytics
    let analytics = null;
    try {
      const analyticsData = await db.select().from(courseAnalytics).where(
        and(eq(courseAnalytics.courseId, courseId), eq(courseAnalytics.userId, dbUsers[0].id))
      ).limit(1);
      analytics = analyticsData[0] || null;
    } catch (e) {
      // Table might not exist
    }

    // Get module progress
    let progress = [];
    try {
      progress = await db.select().from(moduleProgress).where(
        and(eq(moduleProgress.courseId, courseId), eq(moduleProgress.userId, dbUsers[0].id))
      );
    } catch (e) {
      // Table might not exist
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      course: {
        ...course,
        chapters: courseChapters,
      },
      analytics,
      progress,
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting course:', error);
    return NextResponse.json({ error: 'Failed to export course' }, { status: 500 });
  }
}

// DELETE - Delete a course and all its data
export async function DELETE(request, context) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params for Next.js 15 compatibility
    const { id: courseId } = await context.params;

    // Get user from database
    const dbUsers = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
    if (dbUsers.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the course belongs to this user
    const courseData = await db.select().from(courses).where(
      and(eq(courses.id, courseId), eq(courses.userId, dbUsers[0].id))
    ).limit(1);

    if (courseData.length === 0) {
      return NextResponse.json({ error: 'Course not found or not authorized' }, { status: 404 });
    }

    // Delete in order to respect foreign key constraints

    // 1. Delete quiz attempts for this course
    try {
      await db.delete(quizAttempts).where(eq(quizAttempts.courseId, courseId));
    } catch (e) {
      console.log('Quiz attempts delete skipped:', e.message);
    }

    // 2. Delete module progress for this course
    try {
      await db.delete(moduleProgress).where(eq(moduleProgress.courseId, courseId));
    } catch (e) {
      console.log('Module progress delete skipped:', e.message);
    }

    // 3. Delete course analytics
    try {
      await db.delete(courseAnalytics).where(eq(courseAnalytics.courseId, courseId));
    } catch (e) {
      console.log('Course analytics delete skipped:', e.message);
    }

    // 4. Delete chapters (should cascade, but explicit is safer)
    await db.delete(chapters).where(eq(chapters.courseId, courseId));

    // 5. Delete the course
    await db.delete(courses).where(eq(courses.id, courseId));

    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
