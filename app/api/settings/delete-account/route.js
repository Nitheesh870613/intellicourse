import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, courses, chapters, activityLog, userSettings, courseAnalytics, moduleProgress, quizAttempts, userProgress, userNotes } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// DELETE - Delete user account and all data
export async function DELETE() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user from database
        const dbUsers = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
        const dbUser = dbUsers[0];

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const dbUserId = dbUser.id;

        // Delete in order to respect foreign key constraints

        // 1. Delete activity logs
        try {
            await db.delete(activityLog).where(eq(activityLog.userId, userId));
        } catch (e) {
            console.log('Activity log delete skipped:', e.message);
        }

        // 2. Delete user settings
        try {
            await db.delete(userSettings).where(eq(userSettings.userId, userId));
        } catch (e) {
            console.log('User settings delete skipped:', e.message);
        }

        // 3. Get all course IDs for this user
        const userCourses = await db.select({ id: courses.id }).from(courses).where(eq(courses.userId, dbUserId));
        const courseIds = userCourses.map(c => c.id);

        // 4. Delete quiz attempts
        try {
            if (courseIds.length > 0) {
                await db.delete(quizAttempts).where(eq(quizAttempts.userId, dbUserId));
            }
        } catch (e) {
            console.log('Quiz attempts delete skipped:', e.message);
        }

        // 5. Delete user progress
        try {
            await db.delete(userProgress).where(eq(userProgress.userId, dbUserId));
        } catch (e) {
            console.log('User progress delete skipped:', e.message);
        }

        // 6. Delete module progress
        try {
            await db.delete(moduleProgress).where(eq(moduleProgress.userId, dbUserId));
        } catch (e) {
            console.log('Module progress delete skipped:', e.message);
        }

        // 7. Delete course analytics
        try {
            await db.delete(courseAnalytics).where(eq(courseAnalytics.userId, dbUserId));
        } catch (e) {
            console.log('Course analytics delete skipped:', e.message);
        }

        // 8. Delete user notes
        try {
            await db.delete(userNotes).where(eq(userNotes.userId, dbUserId));
        } catch (e) {
            console.log('User notes delete skipped:', e.message);
        }

        // 9. Delete chapters (cascades from courses, but explicit is safer)
        try {
            if (courseIds.length > 0) {
                for (const courseId of courseIds) {
                    await db.delete(chapters).where(eq(chapters.courseId, courseId));
                }
            }
        } catch (e) {
            console.log('Chapters delete skipped:', e.message);
        }

        // 10. Delete courses
        try {
            await db.delete(courses).where(eq(courses.userId, dbUserId));
        } catch (e) {
            console.log('Courses delete skipped:', e.message);
        }

        // 11. Delete user record
        await db.delete(users).where(eq(users.id, dbUserId));

        // 12. Delete Clerk user
        try {
            const client = await clerkClient();
            await client.users.deleteUser(userId);
        } catch (clerkError) {
            console.error('Error deleting Clerk user:', clerkError);
            // User is already deleted from DB, so we continue
        }

        return NextResponse.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
