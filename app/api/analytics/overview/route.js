
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, safeQuery } from '@/lib/db';
import { users, courses, chapters, moduleProgress } from '@/lib/db/schema';
import { eq, sql, and, gte, lt, desc } from 'drizzle-orm';
import { getCached, setCached, CACHE_TTL } from '@/lib/cache/apiCache';

function capitalize(str) {
    if (!str) return 'General';
    return str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase();
}

export async function GET(request) {
    return safeQuery(async () => {
        try {
            const { userId } = await auth();

            if (!userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            // Check cache first (5 minutes TTL as recommended)
            const cached = await getCached('analytics', { userId }, 300);
            if (cached) {
                return NextResponse.json({ ...cached, cached: true });
            }

            // Step 1: Get the database user by clerkId
            const dbUser = await db.select()
                .from(users)
                .where(eq(users.clerkId, userId))
                .limit(1);

            if (dbUser.length === 0) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            const internalUserId = dbUser[0].id;

            // Step 2: Metrics Queries
            // Total Courses
            const coursesResult = await db.select({ count: sql`count(*)` })
                .from(courses)
                .where(eq(courses.userId, internalUserId));
            const totalCourses = parseInt(coursesResult[0]?.count || '0');

            // Total Modules (Count chapters)
            const chaptersResult = await db.select({ count: sql`count(chapters.id)` })
                .from(chapters)
                .innerJoin(courses, eq(chapters.courseId, courses.id))
                .where(eq(courses.userId, internalUserId));
            const totalModules = parseInt(chaptersResult[0]?.count || '0');

            // Completed Modules (module_progress is_completed=true)
            const completedResult = await db.select({ count: sql`count(*)` })
                .from(moduleProgress)
                .where(and(
                    eq(moduleProgress.userId, internalUserId),
                    eq(moduleProgress.isCompleted, true)
                ));
            const completedModules = parseInt(completedResult[0]?.count || '0');

            // Completion Rate (Safety Guard)
            const completionRate = totalModules > 0
                ? Math.round((completedModules / totalModules) * 100)
                : 0;

            // Last Active (Max updated_at from progress)
            const lastActiveResult = await db.select({ lastActive: sql`max(updated_at)` })
                .from(moduleProgress)
                .where(eq(moduleProgress.userId, internalUserId));
            const lastActive = lastActiveResult[0]?.lastActive || null;


            // Step 3: Weekly Progress (Gap Filling)
            // Initializing last 6 weeks
            const weeks = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i * 7);
                // Create a key like "Week 1", "Week 2" for display or ISO string
                // Requirement says "Week 1" or ISO date strings. 
                // Let's use ISO start of week date string for chart X-axis parsing
                // Or simplified label M/D
                const startOfWeek = new Date(d);
                startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
                weeks.push({
                    label: `Week ${6 - i}`, // Simple label
                    date: startOfWeek.toISOString().split('T')[0], // actual date for sorting/matching
                    completed: 0
                });
            }

            // Query logic for grouping by week
            // Postgres date_trunc('week', ...)
            // We fetch counts grouped by week for this user
            const weeklyStats = await db.execute(sql`
                SELECT DATE_TRUNC('week', completed_at) as week_start, COUNT(*) as count
                FROM module_progress
                WHERE user_id = ${internalUserId} 
                  AND is_completed = true 
                  AND completed_at >= NOW() - INTERVAL '6 weeks'
                GROUP BY week_start
                ORDER BY week_start ASC
            `);

            // Map DB results to our weeks array
            // Note: simple mapping, might need improved date matching logic in production
            // but for now relying on approximate week bucketing
            // Actually, let's just map loosely based on date proximity if perfect matching is hard
            // Better: Iterate and match ISO strings

            // Using a simpler approach: Just map the DB results directly if we want exact dates, 
            // but the "Gap Filling" requirement is key.
            // Let's stick to the 6 week buckets we created.

            // Re-refining Weekly Progress:
            // Let's make an array of the last 6 weeks ending today.
            const weeklyProgress = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - (i * 7));
                const dateStr = date.toISOString().split('T')[0];

                // Find matching stat (roughly)
                // This is tricky with exact SQL matches. 
                // Let's rely on JS processing for the exact "last 6 weeks" logic.
                weeklyProgress.push({
                    date: dateStr,
                    completed: 0
                });
            }
            // Just populate standard structure
            if (weeklyStats.rows) {
                weeklyStats.rows.forEach(row => {
                    // Find the closest week bucket? 
                    // Or just simply push the rows that exist?
                    // Requirement: "Always return last 6 weeks. Fill missing with 0."
                    // Let's just create 6 empty slots with Week Labels and fill them.
                    // The chart expects { date, modules }
                });
            }

            // Real Logic for Gap Filling:
            // get all progress in last 42 days
            const detailedProgress = await db.select({ date: moduleProgress.completedAt })
                .from(moduleProgress)
                .where(and(
                    eq(moduleProgress.userId, internalUserId),
                    eq(moduleProgress.isCompleted, true),
                    gte(moduleProgress.completedAt, new Date(Date.now() - 42 * 24 * 60 * 60 * 1000))
                ));

            // Bucket into weeks
            const weekBuckets = {};
            const today = new Date();
            // Create 6 buckets based on "Week ending on X"
            for (let i = 0; i < 6; i++) {
                // 0 is this week
                const d = new Date(today);
                d.setDate(d.getDate() - (i * 7));
                const key = d.toISOString().split('T')[0]; // simple key
                weekBuckets[i] = { date: key, count: 0 };
            }

            detailedProgress.forEach(p => {
                const pDate = new Date(p.date);
                const diffTime = Math.abs(today - pDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const bucketIndex = Math.floor(diffDays / 7);
                if (bucketIndex < 6) {
                    weekBuckets[bucketIndex].count++;
                }
            });

            // Convert to array (Week 6 ago -> Current Week)
            const finalWeeklyProgress = [];
            for (let i = 5; i >= 0; i--) {
                const bucket = weekBuckets[i];
                finalWeeklyProgress.push({
                    date: new Date(bucket.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
                    modules: bucket.count
                });
            }


            // Step 4: Category Distribution (Normalization)
            const allUserCourses = await db.select({ category: courses.category })
                .from(courses)
                .where(eq(courses.userId, internalUserId));

            const catMap = {};
            allUserCourses.forEach(c => {
                const normalized = capitalize(c.category);
                catMap[normalized] = (catMap[normalized] || 0) + 1;
            });

            const categoryDistribution = Object.entries(catMap).map(([name, value]) => ({
                name,
                value
            }));

            // Step 5: Insights
            const insights = [];

            // 1. Dominant Category
            let dominantCat = null;
            let maxCatCount = 0;
            categoryDistribution.forEach(c => {
                if (c.value > maxCatCount) {
                    maxCatCount = c.value;
                    dominantCat = c.name;
                }
            });
            const totalForCats = Math.max(totalCourses, 1);
            if (dominantCat && (maxCatCount / totalForCats) > 0.3) {
                const pct = Math.round((maxCatCount / totalForCats) * 100);
                insights.push(`You focus heavily on ${dominantCat} courses (${pct}%)`);
            }

            // 2. Activity Trend (This week vs Last week)
            // Reuse logic from weekly buckets: bucket[0] is this week, bucket[1] is last week
            const thisWeekCount = weekBuckets[0].count;
            const lastWeekCount = weekBuckets[1].count;
            if (thisWeekCount > lastWeekCount) {
                insights.push("Your learning activity increased this week compared to last");
            } else if (thisWeekCount < lastWeekCount) {
                insights.push("You were less active this week compared to last");
            }

            // 3. Consistency
            // Check if active for at least 3 weeks in a row
            let streak = 0;
            for (let i = 0; i < 3; i++) {
                if (weekBuckets[i].count > 0) streak++;
            }
            if (streak >= 3) {
                insights.push("You are learning consistently over time");
            } else if (insights.length < 3) {
                insights.push("Try completing at least one module per week");
            }

            // Limit to 3 (Safety)
            const finalInsights = insights.slice(0, 3);

            // Step 6: Recommendations
            const recommendationsMap = {
                'Artificial Intelligence': ['Advanced ML', 'Model Optimization', 'NLP Basics'],
                'Web Development': ['System Design', 'Frontend Performance', 'React Patterns'],
                'Design': ['UI/UX Principles', 'Color Theory', 'Figma Mastery'],
                'Data Science': ['Data Visualization', 'Python for Data', 'Statistics'],
                'Computer Science': ['Algorithms', 'Data Structures', 'Operating Systems']
            };

            const defaultRecs = ["Short-form courses", "Foundations refresher", "Productivity hacks"];

            // Fuzzy match logic or strict? Strict based on normalized naming
            let recommendations = defaultRecs;
            if (dominantCat) {
                // Try to match partial
                const key = Object.keys(recommendationsMap).find(k => dominantCat.includes(k) || k.includes(dominantCat));
                if (key) {
                    recommendations = recommendationsMap[key];
                }
            }


            const response = {
                totalCourses,
                totalModules,
                completedModules,
                completionRate,
                lastActive: lastActive ? lastActive.toISOString() : null,
                weeklyProgress: finalWeeklyProgress,
                categoryDistribution, // Recharts ready { name, value }
                insights: finalInsights,
                recommendations,
                dataSource: ['courses', 'chapters', 'module_progress']
            };

            await setCached('analytics', { userId }, response);
            return NextResponse.json(response);

        } catch (error) {
            console.error('Analytics real data error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch analytics', details: error.message },
                { status: 500 }
            );
        }
    });
}
