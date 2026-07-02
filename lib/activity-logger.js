/**
 * Activity Logging Helper
 * 
 * Provides a safe, reusable function for logging user activities.
 * All logging is wrapped in try/catch to never break the user experience.
 */

import { db } from '@/lib/db';
import { activityLog } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Log an activity to the activity_log table
 * @param {string} userId - Clerk user ID
 * @param {string} type - Activity type (COURSE_VIEW, COURSE_CREATED, MODULE_COMPLETED, etc.)
 * @param {object} meta - Additional metadata (courseId, moduleId, title, etc.)
 * @returns {Promise<boolean>} - True if logged successfully, false otherwise
 */
export async function logActivity(userId, type, meta = {}) {
    if (!userId || !type) {
        console.error('logActivity: Missing required userId or type');
        return false;
    }

    try {
        await db.insert(activityLog).values({
            userId,
            type,
            meta,
        });
        return true;
    } catch (err) {
        console.error(`Activity logging failed [${type}]:`, err.message);
        return false;
    }
}

/**
 * Log COURSE_VIEW activity with duplicate prevention within a time window
 * @param {string} userId - Clerk user ID
 * @param {string} courseId - Course UUID
 * @param {string} title - Course title
 * @param {number} windowMinutes - Window in minutes to prevent duplicate logs (default: 30)
 */
export async function logCourseView(userId, courseId, title, windowMinutes = 30) {
    if (!userId || !courseId) return false;

    try {
        // Check for recent view (within window) to prevent duplicate logging
        const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

        const recentView = await db.select({ id: activityLog.id })
            .from(activityLog)
            .where(and(
                eq(activityLog.userId, userId),
                eq(activityLog.type, 'COURSE_VIEW'),
                sql`${activityLog.meta}->>'courseId' = ${courseId}`,
                sql`${activityLog.createdAt} >= ${windowStart}`
            ))
            .limit(1);

        if (recentView.length > 0) {
            // Already logged within window, skip
            return true;
        }

        return await logActivity(userId, 'COURSE_VIEW', { courseId, title });
    } catch (err) {
        console.error('logCourseView error:', err.message);
        return false;
    }
}

/**
 * Log MODULE_COMPLETED activity with idempotency
 * @param {string} userId - Clerk user ID
 * @param {string} courseId - Course UUID
 * @param {string} moduleId - Module ID
 * @param {number} moduleIndex - Module index
 */
export async function logModuleCompleted(userId, courseId, moduleId, moduleIndex) {
    if (!userId || !courseId || moduleId === undefined) return false;

    try {
        // Check if this module completion was already logged (idempotency)
        const existing = await db.select({ id: activityLog.id })
            .from(activityLog)
            .where(and(
                eq(activityLog.userId, userId),
                eq(activityLog.type, 'MODULE_COMPLETED'),
                sql`${activityLog.meta}->>'courseId' = ${courseId}`,
                sql`${activityLog.meta}->>'moduleId' = ${String(moduleId)}`
            ))
            .limit(1);

        if (existing.length > 0) {
            // Already logged, skip for idempotency
            return true;
        }

        return await logActivity(userId, 'MODULE_COMPLETED', {
            courseId,
            moduleId: String(moduleId),
            moduleIndex
        });
    } catch (err) {
        console.error('logModuleCompleted error:', err.message);
        return false;
    }
}

/**
 * Log COURSE_CREATED activity
 * @param {string} userId - Clerk user ID
 * @param {string} courseId - Course UUID
 * @param {string} title - Course title
 * @param {string} source - Source of creation ('AI' or 'OCR')
 */
export async function logCourseCreated(userId, courseId, title, source = 'AI') {
    if (!userId || !courseId) return false;

    return await logActivity(userId, 'COURSE_CREATED', {
        courseId,
        title,
        source
    });
}
