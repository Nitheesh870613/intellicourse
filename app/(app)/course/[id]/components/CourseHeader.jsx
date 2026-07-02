'use client';

import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CourseHeader({
    course,
    completionPercentage,
    activeModule,
    totalModules,
    completedCount,
    onContinue
}) {
    return (
        <div className="mb-8">
            {/* Back to Dashboard - Pill Button */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white border border-white/20 rounded-full mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>

            {/* Main Header Container */}
            <div className="flex flex-col md:flex-row bg-[#0c1220] rounded-xl overflow-hidden">

                {/* Left Card - Course Title */}
                <div className="md:w-72 bg-[#1a2535] p-6 border-l-4 border-[#6366f1] flex flex-col justify-between">
                    <div>
                        <span className="text-xs text-[#6366f1] font-semibold uppercase tracking-wider">
                            COURSE
                        </span>
                        <h2 className="text-xl font-bold text-white mt-3 leading-snug">
                            {course.title?.replace(' - Complete Course', '')}
                        </h2>
                    </div>
                    <Link
                        href="#modules-sidebar"
                        className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 mt-8 transition-colors"
                    >
                        View all chapters
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Right Section - Current Module & Progress */}
                <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0c1220]">
                    <div>
                        <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">
                            COURSE
                        </span>
                        <h3 className="text-xl font-semibold text-white mt-2">
                            {activeModule?.title || 'Introduction'}
                        </h3>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        {/* Progress Bar & Count */}
                        <div className="flex items-center gap-4">
                            <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#6366f1] rounded-full transition-all duration-500"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                            <span className="text-sm text-white/50 whitespace-nowrap">
                                {completedCount || 0}/{totalModules || 5} Challenges
                            </span>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={onContinue}
                            className="px-8 py-2.5 bg-[#374151] hover:bg-[#4b5563] text-white text-sm font-medium rounded-full transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
