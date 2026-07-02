/**
 * User Data Analytics Utilities
 * Rule-based functions for computing stats - LLM should NEVER compute stats, only interpret them
 */

// IT-related categories and topics for domain classification
const IT_KEYWORDS = [
    'programming', 'software', 'development', 'web', 'app', 'mobile', 'database',
    'machine learning', 'ai', 'artificial intelligence', 'data science', 'python',
    'javascript', 'react', 'node', 'cloud', 'aws', 'azure', 'gcp', 'devops',
    'cybersecurity', 'security', 'networking', 'blockchain', 'crypto', 'api',
    'frontend', 'backend', 'fullstack', 'algorithm', 'data structure', 'sql',
    'nosql', 'mongodb', 'postgresql', 'docker', 'kubernetes', 'microservices',
    'llm', 'nlp', 'deep learning', 'neural network', 'tensorflow', 'pytorch',
    'java', 'c++', 'rust', 'go', 'typescript', 'html', 'css', 'linux', 'git',
    'agile', 'scrum', 'ci/cd', 'automation', 'testing', 'qa', 'code', 'computer'
];

// 2023-2025 Trending IT Skills
const TRENDING_IT_SKILLS = [
    { name: 'AI & LLM Engineering', category: 'AI/ML', growth: '+340%' },
    { name: 'Prompt Engineering', category: 'AI/ML', growth: '+280%' },
    { name: 'RAG (Retrieval-Augmented Generation)', category: 'AI/ML', growth: '+250%' },
    { name: 'Cloud Architecture (AWS/GCP/Azure)', category: 'Cloud', growth: '+45%' },
    { name: 'Kubernetes & Container Orchestration', category: 'DevOps', growth: '+35%' },
    { name: 'Cybersecurity & Zero Trust', category: 'Security', growth: '+40%' },
    { name: 'Data Engineering (dbt, Spark)', category: 'Data', growth: '+55%' },
    { name: 'Edge Computing & IoT', category: 'Infrastructure', growth: '+30%' },
    { name: 'Rust Programming', category: 'Programming', growth: '+85%' },
    { name: 'Web3 & Smart Contracts', category: 'Blockchain', growth: '+25%' }
];

// 2023-2025 Trending Non-IT Skills
const TRENDING_NON_IT_SKILLS = [
    { name: 'Business Analytics & BI', category: 'Business', growth: '+60%' },
    { name: 'Financial Modeling', category: 'Finance', growth: '+35%' },
    { name: 'Public Speaking & Leadership', category: 'Soft Skills', growth: '+25%' },
    { name: 'UI/UX Design', category: 'Design', growth: '+40%' },
    { name: 'Digital Marketing', category: 'Marketing', growth: '+30%' },
    { name: 'Product Management', category: 'Business', growth: '+45%' },
    { name: 'Project Management (PMP, Agile)', category: 'Management', growth: '+20%' },
    { name: 'Content Strategy', category: 'Marketing', growth: '+35%' },
    { name: 'Negotiation & Sales', category: 'Business', growth: '+28%' },
    { name: 'Personal Branding', category: 'Personal Dev', growth: '+50%' }
];

/**
 * Classify user as IT or Non-IT based on their course categories and topics
 */
export function classifyUserDomain(courses) {
    if (!courses || courses.length === 0) return { domain: 'unknown', confidence: 0 };

    let itScore = 0;
    let nonItScore = 0;

    courses.forEach(course => {
        const searchText = `${course.title || ''} ${course.topic || ''} ${course.category || ''} ${course.description || ''}`.toLowerCase();

        IT_KEYWORDS.forEach(keyword => {
            if (searchText.includes(keyword.toLowerCase())) {
                itScore += 1;
            }
        });

        // Non-IT categories
        const nonItCategories = ['finance', 'marketing', 'design', 'business', 'personal development', 'health', 'arts', 'music', 'cooking', 'photography'];
        nonItCategories.forEach(cat => {
            if (searchText.includes(cat)) {
                nonItScore += 1;
            }
        });
    });

    const total = itScore + nonItScore;
    const confidence = total > 0 ? Math.min(Math.round((Math.max(itScore, nonItScore) / total) * 100), 95) : 0;

    return {
        domain: itScore >= nonItScore ? 'IT' : 'Non-IT',
        confidence,
        itScore,
        nonItScore
    };
}

