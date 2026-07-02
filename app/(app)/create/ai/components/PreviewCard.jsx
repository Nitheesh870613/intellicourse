'use client';

import { motion } from 'framer-motion';
import { ChevronRight, BookOpen, Play, HelpCircle } from 'lucide-react';
import SkeletonPreview from './SkeletonPreview';

export default function PreviewCard({ course, loading, includeQuiz }) {
    if (loading) {
        return <SkeletonPreview />;
    }

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-2xl bg-[#1C1C29] border border-white/10 flex items-center justify-center mb-6"
                >
                    <BookOpen className="w-10 h-10 text-white/20" />
                </motion.div>
                <p className="text-white/40 text-sm mb-2">No course generated yet</p>
                <p className="text-white/20 text-xs max-w-xs">
                    Enter a topic and click "Generate Course" to create your AI-powered course
                </p>
            </div>
        );
    }

    const title = course.title || course.course_title;
    const description = course.description || course.overview;
    const modules = course.modules || [];
    const firstModule = modules[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Course Info Card */}
            <div className="p-5 rounded-xl bg-[#1C1C29] border border-white/10">
                <div className="text-[#9B6BFF] text-xs font-medium uppercase tracking-wider mb-2">
                    Generated Course
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50 line-clamp-2">{description}</p>

                <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 rounded-lg bg-[#9B6BFF]/20 text-[#9B6BFF] text-xs font-medium capitalize">
                        {course.difficulty || 'Intermediate'}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-[#57D1FF]/20 text-[#57D1FF] text-xs font-medium">
                        {modules.length} Modules
                    </span>
                    {includeQuiz && (
                        <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" /> Quizzes
                        </span>
                    )}
                </div>
            </div>

            {/* Module List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {modules.map((mod, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[#1C1C29] border border-white/5 hover:border-white/10 transition-colors group cursor-pointer"
                    >
                        <span className="w-8 h-8 rounded-lg bg-[#9B6BFF]/20 text-[#9B6BFF] text-sm font-semibold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{mod.title}</p>
                            {mod.quiz && mod.quiz.length > 0 && (
                                <p className="text-white/30 text-xs mt-0.5">
                                    {mod.quiz.length} quiz questions
                                </p>
                            )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
                    </motion.div>
                ))}
            </div>

            {/* First Module Preview */}
            {firstModule && firstModule.description && (
                <div className="p-4 rounded-xl bg-[#1C1C29] border border-white/5">
                    <div className="text-white/40 text-xs uppercase tracking-wider mb-2">
                        Module Preview
                    </div>
                    <p className="text-sm text-white/60 line-clamp-4">
                        {firstModule.description.substring(0, 300)}...
                    </p>
                </div>
            )}
        </motion.div>
    );
}
