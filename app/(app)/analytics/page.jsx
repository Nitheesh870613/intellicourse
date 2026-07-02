import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, courses, chapters, moduleProgress } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import AuthGuard from '@/components/AuthGuard';
import AnalyticsClient from './AnalyticsClient';

function capitalize(str) {
  if (!str) return 'General';
  return str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase();
}

async function getAnalyticsData(userId) {
  try {
    // Step 1: Get the database user by clerkId
    const dbUser = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (dbUser.length === 0) {
      return null;
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

    // Completion Rate
    const completionRate = totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

    // Last Active
    const lastActiveResult = await db.select({ lastActive: sql`max(updated_at)` })
      .from(moduleProgress)
      .where(eq(moduleProgress.userId, internalUserId));
    const lastActiveRaw = lastActiveResult[0]?.lastActive || null;
    // Handle lastActive which may be a Date, string, or null
    const lastActive = lastActiveRaw 
      ? (lastActiveRaw instanceof Date ? lastActiveRaw : new Date(lastActiveRaw))
      : null;

    // Step 3: Weekly Progress
    const today = new Date();
    const weekBuckets = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (i * 7));
      const key = d.toISOString().split('T')[0];
      weekBuckets[i] = { date: key, count: 0 };
    }

    const detailedProgress = await db.select({ date: moduleProgress.completedAt })
      .from(moduleProgress)
      .where(and(
        eq(moduleProgress.userId, internalUserId),
        eq(moduleProgress.isCompleted, true),
        gte(moduleProgress.completedAt, new Date(Date.now() - 42 * 24 * 60 * 60 * 1000))
      ));

    detailedProgress.forEach(p => {
      if (p.date) {
        const pDate = new Date(p.date);
        const diffTime = Math.abs(today - pDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const bucketIndex = Math.floor(diffDays / 7);
        if (bucketIndex < 6) {
          weekBuckets[bucketIndex].count++;
        }
      }
    });

    const weeklyProgress = [];
    for (let i = 5; i >= 0; i--) {
      const bucket = weekBuckets[i];
      weeklyProgress.push({
        date: new Date(bucket.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        modules: bucket.count
      });
    }

    // Step 4: Category Distribution
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

    const thisWeekCount = weekBuckets[0].count;
    const lastWeekCount = weekBuckets[1].count;
    if (thisWeekCount > lastWeekCount) {
      insights.push("Your learning activity increased this week compared to last");
    } else if (thisWeekCount < lastWeekCount) {
      insights.push("You were less active this week compared to last");
    }

    let streak = 0;
    for (let i = 0; i < 3; i++) {
      if (weekBuckets[i].count > 0) streak++;
    }
    if (streak >= 3) {
      insights.push("You are learning consistently over time");
    } else if (insights.length < 3) {
      insights.push("Try completing at least one module per week");
    }

    // Step 6: Recommendations
    const recommendationsMap = {
      'Artificial Intelligence': ['Advanced ML', 'Model Optimization', 'NLP Basics'],
      'Web Development': ['System Design', 'Frontend Performance', 'React Patterns'],
      'Design': ['UI/UX Principles', 'Color Theory', 'Figma Mastery'],
      'Data Science': ['Data Visualization', 'Python for Data', 'Statistics'],
      'Computer Science': ['Algorithms', 'Data Structures', 'Operating Systems'],
      'Programming': ['Clean Code', 'Design Patterns', 'Testing Fundamentals'],
      'Machine Learning': ['Neural Networks', 'Feature Engineering', 'Model Deployment']
    };

    const defaultRecs = ["Short-form courses", "Foundations refresher", "Productivity hacks"];
    let recommendations = defaultRecs;
    if (dominantCat) {
      const key = Object.keys(recommendationsMap).find(k => 
        dominantCat.toLowerCase().includes(k.toLowerCase()) || 
        k.toLowerCase().includes(dominantCat.toLowerCase())
      );
      if (key) {
        recommendations = recommendationsMap[key];
      }
    }

    return {
      totalCourses,
      totalModules,
      completedModules,
      completionRate,
      lastActive: lastActive ? lastActive.toISOString() : null,
      weeklyProgress,
      categoryDistribution,
      insights: insights.slice(0, 3),
      recommendations
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return null;
  }
}

export default async function AnalyticsPage() {
  const { userId } = await auth();
  let analyticsData = null;

  if (userId) {
    analyticsData = await getAnalyticsData(userId);
  }

  return (
    <div className="min-h-screen bg-[#0f0f17]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Analytics Overview</h1>
          <p className="text-sm text-gray-400">
            A focused view of your IntelliCourse learning analytics.
          </p>
        </header>

        <AuthGuard>
          <AnalyticsClient data={analyticsData} />
        </AuthGuard>
      </div>
    </div>
  );
}
