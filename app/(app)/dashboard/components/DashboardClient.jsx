'use client';

import { useState, useEffect } from 'react';
import { Search, X, TrendingUp, Target, Activity } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import ProgressBar from '@/components/ui/ProgressBar';
import DonutChart from '@/components/ui/DonutChart';
import { motion } from 'framer-motion';

export default function DashboardClient({ analytics, userFirstName }) {
    const [showBanner, setShowBanner] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Load banner state from localStorage
    useEffect(() => {
        const dismissed = localStorage.getItem('dashboard_banner_dismissed');
        if (dismissed === 'true') {
            setShowBanner(false);
        }
    }, []);

    const handleDismissBanner = () => {
        setShowBanner(false);
        localStorage.setItem('dashboard_banner_dismissed', 'true');
    };

    // Data from props (server fetched)
    const totalWords = analytics?.totalWordsGenerated || 0;
    const categoryDistribution = analytics?.categoryDistribution || [];
    const weeklyGrowth = analytics?.weeklyGrowth || 0;
    const overallCompletionRate = analytics?.overallCompletionRate || 0;

    // Helper functions
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num;
    };

    // Derived Data
    const donutData = {
        labels: categoryDistribution.length > 0 ? categoryDistribution.map(c => c.name) : ['No courses yet'],
        values: categoryDistribution.length > 0 ? categoryDistribution.map(c => c.count || c.percentage) : [1],
        colors: ['#FFA066', '#9B6BFF', '#FF6AC1', '#6F85FF', '#5CE7D6']
    };

    const rightCards = [
        {
            title: 'Most Active Category',
            subtitle: analytics?.mostActiveCategory?.name || 'No data yet',
            progress: analytics?.mostActiveCategory?.engagement || 0,
            color: '#FFA066',
            icon: Activity
        },
        {
            title: 'Completion Rate',
            subtitle: `${analytics?.completedModulesCount || 0} of ${analytics?.totalModulesCount || 0} modules`,
            progress: overallCompletionRate,
            color: '#9B6BFF',
            icon: Target
        },
        {
            title: 'Weekly Growth',
            subtitle: analytics?.trendingTopic?.name || 'No trend data',
            progress: Math.min(Math.abs(weeklyGrowth) * 10, 100),
            color: weeklyGrowth >= 0 ? '#5CE7D6' : '#FF6AC1',
            icon: TrendingUp
        },
    ];

    const stats = [
        {
            label: 'Total Courses',
            value: analytics?.totalCourses || 0,
            color: '#FFA066',
            growth: weeklyGrowth >= 0 ? `+${weeklyGrowth}` : `${weeklyGrowth}`
        },
        {
            label: 'Total Chapters',
            value: analytics?.totalChapters || 0,
            color: '#9B6BFF',
            growth: analytics?.totalModulesCount > 0 ? `+${analytics.totalModulesCount}` : '+0'
        },
        {
            label: 'Files Imported',
            value: analytics?.fileImportsCount || 0,
            color: '#FF6AC1',
            growth: '+0' // Placeholder logic
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="min-h-screen"
            style={{ background: 'var(--bg)' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Hello, {userFirstName}
                        </p>
                        <h1 className="text-xl sm:text-3xl font-bold text-white">Welcome to Your Dashboard</h1>
                    </div>
                    <div className="relative hidden sm:block">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2.5 pr-10 rounded-xl text-sm text-white placeholder:text-[rgba(255,255,255,0.4)] focus:outline-none w-56"
                            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

                    {/* Large Analytics Card */}
                    <div className="lg:col-span-8">
                        <Card>
                            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                                <div className="flex-1">
                                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Total Words Generated</p>
                                    <p className="text-2xl sm:text-4xl font-bold text-white mt-2 mb-6 sm:mb-8">
                                        {formatNumber(totalWords)}
                                    </p>

                                    <div className="space-y-4 sm:space-y-5">
                                        {categoryDistribution.length > 0 ? (
                                            categoryDistribution.slice(0, 3).map((cat, i) => {
                                                const colors = ['#FFA066', '#9B6BFF', '#FF6AC1'];
                                                return (
                                                    <div key={i} className="flex items-center gap-2 sm:gap-4">
                                                        <span className="text-xs sm:text-sm w-20 sm:w-28 truncate" style={{ color: 'var(--text-secondary)' }}>
                                                            {cat.name}
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-medium text-white w-8 sm:w-10">{cat.percentage}%</span>
                                                        <div className="flex-1">
                                                            <ProgressBar value={cat.percentage} color={colors[i % colors.length]} />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-6 sm:py-8">
                                                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    No courses yet. Create your first course to see category breakdown.
                                                </p>
                                                <Link href="/create/ai">
                                                    <button className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--accent-purple)' }}>
                                                        Create Course
                                                    </button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-center py-4 sm:py-0">
                                    {categoryDistribution.length > 0 ? (
                                        <>
                                            <div className="sm:hidden">
                                                <DonutChart data={donutData} size={140} />
                                            </div>
                                            <div className="hidden sm:block">
                                                <DonutChart data={donutData} size={180} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] rounded-full flex items-center justify-center" style={{ background: 'var(--card)', border: '2px dashed var(--border)' }}>
                                            <span className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>No data</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Side Cards */}
                    <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
                        {rightCards.map((card, i) => (
                            <Card key={i} className="p-3 sm:p-4">
                                <div className="flex items-start justify-between mb-2 sm:mb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white text-sm sm:text-base truncate">{card.title}</p>
                                        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{card.subtitle}</p>
                                    </div>
                                    <div
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2"
                                        style={{ background: `${card.color}15` }}
                                    >
                                        <card.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: card.color }} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-white mb-2 sm:mb-3">{card.progress}%</p>
                                <ProgressBar value={card.progress} color={card.color} />
                            </Card>
                        ))}
                    </div>

                    {/* Stats Cards */}
                    <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                        {stats.map((stat, i) => (
                            <Card key={i} className="p-4 sm:p-5">
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                                <div className="flex items-baseline gap-2 mt-1 mb-3 sm:mb-4">
                                    <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                                    <span className={`text-xs ${weeklyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stat.growth}
                                    </span>
                                </div>
                                <div className="h-10 sm:h-12 flex items-end gap-1">
                                    {[30, 40, 35, 45, 50, 55, 60].map((h, j) => (
                                        <div
                                            key={j}
                                            className="flex-1 rounded-t"
                                            style={{
                                                height: `${h + (stat.value > 0 ? 10 : 0)}%`,
                                                background: j === 6 ? stat.color : `${stat.color}40`
                                            }}
                                        />
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Announcement Banner */}
                    {showBanner && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-12"
                        >
                            <div
                                className="rounded-xl sm:rounded-2xl p-4 sm:p-6 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                style={{ background: 'var(--accent-purple)' }}
                            >
                                <button
                                    onClick={handleDismissBanner}
                                    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <p className="text-sm sm:text-base text-white font-medium max-w-lg pr-6">
                                    Create AI-powered courses in seconds! Transform your ideas into professional learning experiences.
                                </p>
                                <Link href="/create/ai" className="w-full sm:w-auto">
                                    <button
                                        className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-xl font-medium transition-colors text-sm sm:text-base"
                                        style={{ background: 'var(--card)', color: 'white' }}
                                    >
                                        Create Course
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>
        </motion.div>
    );
}
