import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { moduleProgress, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logModuleCompleted } from '@/lib/activity-logger';

// POST - Mark a module as complete
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { courseId, moduleId, moduleIndex } = await req.json();

        if (!courseId || moduleId === undefined) {
            return NextResponse.json({ error: 'Missing courseId or moduleId' }, { status: 400 });
        }

        // Get the database user ID
        const dbUsers = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
        if (dbUsers.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const dbUserId = dbUsers[0].id;

        // Check if progress entry exists
        const existing = await db.select().from(moduleProgress).where(
            and(
                eq(moduleProgress.userId, dbUserId),
                eq(moduleProgress.courseId, courseId),
                eq(moduleProgress.moduleId, String(moduleId))
            )
        ).limit(1);

        // Track if this is a new completion (for activity logging)
        const wasAlreadyCompleted = existing.length > 0 && existing[0].isCompleted;

        if (existing.length > 0) {
            // Update existing entry
            await db.update(moduleProgress)
                .set({
                    isCompleted: true,
                    completedAt: new Date(),
                    lastAccessedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(moduleProgress.id, existing[0].id));
        } else {
            // Insert new entry
            await db.insert(moduleProgress).values({
                userId: dbUserId,
                courseId,
                moduleId: String(moduleId),
                moduleIndex: moduleIndex || 0,
                isCompleted: true,
                completedAt: new Date(),
                lastAccessedAt: new Date(),
            });
        }

        // Log MODULE_COMPLETED activity (only if not already completed - idempotency)
        if (!wasAlreadyCompleted) {
            await logModuleCompleted(userId, courseId, moduleId, moduleIndex || 0);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking module complete:', error);
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }
}

