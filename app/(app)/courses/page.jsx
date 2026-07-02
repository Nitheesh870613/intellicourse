'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, Loader2, Search, MoreVertical, Download, Trash2, X, Youtube, GraduationCap, WifiOff, Check } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { saveToOfflineLibrary } from '@/lib/offline/offlineLibrary';

// Course Menu Component
function CourseMenu({ course, onExport, onDelete }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative z-20">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-xl overflow-hidden bg-[#1c1c29] border border-white/10 z-30">
                    <button
                        onClick={() => { onExport(); setIsOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => { onDelete(); setIsOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await fetch('/api/courses');
            const data = await response.json();
            const coursesArray = data?.courses || data?.data || (Array.isArray(data) ? data : []);
            setCourses(coursesArray);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const [exportSuccess, setExportSuccess] = useState(null);

    const handleExportCourse = async (courseId, courseTitle) => {
        try {
            const response = await fetch(`/api/courses/${courseId}`);
            if (!response.ok) throw new Error('Failed to export');
            const data = await response.json();

            // Save to offline library (IndexedDB)
            const courseData = {
                id: courseId,
                title: courseTitle,
                ...data.course,
                exportedAt: new Date().toISOString()
            };
            await saveToOfflineLibrary(courseData);

            // Also download as file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `course-${courseTitle.replace(/\s+/g, '-').toLowerCase()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success indicator
            setExportSuccess(courseId);
            setTimeout(() => setExportSuccess(null), 2000);
        } catch (error) {
            console.error('Error exporting course:', error);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');
            setCourses(courses.filter(c => c.id !== courseId));
            setDeleteModal(null);
        } catch (error) {
            console.error('Error deleting course:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0f0f17] px-6 py-10">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">
                            Your Courses
                        </h1>
                        <p className="text-sm text-white/50 mt-1">
                            All AI-generated and imported courses
                        </p>
                    </div>
                    <Link
                        href="/create/ai"
                        className="flex items-center gap-2 px-4 py-2 bg-[#9B6BFF] hover:bg-[#8A5CF5] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create New
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#1c1c29] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#9B6BFF]/50 transition-colors"
                    />
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="text-center py-20 bg-[#1c1c29] rounded-2xl border border-white/5">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-white/20" />
                        <h3 className="text-lg font-medium text-white mb-2">No courses found</h3>
                        <p className="text-white/40 text-sm mb-6">Create your first AI-powered course to get started.</p>
                        <Link href="/create/ai" className="text-[#9B6BFF] hover:text-[#8A5CF5] text-sm font-medium hover:underline">
                            Create Course →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => {
                            const totalModules = course.modules?.length || course.chapterCount || 0;
                            // Calculate completion from course progress data
                            const completedModules = course.completedModules || 0;
                            const completionPercent = totalModules > 0
                                ? Math.round((completedModules / totalModules) * 100)
                                : (course.progressPercentage || 0);

                            // Check for YouTube videos
                            const hasVideos = course.include_videos ||
                                (course.modules && course.modules.some(m => m.videos && m.videos.length > 0));

                            // Difficulty badge colors - light versions
                            const difficultyColors = {
                                'Beginner': 'bg-green-400/10 text-green-300 border-green-400/20',
                                'Intermediate': 'bg-white/10 text-white/70 border-white/20',
                                'Advanced': 'bg-red-400/10 text-red-300 border-red-400/20'
                            };
                            const difficulty = course.difficulty || 'Intermediate';

                            return (
                                <div
                                    key={course.id}
                                    className="bg-[#1c1c29] border border-white/10 rounded-2xl overflow-hidden transition hover:border-[#9B6BFF]/40 group relative"
                                >
                                    {/* Shaded Header Area */}
                                    <div className="bg-gradient-to-br from-[#252535] to-[#1c1c29] p-5 border-b border-white/5">
                                        <div className="flex items-start justify-between">
                                            <h3 className="text-lg font-semibold text-white line-clamp-2 pr-4 flex-1">
                                                {course.title?.replace(' - Complete Course', '')}
                                            </h3>
                                            <CourseMenu
                                                course={course}
                                                onExport={() => handleExportCourse(course.id, course.title)}
                                                onDelete={() => setDeleteModal(course)}
                                            />
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5">
                                        {/* Badges Row */}
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {/* Difficulty Badge */}
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${difficultyColors[difficulty]}`}>
                                                <GraduationCap className="w-3 h-3" />
                                                {difficulty}
                                            </span>

                                            {/* YouTube Icon */}
                                            {hasVideos && (
                                                <Youtube className="w-4 h-4 text-red-400" />
                                            )}

                                            {/* Modules Count */}
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-white/5 text-white/50 border border-white/10">
                                                <BookOpen className="w-3 h-3" />
                                                {totalModules} Modules
                                            </span>
                                        </div>

                                        {/* Completion Progress */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs text-white/40">Completion</span>
                                                <span className="text-sm font-medium text-white/60">
                                                    {completionPercent}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${completionPercent}%`,
                                                        backgroundColor: `rgba(${134 + (121 * (1 - completionPercent / 100))}, ${239 - (39 * (1 - completionPercent / 100))}, ${172 + (83 * (1 - completionPercent / 100))}, 0.4)`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Link
                                            href={`/course/${course.id}`}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#9B6BFF]/10 hover:bg-[#9B6BFF]/20 text-[#9B6BFF] text-sm font-medium rounded-xl transition-colors border border-[#9B6BFF]/20"
                                        >
                                            {completionPercent === 100 ? 'Review' : completionPercent > 0 ? 'Continue Learning' : 'Start Course'}
                                            <span>→</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="max-w-md w-full bg-[#1c1c29] border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Delete Course</h3>
                            <button onClick={() => setDeleteModal(null)} className="text-white/40 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-white/60 text-sm mb-6">
                            Are you sure you want to delete <strong className="text-white">{deleteModal.title}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white border border-white/10 hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteCourse(deleteModal.id)}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-sm font-medium transition-colors"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
