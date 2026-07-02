/**
 * IntelliCourse AI Analytics API
 * 
 * LLM should NEVER compute stats — only interpret them.
 * All numbers, charts, breakdowns → rule-based
 * Patterns, recommendations, strengths, weaknesses → Groq LLM
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
    users,
    courses,
    courseAnalytics,
    moduleProgress,
    quizAttempts,
    activityLog,
    fileImports
} from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// Cache and Analytics Utilities
import { getCachedAnalytics, setCachedAnalytics } from '@/lib/cache/analyticsCache';
import {
    classifyUserDomain,
    calculateTotalWords,
    calculateCategoryBreakdown,
    analyzeQuizPerformance,
    analyzeActivityPatterns,
    calculateEngagementScore,
    generateTechRecommendations,
    extractSearchableKeywords,
    generateProgressChartData,
    generateModuleCompletionStats,
    generateActivityTimeline
} from '@/lib/ai/analyzeUserData';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Call Groq LLM to interpret pre-computed stats
 */
async function generateAIInsights(stats) {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        console.warn('GROQ_API_KEY not found, using fallback insights');
        return generateFallbackInsights(stats);
    }

    const prompt = `You are IntelliCourse AI, an expert learning analytics advisor. Based on the following REAL user statistics (do NOT modify these numbers), generate personalized insights and recommendations.

=== USER STATISTICS (COMPUTED FROM DATABASE) ===
Total Courses: ${stats.totalCourses}
Total Chapters: ${stats.totalChapters}
Total Words Generated: ${stats.totalWords}
Domain: ${stats.domain} (${stats.domainConfidence}% confidence)
Overall Completion Rate: ${stats.completionRate}%
Average Quiz Score: ${stats.quizStats.averageScore}%
Quiz Pass Rate: ${stats.quizStats.passRate}%
Quiz Improvement Trend: ${stats.quizStats.improvementTrend}
Skipped Quiz Questions: ${stats.quizStats.skippedCount}
Engagement Score: ${stats.engagementScore}/100
Peak Learning Time: ${stats.activityPatterns.timePreference}
Top Categories: ${stats.categories.map(c => c.name).join(', ')}
===============================================

IMPORTANT RULES:
1. NEVER compute or modify the numbers above - they are exact and accurate
2. Only INTERPRET and provide insights based on these numbers
3. Be specific and actionable, not generic
4. Use the user's actual course categories in recommendations
5. If completion rate or quiz scores are low, give constructive advice
6. Keep responses professional and industry-grade

Return ONLY valid JSON with this exact structure:
{
  "learningPattern": "2-3 sentence analysis of their learning behavior",
  "strengths": ["strength 1 based on data", "strength 2", "strength 3"],
  "weaknesses": ["area to improve 1", "area to improve 2"],
  "behaviorAnalysis": "1-2 sentences about module completion and quiz behavior",
  "suggestedCourses": ["specific course topic 1", "course topic 2", "course topic 3"],
  "continueLearningSuggestions": ["continue with X", "proceed to Y"],
  "newFieldsToExplore": ["field 1", "field 2"]
}`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert learning analytics AI. Always respond with valid JSON only. Never compute stats, only interpret pre-computed values.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4,
                max_tokens: 1500,
            })
        });

        if (!response.ok) {
            console.error('Groq API error:', response.status);
            return generateFallbackInsights(stats);
        }

        const data = await response.json();
        let content = data.choices[0].message.content.trim();

        // Clean markdown code blocks
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');

        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            content = content.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(content);
    } catch (error) {
        console.error('Error generating AI insights:', error);
        return generateFallbackInsights(stats);
    }
}

/**
 * Fallback insights when LLM is unavailable
 */
