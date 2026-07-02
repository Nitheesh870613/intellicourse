import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, courses, chapters, activityLog, userSettings, courseAnalytics, moduleProgress } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET - Export all user data
export async function GET() {
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

        // Get all user courses
        const userCourses = await db.select().from(courses).where(eq(courses.userId, dbUser.id));

        // Get chapters for all courses
        const courseIds = userCourses.map(c => c.id);
        let allChapters = [];
        if (courseIds.length > 0) {
            allChapters = await db.select().from(chapters).where(
                sql`${chapters.courseId} IN ${courseIds}`
            );
        }

        // Get user settings
        let settings = null;
        try {
            const settingsData = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
            settings = settingsData[0] || null;
        } catch (e) {
            // Table might not exist
        }

        // Get activity logs
        let activities = [];
        try {
            activities = await db.select().from(activityLog).where(eq(activityLog.userId, userId));
        } catch (e) {
            // Table might not exist
        }

        // Get course analytics
        let analytics = [];
        try {
            analytics = await db.select().from(courseAnalytics).where(eq(courseAnalytics.userId, dbUser.id));
        } catch (e) {
            // Table might not exist
        }

        // Get module progress
        let progress = [];
        try {
            progress = await db.select().from(moduleProgress).where(eq(moduleProgress.userId, dbUser.id));
        } catch (e) {
            // Table might not exist
        }

        const exportData = {
            exportedAt: new Date().toISOString(),
            user: {
                id: dbUser.id,
                email: dbUser.email,
                firstName: dbUser.firstName,
                lastName: dbUser.lastName,
                createdAt: dbUser.createdAt,
            },
            settings,
            courses: userCourses,
            chapters: allChapters,
            activities,
            analytics,
            progress,
        };

        return NextResponse.json(exportData);
    } catch (error) {
        console.error('Error exporting data:', error);
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
    }
}
