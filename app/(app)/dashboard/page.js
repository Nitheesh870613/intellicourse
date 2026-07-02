import { currentUser } from '@clerk/nextjs/server';
import DashboardClient from './components/DashboardClient';
import { db, safeQuery } from '@/lib/db';
import { courses, chapters, moduleProgress, users } from '@/lib/db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import { redirect } from 'next/navigation';

async function getAnalytics(clerkId) {
	try {
		// Get internal user ID from Clerk ID with retry logic for connection issues
		const dbUser = await safeQuery(() =>
			db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
		);

		if (!dbUser || dbUser.length === 0) {
			console.log("User not found in database, returning empty analytics");
			return {};
		}

		const userId = dbUser[0].id; // Internal UUID

		const userCourses = await safeQuery(() =>
			db.select().from(courses).where(eq(courses.userId, userId))
		);
		const totalCourses = userCourses.length;

		// Calculate total chapters (from courses.chapterCount)
		const totalChapters = userCourses.reduce((sum, course) => sum + (course.chapterCount || 0), 0);

		// Placeholder for words generated (this would ideally be a sum of content usage or a stored field)
		// For now, we estimate based on typical module length if not stored, 
		// or query a stats table if available.
		// The original code used 'totalWordsGenerated', let's mock it for now based on chapters * ~1000
		const totalWordsGenerated = totalChapters * 1200;

		// Calculate Category Distribution
		const categories = {};
		userCourses.forEach(c => {
			const cat = c.category || 'Uncategorized';
			categories[cat] = (categories[cat] || 0) + 1;
		});

		const categoryDistribution = Object.entries(categories).map(([name, count]) => ({
			name,
			count,
			percentage: Math.round((count / totalCourses) * 100)
		})).sort((a, b) => b.count - a.count);

		// Calculate Completion Rate (Mocked for now as it requires complex joins on moduleProgress)
		// Ideally: count(completed_modules) / count(total_modules)
		// Using a simpler query for speed in this refactor step:
		const completedModules = await safeQuery(() =>
			db
				.select({ count: count() })
				.from(moduleProgress)
				.where(
					sql`${moduleProgress.userId} = ${userId} AND ${moduleProgress.isCompleted} = true`
				)
		);

		const completedCount = completedModules[0]?.count || 0;
		const totalModules = totalChapters; // Approximation
		const overallCompletionRate = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

		// Trending stats
		const mostActiveCategory = categoryDistribution[0] ? {
			name: categoryDistribution[0].name,
			engagement: 75 + Math.floor(Math.random() * 20) // Mock engagement for now
		} : null;

		return {
			totalCourses,
			totalChapters,
			totalWordsGenerated,
			categoryDistribution,
			mostActiveCategory,
			completedModulesCount: completedCount,
			totalModulesCount: totalModules,
			trendingTopic: { name: userCourses[0]?.topic || 'No courses' },
			weeklyGrowth: 12, // Placeholder
			overallCompletionRate,
			fileImportsCount: 0 // Placeholder
		};
	} catch (error) {
		console.error("Dashboard Analytics Error", error);
		return {};
	}
}

export default async function Dashboard() {
	const user = await currentUser();

	if (!user) {
		redirect('/sign-in');
	}

	// Fetch data directly from DB
	const analytics = await getAnalytics(user.id);

	return (
		<DashboardClient
			userFirstName={user.firstName}
			analytics={analytics}
		/>
	);
}
