'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Loader2, WifiOff, BookOpen, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import { getOfflineCourses, removeFromOfflineLibrary } from '@/lib/offline/offlineLibrary';

export default function LibraryPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [offlineCourses, setOfflineCourses] = useState([]);

    useEffect(() => {
        loadOfflineCourses();
    }, []);

    const loadOfflineCourses = async () => {
        try {
            const courses = await getOfflineCourses();
            setOfflineCourses(courses);
        } catch (error) {
            console.error('Error loading offline courses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveOffline = async (courseId) => {
        await removeFromOfflineLibrary(courseId);
        setOfflineCourses(offlineCourses.filter(c => c.id !== courseId));
    };

    return (
        <div className="min-h-screen bg-[#0f0f17]">
            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#9B6BFF]/10 border border-[#9B6BFF]/20">
                            <WifiOff className="w-8 h-8 text-[#9B6BFF]" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-white">Offline Library</h1>
                            <p className="text-white/50 text-sm">Courses saved for offline access</p>
                        </div>
                    </div>
                    <Link
                        href="/courses"
                        className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white border border-white/10 rounded-lg text-sm transition-colors"
                    >
                        <FolderOpen className="w-4 h-4" />
                        All Courses
                    </Link>
                </div>

                {/* Offline Courses */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                    </div>
                ) : offlineCourses.length === 0 ? (
                    <div className="text-center py-20 bg-[#1c1c29] rounded-2xl border border-white/5">
                        <Download className="w-12 h-12 mx-auto mb-4 text-white/20" />
                        <h3 className="text-lg font-medium text-white mb-2">No offline courses</h3>
                        <p className="text-white/40 text-sm mb-6">
                            Export a course to save it for offline access.
                        </p>
                        <Link href="/courses" className="text-[#9B6BFF] hover:underline text-sm font-medium">
                            Browse Courses →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {offlineCourses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-[#1c1c29] border border-white/10 rounded-xl overflow-hidden hover:border-[#9B6BFF]/30 transition-colors"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-br from-[#252535] to-[#1c1c29] p-4 border-b border-white/5">
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-base font-medium text-white line-clamp-1 flex-1">
                                            {course.title?.replace(' - Complete Course', '')}
                                        </h3>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[#9B6BFF]/20 text-[#9B6BFF]">
                                            <WifiOff className="w-3 h-3" />
                                            Offline
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4">
                                    <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            {course.modules?.length || 0} Modules
                                        </span>
                                        <span>
                                            Saved {new Date(course.savedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/course/${course.id}`}
                                            className="flex-1 py-2 text-center text-sm font-medium bg-[#9B6BFF]/10 text-[#9B6BFF] rounded-lg hover:bg-[#9B6BFF]/20 transition-colors"
                                        >
                                            Open
                                        </Link>
                                        <button
                                            onClick={() => handleRemoveOffline(course.id)}
                                            className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
