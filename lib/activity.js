import { db } from '@/lib/db';
import { activityLog, fileImports } from '@/lib/db/schema';

// Event types
export const ActivityTypes = {
    COURSE_CREATED: 'COURSE_CREATED',
    COURSE_VIEW: 'COURSE_VIEW',
    COURSE_VIEWED: 'COURSE_VIEWED', // Legacy - keep for backwards compatibility
    CHAPTER_VIEWED: 'CHAPTER_VIEWED',
    FILE_UPLOADED: 'FILE_UPLOADED',
    AI_MESSAGE_SENT: 'AI_MESSAGE_SENT',
    CATEGORY_SELECTED: 'CATEGORY_SELECTED',
    QUIZ_COMPLETED: 'QUIZ_COMPLETED',
    MODULE_COMPLETED: 'MODULE_COMPLETED',
};

/**
 * Log a user activity event
 * @param {string} userId - Clerk user ID
 * @param {string} type - Event type from ActivityTypes
 * @param {object} meta - Additional metadata
 */
export async function logUserEvent(userId, type, meta = {}) {
    try {
        if (!userId || !type) {
            console.warn('logUserEvent: Missing userId or type');
            return null;
        }

        const result = await db.insert(activityLog).values({
            userId,
            type,
            meta,
        }).returning();

        return result[0];
    } catch (error) {
        console.error('Error logging user event:', error);
        return null;
    }
}

/**
 * Log a file import
 * @param {string} userId - Clerk user ID
 * @param {object} fileInfo - File information
 */
export async function logFileImport(userId, fileInfo) {
    try {
        if (!userId) return null;

        const result = await db.insert(fileImports).values({
            userId,
            fileName: fileInfo.fileName,
            fileType: fileInfo.fileType,
            fileSize: fileInfo.fileSize,
            sourceUrl: fileInfo.sourceUrl,
            courseId: fileInfo.courseId,
        }).returning();

        // Also log as activity
        await logUserEvent(userId, ActivityTypes.FILE_UPLOADED, {
            fileName: fileInfo.fileName,
            fileType: fileInfo.fileType,
        });

        return result[0];
    } catch (error) {
        console.error('Error logging file import:', error);
        return null;
    }
}

/**
 * Get activity count by type for a user
 * @param {string} userId - Clerk user ID
 * @param {string} type - Event type
 * @param {number} days - Number of days to look back
 */
export async function getActivityCount(userId, type, days = 7) {
    try {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const result = await db.query.activityLog.findMany({
            where: (log, { eq, and, gte }) => and(
                eq(log.userId, userId),
                eq(log.type, type),
                gte(log.createdAt, since)
            ),
        });

        return result.length;
    } catch (error) {
        console.error('Error getting activity count:', error);
        return 0;
    }
}
