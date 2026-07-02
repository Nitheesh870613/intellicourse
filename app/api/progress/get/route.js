import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { moduleProgress, users, courses } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Get progress for a course
export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const courseId = req.nextUrl.searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
        }

        // Get the database user ID
        const dbUsers = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
        if (dbUsers.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const dbUserId = dbUsers[0].id;

        // Get all progress entries for this course
        const progress = await db.select().from(moduleProgress).where(
            and(
                eq(moduleProgress.userId, dbUserId),
                eq(moduleProgress.courseId, courseId)
            )
        );

        // Return completed module IDs
        const completedModules = progress
            .filter(p => p.isCompleted)
            .map(p => p.moduleId);

        // Get course to calculate total modules
        const courseData = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);

        let completionPercentage = 0;

        if (courseData.length > 0) {
            const course = courseData[0];
            const modules = course.modules || [];
            const totalModules = modules.length;
            const completedCount = completedModules.length;

            if (totalModules > 0) {
                completionPercentage = Math.round((completedCount / totalModules) * 100);
            }
        }

        return NextResponse.json({
            progress,
            completedModules,
            totalCompleted: completedModules.length,
            completionPercentage
        });
    } catch (error) {
        console.error('Error getting progress:', error);
        return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 });
    }
}