function generateFallbackInsights(stats) {
    const isIT = stats.domain === 'IT';

    return {
        learningPattern: `You are a ${stats.activityPatterns.timePreference} who has generated ${stats.totalCourses} courses. Your engagement score of ${stats.engagementScore}/100 indicates ${stats.engagementScore >= 70 ? 'strong' : stats.engagementScore >= 40 ? 'moderate' : 'developing'} learning habits.`,
        strengths: [
            stats.totalCourses >= 5 ? 'Consistent course creation' : 'Getting started with learning',
            stats.quizStats.averageScore >= 70 ? 'Strong quiz performance' : 'Active in taking quizzes',
            stats.completionRate >= 50 ? 'Good module completion rate' : 'Exploring multiple topics'
        ],
        weaknesses: [
            stats.quizStats.skippedCount > 0 ? 'Sometimes skips quiz questions - affects retention' : null,
            stats.completionRate < 50 ? 'Consider completing modules before starting new courses' : null,
            stats.quizStats.averageScore < 60 ? 'Quiz scores could improve with more focused study' : null
        ].filter(Boolean),
        behaviorAnalysis: stats.quizStats.improvementTrend === 'improving'
            ? 'Your quiz scores are improving over time - keep up the momentum!'
            : stats.quizStats.improvementTrend === 'declining'
                ? 'Quiz scores have dipped recently - consider reviewing material before quizzes.'
                : 'Your performance is consistent. Try challenging yourself with harder topics.',
        suggestedCourses: isIT
            ? ['Advanced Machine Learning', 'Cloud Architecture with AWS', 'System Design Fundamentals']
            : ['Data-Driven Decision Making', 'Leadership & Communication', 'Strategic Thinking'],
        continueLearningSuggestions: stats.categories.slice(0, 2).map(c => `Continue with advanced ${c.name} topics`),
        newFieldsToExplore: isIT
            ? ['Prompt Engineering', 'DevSecOps', 'Edge Computing']
            : ['Business Analytics', 'Project Management', 'Digital Transformation']
    };
}

/**
 * Main GET handler
 */
