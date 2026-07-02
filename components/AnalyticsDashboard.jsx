'use client';

import { useState, useEffect } from 'react';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/analytics/overview", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load analytics");
        }
        const data = await res.json();
        setAnalytics(data || null);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err.message || "Unable to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center px-4">
        <div className="bg-[#1c1c29] border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)] rounded-xl p-6 max-w-md w-full">
          <h1 className="text-base font-semibold text-white mb-2">Analytics unavailable</h1>
          <p className="text-sm text-gray-400">We couldn't load your analytics right now.</p>
          <p className="mt-2 text-xs text-gray-500 break-words">{error}</p>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview ?? analytics ?? {};

  const totalCourses =
    overview.totalCoursesCreated ??
    overview.totalCourses ??
    analytics?.totalCourses ??
    0;

  const totalModulesCompleted =
    overview.totalModulesCompleted ??
    overview.totalModules ??
    analytics?.totalModulesCompleted ??
    0;

  const completionRateRaw =
    overview.completionRate ??
    overview.averageCompletionRate ??
    analytics?.completionRate ??
    0;

  const completionRate =
    typeof completionRateRaw === "number"
      ? `${Math.round(completionRateRaw)}%`
      : completionRateRaw || "-";

  const lastActiveRaw =
    overview.lastActiveAt ||
    overview.lastAccessedAt ||
    analytics?.lastActiveAt ||
    analytics?.lastAccessedAt ||
    null;

  const lastActiveDate = lastActiveRaw
    ? new Date(lastActiveRaw).toLocaleDateString()
    : "-";

  const categoryBreakdown =
    analytics?.categoryDistribution || overview.categoryBreakdown || [];

  const learningPattern =
    analytics?.learningPattern ||
    overview.learningPattern ||
    overview.summary ||
    null;

  const recommendedTopics =
    analytics?.recommendedTopics ||
    overview.recommendedTopics ||
    analytics?.nextTopics ||
    overview.nextTopics ||
    [];

  return (
    <div className="min-h-screen bg-[#0f0f17]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Page Header */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Analytics Overview</h1>
          <p className="text-sm text-gray-400">
            A focused view of your IntelliCourse learning analytics.
          </p>
        </header>

        {/* Learning Overview */}
        <section>
          <div className="bg-[#1c1c29] border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)] rounded-xl p-6">
            <h2 className="text-sm font-medium text-white">Learning Overview</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <Row label="Total Courses Created" value={totalCourses} />
              <Row label="Total Modules Completed" value={totalModulesCompleted} />
              <Row label="Completion Rate" value={completionRate} />
              <Row label="Last Active Date" value={lastActiveDate} />
            </div>
          </div>
        </section>

        {/* Category Breakdown & Learning Pattern / Recommendations */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-[#1c1c29] border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)] rounded-xl p-6">
            <h2 className="text-sm font-medium text-white mb-3">Category Breakdown</h2>
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400">
                No category data available yet.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-gray-300">
                {categoryBreakdown.map((cat, index) => {
                  const name = cat.name || cat.category || `Category ${index + 1}`;
                  const courseCount =
                    cat.totalCourses ??
                    cat.courseCount ??
                    cat.count ??
                    null;

                  return (
                    <li
                      key={`${name}-${index}`}
                      className="flex items-center justify-between border-b border-white/5 last:border-b-0 pb-2 last:pb-0"
                    >
                      <span className="truncate mr-4">{name}</span>
                      <span className="text-gray-400 text-xs">
                        {courseCount != null ? `${courseCount} courses` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Learning Pattern & Recommended Topics */}
          <div className="space-y-6">
            <div className="bg-[#1c1c29] border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)] rounded-xl p-6">
              <h2 className="text-sm font-medium text-white mb-3">
                Your Learning Pattern
              </h2>
              {learningPattern ? (
                <p className="text-sm text-gray-300 leading-relaxed">
                  {learningPattern}
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  A short summary of your learning habits will appear here as
                  you continue using IntelliCourse.
                </p>
              )}
            </div>

            <div className="bg-[#1c1c29] border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)] rounded-xl p-6">
              <h2 className="text-sm font-medium text-white mb-3">
                Recommended Next Topics
              </h2>
              {recommendedTopics.length === 0 ? (
                <p className="text-sm text-gray-400">
                  As you create and complete more courses, IntelliCourse will
                  suggest focused topics for your next steps.
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-300">
                  {recommendedTopics.map((topic, index) => (
                    <li
                      key={`${topic}-${index}`}
                      className="border-b border-white/5 last:border-b-0 pb-2 last:pb-0"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-xs sm:text-sm">{label}</span>
      <span className="text-white text-sm font-medium ml-4 truncate">
        {value}
      </span>
    </div>
  );
}

