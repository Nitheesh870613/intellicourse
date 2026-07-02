'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CourseProgressCard({ course, activeChapter, progress }) {
  const router = useRouter();
  
  if (!course) return null;

  const currentChapterIndex = course.chapters?.findIndex(ch => ch.id === activeChapter?.id) ?? 0;
  const currentChapterNumber = currentChapterIndex >= 0 ? currentChapterIndex + 1 : 1;
  const totalChapters = course.chapters?.length || 0;
  const completedModules = progress?.completedModules || 0;
  const totalModules = progress?.totalModules || activeChapter?.modules?.length || course?.modules?.length || 0;
  const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const handleContinue = () => {
    if (activeChapter) {
      const nextModuleIndex = progress?.nextModuleIndex || 0;
      // Scroll to the active module or chapter content
      const element = document.getElementById(`module-${nextModuleIndex}`) || document.getElementById(`chapter-${activeChapter.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleViewChapters = () => {
    // Scroll to chapters list
    const element = document.getElementById('chapters-list');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="bg-gradient-to-b from-[#3d4465] to-[#2a2d47] text-white p-8 md:p-10 w-full md:w-[280px] flex flex-col">
            <div className="text-[11px] font-semibold tracking-[1.5px] uppercase opacity-60 mb-3">
              COURSE
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold leading-tight mb-auto">
              {course.title || 'Course Title'}
            </h1>
            <button
              onClick={handleViewChapters}
              className="inline-flex items-center text-white text-sm font-medium opacity-80 hover:opacity-100 transition-opacity mt-8 group"
            >
              View all chapters
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 md:p-10 flex flex-col">
            <div className="mb-auto">
              <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-gray-500 dark:text-gray-400 mb-2">
                {activeChapter && currentChapterNumber > 0 ? `CHAPTER ${currentChapterNumber}` : course.chapters?.length > 0 ? 'CHAPTER 1' : 'COURSE'}
              </div>
              <h2 className="text-3xl md:text-[32px] font-semibold text-gray-900 dark:text-white">
                {activeChapter?.title || course.chapters?.[0]?.title || course?.modules?.[0]?.title || 'Getting Started'}
              </h2>
            </div>

            {/* Progress Section */}
            <div className="flex flex-col items-end md:items-end gap-6 mt-8">
              <div className="flex flex-col items-end">
                <div className="w-full md:w-[200px] h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full"
                  />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {completedModules}/{totalModules} {totalModules === 1 ? 'Challenge' : 'Challenges'}
                </div>
              </div>
              <button
                onClick={handleContinue}
                className="bg-gradient-to-br from-[#3d4465] to-[#2a2d47] text-white border-none px-10 py-3.5 rounded-full text-[15px] font-semibold cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