export async function GET() {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check cache first (5-minute TTL)
        const cached = getCachedAnalytics(clerkUserId);
        if (cached) {
            return NextResponse.json({ ...cached, cached: true });
        }

        // Get user from database
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, clerkUserId))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch all user data
        const userCourses = await db
            .select()
            .from(courses)
            .where(eq(courses.userId, user.id))
            .orderBy(desc(courses.createdAt));

        // Handle empty data gracefully
        if (userCourses.length === 0) {
            const emptyResponse = {
                isEmpty: true,
                message: 'No data available — create your first course to unlock IntelliCourse AI insights!',
                dashboardStats: {
                    totalWords: '0',
                    totalCourses: '0',
                    totalChapters: '0',
                    categoryBreakdown: [],
                    recentActivity: 'No activity yet',
                    overallCompletionRate: '0%'
                },
                courseSearchSupport: {
                    searchableKeywords: [],
                    recommendedFilters: ['Beginner', 'Intermediate', 'Advanced']
                },
                aiInsights: {
                    learningPattern: 'Start your learning journey by creating your first course!',
                    strengths: [],
                    weaknesses: [],
                    behaviorAnalysis: 'Generate a course to begin tracking your learning patterns.',
                    peakLearningTimes: 'Not enough data',
                    engagementScore: '0/100'
                },
                technologyRecommendations: {
                    basedOnInterest: ['AI & Machine Learning', 'Web Development', 'Data Science'],
                    latestTrends: ['LLM Engineering', 'Cloud Architecture', 'Cybersecurity'],
                    skillGapsDetected: [],
                    nextSkillPaths: []
                },
                courseRecommendations: {
                    suggestedCourses: ['Introduction to Programming', 'Python for Beginners', 'Web Development Fundamentals'],
                    continueLearningSuggestions: [],
                    newFieldsToExplore: ['Technology', 'Business', 'Design']
                },
                analyticsPage: {
                    categoryPieChart: [],
                    progressLineChart: [],
                    moduleCompletionStats: [],
                    activityTimeline: []
                }
            };

            setCachedAnalytics(clerkUserId, emptyResponse);
            return NextResponse.json(emptyResponse);
        }

        // Fetch additional data
        const userCourseAnalytics = await db
            .select()
            .from(courseAnalytics)
            .where(eq(courseAnalytics.userId, user.id));

        const userModuleProgress = await db
            .select()
            .from(moduleProgress)
            .where(eq(moduleProgress.userId, user.id))
            .orderBy(desc(moduleProgress.lastAccessedAt));

        const userQuizAttempts = await db
            .select()
            .from(quizAttempts)
            .where(eq(quizAttempts.userId, user.id))
            .orderBy(desc(quizAttempts.createdAt));

        let userActivityLog = [];
        try {
            userActivityLog = await db
                .select()
                .from(activityLog)
                .where(eq(activityLog.userId, clerkUserId))
                .orderBy(desc(activityLog.createdAt))
                .limit(50);
        } catch (e) {
            // Activity log table might not exist
        }

        let userFileImports = [];
        try {
            const imports = await db
                .select({ count: sql`count(*)` })
                .from(fileImports)
                .where(eq(fileImports.userId, clerkUserId));
            userFileImports = imports;
        } catch (e) {
            // File imports table might not exist
        }

        // ========== RULE-BASED COMPUTATIONS (LLM never computes these) ==========

        const totalWords = calculateTotalWords(userCourses);
        const totalChapters = userCourses.reduce((sum, c) => sum + (c.chapterCount || 0), 0);
        const categoryBreakdown = calculateCategoryBreakdown(userCourses);
        const domainClassification = classifyUserDomain(userCourses);
        const quizStats = analyzeQuizPerformance(userQuizAttempts);
        const activityPatterns = analyzeActivityPatterns(userActivityLog, userModuleProgress);
        const engagementScore = calculateEngagementScore(userCourses, userModuleProgress, userQuizAttempts, userCourseAnalytics);
        const techRecommendations = generateTechRecommendations(userCourses, domainClassification);
        const searchableKeywords = extractSearchableKeywords(userCourses);
        const progressChartData = generateProgressChartData(userCourseAnalytics, userModuleProgress);
        const moduleCompletionStats = generateModuleCompletionStats(userCourses, userCourseAnalytics);
        const activityTimeline = generateActivityTimeline(userActivityLog, userCourses, userQuizAttempts);

        // Calculate completion rate
        const completionRate = userCourseAnalytics.length > 0
            ? Math.round(userCourseAnalytics.reduce((sum, a) => sum + (a.progressPercentage || 0), 0) / userCourseAnalytics.length)
            : 0;

        // Get recent activity description
        const lastActivity = userModuleProgress[0];
        const recentActivityDesc = lastActivity
            ? `Last active: ${new Date(lastActivity.lastAccessedAt).toLocaleDateString()}`
            : `${userCourses.length} courses created`;

        // Prepare stats for LLM interpretation
        const statsForLLM = {
            totalCourses: userCourses.length,
            totalChapters,
            totalWords,
            domain: domainClassification.domain,
            domainConfidence: domainClassification.confidence,
            completionRate,
            quizStats,
            engagementScore,
            activityPatterns,
            categories: categoryBreakdown
        };

        // ========== LLM INTERPRETATION (interprets pre-computed stats) ==========
        const aiInsights = await generateAIInsights(statsForLLM);

        // Build final response
        const response = {
            dashboardStats: {
                totalWords: totalWords.toLocaleString(),
                totalCourses: userCourses.length.toString(),
                totalChapters: totalChapters.toString(),
                categoryBreakdown,
                recentActivity: recentActivityDesc,
                overallCompletionRate: `${completionRate}%`
            },
            courseSearchSupport: {
                searchableKeywords,
                recommendedFilters: ['Beginner', 'Intermediate', 'Advanced', ...categoryBreakdown.slice(0, 3).map(c => c.name)]
            },
            aiInsights: {
                learningPattern: aiInsights.learningPattern,
                strengths: aiInsights.strengths,
                weaknesses: aiInsights.weaknesses,
                behaviorAnalysis: aiInsights.behaviorAnalysis,
                peakLearningTimes: activityPatterns.timePreference,
                engagementScore: `${engagementScore}/100`
            },
            technologyRecommendations: {
                basedOnInterest: techRecommendations.basedOnInterest,
                latestTrends: techRecommendations.latestTrends,
                skillGapsDetected: techRecommendations.skillGapsDetected,
                nextSkillPaths: techRecommendations.nextSkillPaths
            },
            courseRecommendations: {
                suggestedCourses: aiInsights.suggestedCourses || [],
                continueLearningSuggestions: aiInsights.continueLearningSuggestions || [],
                newFieldsToExplore: aiInsights.newFieldsToExplore || []
            },
            analyticsPage: {
                categoryPieChart: categoryBreakdown,
                progressLineChart: progressChartData,
                moduleCompletionStats,
                activityTimeline
            },
            _meta: {
                domain: domainClassification.domain,
                domainConfidence: domainClassification.confidence,
                generatedAt: new Date().toISOString(),
                cached: false
            }
        };

        // Cache the response
        setCachedAnalytics(clerkUserId, response);

        return NextResponse.json(response);
    } catch (error) {
        console.error('IntelliCourse AI error:', error);
        return NextResponse.json(
            { error: 'Failed to generate analytics', details: error.message },
            { status: 500 }
        );
    }
}
