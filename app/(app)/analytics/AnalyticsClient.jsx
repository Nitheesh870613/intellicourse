'use client';

import MetricCard from '@/components/analytics/MetricCard';
import CategoryRow from '@/components/analytics/CategoryRow';
import CategoryDonut from '@/components/analytics/CategoryDonut';
import ProgressLineChart from '@/components/analytics/ProgressLineChart';

export default function AnalyticsClient({ data }) {
    // Normalize analytics data safely
    const safeData = data ?? {};

    // Frozen Metrics - Hardcoded order 
    const metrics = [
        {
            label: "Total Courses",
            value: safeData.totalCourses ?? "—"
        },
        {
            label: "Modules Completed",
            value: safeData.completedModules ?? "—"
        },
        {
            label: "Completion Rate",
            value: (typeof safeData.completionRate === 'number')
                ? `${Math.round(safeData.completionRate)}%`
                : "—"
        },
        {
            label: "Last Active",
            value: safeData.lastActive
                ? new Date(safeData.lastActive).toLocaleDateString()
                : "—"
        },
    ];

    // Logic for categories (Donut Chart)
    // Ensure we sort by value for better visual
    const categories = (safeData.categoryDistribution || [])
        .sort((a, b) => b.value - a.value);

    // For Category Breakdown List, we need percentages
    const totalCategoryCount = categories.reduce((sum, c) => sum + (c.value || 0), 0);

    // Learning Progress Line Chart Data (Weekly)
    const lineChartData = safeData.weeklyProgress ?? [];

    // Insights & Recommendations
    const insights = Array.isArray(safeData.insights) ? safeData.insights : [];
    const recommendations = Array.isArray(safeData.recommendations) ? safeData.recommendations : [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {!data && (
                <div className="mb-4 rounded-xl border border-white/10 bg-[#141624] p-4 text-sm text-white/60">
                    Analytics will appear once you start completing courses.
                </div>
            )}

            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <div key={i} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                        <MetricCard label={m.label} value={m.value} />
                    </div>
                ))}
            </div>

            {/* VISUAL ANALYTICS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution Chart */}
                <div className="rounded-xl border border-white/10 p-6 bg-[#0f111a] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-white">Category Distribution</h3>
                        <div className="text-right">
                            <span className="text-lg font-bold text-white">{categories.reduce((sum, c) => sum + (c.value || 0), 0)}</span>
                            <span className="text-xs text-white/50 ml-2">Total Courses</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[260px]">
                        <CategoryDonut data={categories} />
                    </div>
                </div>

                {/* Learning Progress Line Chart */}
                <div className="rounded-xl border border-white/10 p-6 bg-[#0f111a] flex flex-col">
                    <h3 className="font-semibold text-white mb-6">Learning Progress (Last 6 Weeks)</h3>
                    <div className="flex-1 w-full min-h-[260px]">
                        <ProgressLineChart data={lineChartData} />
                    </div>
                </div>
            </div>

            {/* CATEGORY BREAKDOWN & INSIGHTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Detailed Category List (Span 2) */}
                <div className="lg:col-span-2 rounded-xl border border-white/10 p-6 space-y-4 bg-[#0f111a]">
                    <h3 className="font-semibold text-white">Category Breakdown</h3>
                    <div className="space-y-4 mt-2">
                        {categories.length > 0 ? (
                            categories.map((cat, i) => (
                                <CategoryRow
                                    key={i}
                                    name={cat.name}
                                    count={cat.value}
                                    total={totalCategoryCount}
                                    index={i}
                                />
                            ))
                        ) : (
                            <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-white/5 rounded-lg">
                                No categories found
                            </div>
                        )}
                    </div>
                </div>

                {/* Insights & Recommendations (Span 1) */}
                <div className="space-y-6">
                    {/* Learning Pattern Panel */}
                    <div className="rounded-xl border border-white/10 p-6 bg-[#0f111a]">
                        <h3 className="font-semibold mb-3 text-white">Learning Insights</h3>
                        {insights.length > 0 ? (
                            <div className="space-y-3">
                                {insights.map((insight, i) => (
                                    <p key={i} className="text-sm text-gray-400 leading-relaxed border-l-2 border-orange-500/50 pl-3">
                                        {insight}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Complete modules to unlock personalized insights about your learning habits.
                            </p>
                        )}
                    </div>

                    {/* Recommendations Panel */}
                    <div className="rounded-xl border border-white/10 p-6 bg-[#0f111a]">
                        <h3 className="font-semibold mb-3 text-white">Recommended Next Topics</h3>
                        <ul className="space-y-3">
                            {recommendations.map((topic, i) => (
                                <li key={i} className="flex items-center text-sm text-gray-400 group cursor-default">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 mr-3 group-hover:bg-green-500 transition-colors"></span>
                                    {topic}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