/**
 * Calculate total words generated across all courses
 */
export function calculateTotalWords(courses) {
    let totalWords = 0;

    courses.forEach(course => {
        // Count words in description
        if (course.description) {
            totalWords += course.description.split(/\s+/).filter(w => w.length > 0).length;
        }

        // Count words in modules
        if (course.modules && Array.isArray(course.modules)) {
            course.modules.forEach(mod => {
                if (mod.content) {
                    totalWords += mod.content.split(/\s+/).filter(w => w.length > 0).length;
                }
                if (mod.description) {
                    totalWords += mod.description.split(/\s+/).filter(w => w.length > 0).length;
                }
                if (mod.objectives && Array.isArray(mod.objectives)) {
                    mod.objectives.forEach(obj => {
                        totalWords += obj.split(/\s+/).filter(w => w.length > 0).length;
                    });
                }
            });
        }
    });

    return totalWords;
}

/**
 * Calculate category breakdown for pie chart
 */
export function calculateCategoryBreakdown(courses) {
    const categoryStats = {};

    courses.forEach(course => {
        const cat = course.category || 'General';
        categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    const total = courses.length || 1;
    const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16'];

    return Object.entries(categoryStats)
        .map(([name, count], i) => ({
            name,
            count,
            percentage: Math.round((count / total) * 100),
            color: colors[i % colors.length]
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Analyze quiz performance patterns
 */
export function analyzeQuizPerformance(quizAttempts) {
    if (!quizAttempts || quizAttempts.length === 0) {
        return {
            averageScore: 0,
            totalAttempts: 0,
            passRate: 0,
            skippedCount: 0,
            improvementTrend: 'neutral'
        };
    }

    const totalAttempts = quizAttempts.length;
    const averageScore = Math.round(
        quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts
    );
    const passedAttempts = quizAttempts.filter(a => a.isPassed || a.score >= 70).length;
    const passRate = Math.round((passedAttempts / totalAttempts) * 100);
    const skippedCount = quizAttempts.filter(a => a.skippedAnswers > 0).length;

    // Calculate improvement trend (compare first half vs second half)
    let improvementTrend = 'neutral';
    if (quizAttempts.length >= 4) {
        const sortedByDate = [...quizAttempts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const midpoint = Math.floor(sortedByDate.length / 2);
        const firstHalfAvg = sortedByDate.slice(0, midpoint).reduce((sum, a) => sum + a.score, 0) / midpoint;
        const secondHalfAvg = sortedByDate.slice(midpoint).reduce((sum, a) => sum + a.score, 0) / (sortedByDate.length - midpoint);

        if (secondHalfAvg > firstHalfAvg + 5) improvementTrend = 'improving';
        else if (secondHalfAvg < firstHalfAvg - 5) improvementTrend = 'declining';
    }

    return {
        averageScore,
        totalAttempts,
        passRate,
        skippedCount,
        improvementTrend
    };
}

/**
 * Analyze activity patterns (peak hours, frequency)
 */
export function analyzeActivityPatterns(activityLog, moduleProgress) {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);

    // Combine activity logs and module progress timestamps
    const allTimestamps = [];

    if (activityLog && Array.isArray(activityLog)) {
        activityLog.forEach(log => {
            if (log.createdAt) allTimestamps.push(new Date(log.createdAt));
        });
    }

    if (moduleProgress && Array.isArray(moduleProgress)) {
        moduleProgress.forEach(prog => {
            if (prog.lastAccessedAt) allTimestamps.push(new Date(prog.lastAccessedAt));
            if (prog.completedAt) allTimestamps.push(new Date(prog.completedAt));
        });
    }

    allTimestamps.forEach(timestamp => {
        hourCounts[timestamp.getHours()]++;
        dayCounts[timestamp.getDay()]++;
    });

    // Find peak hour
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Determine time preference
    let timePreference = 'varied';
    const morningActivity = hourCounts.slice(6, 12).reduce((a, b) => a + b, 0);
    const afternoonActivity = hourCounts.slice(12, 18).reduce((a, b) => a + b, 0);
    const eveningActivity = hourCounts.slice(18, 24).reduce((a, b) => a + b, 0);
    const nightActivity = hourCounts.slice(0, 6).reduce((a, b) => a + b, 0);

    const maxActivity = Math.max(morningActivity, afternoonActivity, eveningActivity, nightActivity);
    if (maxActivity === morningActivity) timePreference = 'morning learner (6AM-12PM)';
    else if (maxActivity === afternoonActivity) timePreference = 'afternoon learner (12PM-6PM)';
    else if (maxActivity === eveningActivity) timePreference = 'evening learner (6PM-12AM)';
    else if (maxActivity === nightActivity) timePreference = 'night owl (12AM-6AM)';

    return {
        peakHour: `${peakHour}:00`,
        peakDay: dayNames[peakDay],
        timePreference,
        totalActivities: allTimestamps.length,
        hourlyDistribution: hourCounts
    };
}

/**
 * Calculate engagement score (0-100)
 */
export function calculateEngagementScore(courses, moduleProgress, quizAttempts, courseAnalytics) {
    if (!courses || courses.length === 0) return 0;

    let score = 0;

    // Course creation frequency (0-25 points)
    const coursesPerMonth = courses.length; // Simplified
    score += Math.min(coursesPerMonth * 5, 25);

    // Module completion rate (0-30 points)
    if (courseAnalytics && courseAnalytics.length > 0) {
        const avgCompletionRate = courseAnalytics.reduce((sum, a) => sum + (a.progressPercentage || 0), 0) / courseAnalytics.length;
        score += Math.round(avgCompletionRate * 0.3);
    }

    // Quiz participation (0-25 points)
    if (quizAttempts && quizAttempts.length > 0) {
        const quizPoints = Math.min(quizAttempts.length * 3, 25);
        score += quizPoints;
    }

    // Recent activity bonus (0-20 points)
    if (moduleProgress && moduleProgress.length > 0) {
        const recentProgress = moduleProgress.filter(p => {
            const lastAccess = new Date(p.lastAccessedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return lastAccess >= weekAgo;
        });
        score += Math.min(recentProgress.length * 5, 20);
    }

    return Math.min(score, 100);
}

/**
 * Generate technology recommendations based on user's interests
 */
export function generateTechRecommendations(courses, domainClassification) {
    const userCategories = calculateCategoryBreakdown(courses);
    const isIT = domainClassification.domain === 'IT';

    const baseTrends = isIT ? TRENDING_IT_SKILLS : TRENDING_NON_IT_SKILLS;

    // Find skill gaps - areas user hasn't explored
    const exploredCategories = userCategories.map(c => c.name.toLowerCase());
    const skillGaps = baseTrends.filter(skill =>
        !exploredCategories.some(cat => skill.category.toLowerCase().includes(cat) || cat.includes(skill.category.toLowerCase()))
    ).slice(0, 4);

    // Recommendations based on current interests
    const basedOnInterest = [];
    if (isIT) {
        if (exploredCategories.some(c => c.includes('ai') || c.includes('machine learning') || c.includes('data'))) {
            basedOnInterest.push('LLM Fine-tuning & RLHF', 'MLOps & Model Deployment', 'Vector Databases (Pinecone, Weaviate)');
        }
        if (exploredCategories.some(c => c.includes('web') || c.includes('front') || c.includes('react'))) {
            basedOnInterest.push('Next.js 14 App Router', 'React Server Components', 'Edge Computing with Vercel');
        }
        if (exploredCategories.some(c => c.includes('cloud') || c.includes('devops'))) {
            basedOnInterest.push('Terraform & Infrastructure as Code', 'Serverless Architecture', 'GitOps with ArgoCD');
        }
    } else {
        if (exploredCategories.some(c => c.includes('business') || c.includes('finance'))) {
            basedOnInterest.push('Advanced Excel & Power BI', 'Financial Analysis with Python', 'Business Intelligence Dashboards');
        }
        if (exploredCategories.some(c => c.includes('design') || c.includes('marketing'))) {
            basedOnInterest.push('Figma Advanced Prototyping', 'AI-Powered Design Tools', 'Growth Marketing Strategies');
        }
    }

    // Next skill paths
    const nextSkillPaths = isIT ? [
        { path: 'AI/ML Engineer', skills: ['Python', 'TensorFlow/PyTorch', 'MLOps', 'Cloud Deployment'] },
        { path: 'Full-Stack Developer', skills: ['React/Next.js', 'Node.js', 'PostgreSQL', 'Docker'] },
        { path: 'DevOps Engineer', skills: ['Kubernetes', 'Terraform', 'CI/CD', 'Cloud Platforms'] }
    ] : [
        { path: 'Business Analyst', skills: ['Excel', 'SQL', 'Power BI', 'Data Storytelling'] },
        { path: 'Product Manager', skills: ['Roadmapping', 'User Research', 'Agile', 'Analytics'] },
        { path: 'Digital Marketer', skills: ['SEO', 'Content Strategy', 'Analytics', 'Automation'] }
    ];

    return {
        basedOnInterest: basedOnInterest.slice(0, 5),
        latestTrends: baseTrends.slice(0, 5).map(s => `${s.name} (${s.growth})`),
        skillGapsDetected: skillGaps.map(s => s.name),
        nextSkillPaths
    };
}

/**
 * Extract searchable keywords from courses
 */
export function extractSearchableKeywords(courses) {
    const keywords = new Set();

    courses.forEach(course => {
        // Add category
        if (course.category) keywords.add(course.category);

        // Extract from title
        if (course.title) {
            course.title.split(/\s+/).forEach(word => {
                if (word.length > 3) keywords.add(word.toLowerCase());
            });
        }

        // Extract from topic
        if (course.topic) {
            course.topic.split(/\s+/).forEach(word => {
                if (word.length > 3) keywords.add(word.toLowerCase());
            });
        }

        // Module keywords
        if (course.modules && Array.isArray(course.modules)) {
            course.modules.forEach(mod => {
                if (mod.keywords && Array.isArray(mod.keywords)) {
                    mod.keywords.forEach(kw => keywords.add(kw.toLowerCase()));
                }
            });
        }
    });

    return Array.from(keywords).slice(0, 30);
}

/**
 * Generate progress line chart data
 */
export function generateProgressChartData(courseAnalytics, moduleProgress) {
    const last30Days = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Count completions on this date
        const completions = (moduleProgress || []).filter(p => {
            if (!p.completedAt) return false;
            return new Date(p.completedAt).toISOString().split('T')[0] === dateStr;
        }).length;

        last30Days.push({
            date: dateStr,
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            completions
        });
    }

    return last30Days;
}

/**
 * Generate module completion statistics
 */
export function generateModuleCompletionStats(courses, courseAnalytics) {
    return (courseAnalytics || []).map(analytics => {
        const course = (courses || []).find(c => c.id === analytics.courseId);
        return {
            courseId: analytics.courseId,
            courseTitle: course?.title || 'Unknown Course',
            totalModules: analytics.totalModules || 0,
            completedModules: analytics.modulesCompleted || 0,
            progressPercentage: analytics.progressPercentage || 0,
            lastAccessed: analytics.lastAccessedAt
        };
    }).slice(0, 10);
}

/**
 * Generate activity timeline
 */
export function generateActivityTimeline(activityLog, courses, quizAttempts) {
    const timeline = [];

    // Add course creations
    (courses || []).forEach(course => {
        timeline.push({
            type: 'course_created',
            title: `Created course: ${course.title}`,
            timestamp: course.createdAt,
            icon: '📚'
        });
    });

    // Add quiz attempts
    (quizAttempts || []).slice(0, 20).forEach(attempt => {
        timeline.push({
            type: 'quiz_completed',
            title: `Quiz completed with ${attempt.score}% score`,
            timestamp: attempt.createdAt,
            icon: '✅'
        });
    });

    // Add activity logs
    (activityLog || []).slice(0, 20).forEach(log => {
        timeline.push({
            type: log.type || 'activity',
            title: log.type?.replace(/_/g, ' ') || 'Activity',
            timestamp: log.createdAt,
            icon: '🔹',
            meta: log.meta
        });
    });

    // Sort by timestamp descending and limit
    return timeline
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 15);
}
