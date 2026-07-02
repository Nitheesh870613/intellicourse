import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { courses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userCourses = await db.select().from(courses).where(eq(courses.userId, userId));

        const totalCourses = userCourses.length;
        const totalChapters = userCourses.reduce((acc, course) => acc + (course.chapterCount || 0), 0);
        const categoriesSet = new Set(userCourses.map(c => c.category).filter(Boolean));
        const categoriesCount = categoriesSet.length;
        const videoCount = userCourses.filter(c => c.includeVideos).length;

        const categoryStats = {};
        userCourses.forEach(course => {
            const cat = course.category || 'uncategorized';
            categoryStats[cat] = (categoryStats[cat] || 0) + 1;
        });

        return NextResponse.json({
            totalCourses,
            totalChapters,
            categoriesCount,
            videoCount,
            categoryStats,
            recentCourses: userCourses.slice(0, 5),
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
