
import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CourseHeader({ course, completionPercentage, onBack, onViewAll }) {
    return (
        <div className="bg-[#1c1c29] border border-white/10 rounded-2xl p-6 shadow-[0_4px_40px_rgba(0,0,0,0.4)] mb-8">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Courses
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-white mb-2">
                        {course.title}
                    </h1>
                    <p className="text-sm text-white/50 line-clamp-2 max-w-2xl">
                        {course.description}
                    </p>
                </div>

                <div className="min-w-[200px] text-right">
                    <span className="text-sm text-white/50 block mb-1">
                        Completion
                    </span>
                    <div className="text-3xl font-bold text-[#9B6BFF] mb-2">
                        {completionPercentage}%
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#9B6BFF] transition-all duration-500 ease-out"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
