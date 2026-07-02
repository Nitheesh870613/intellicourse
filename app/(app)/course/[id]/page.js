'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ModuleQuiz from '@/components/ModuleQuiz';
import ChatTutor from '@/components/chat/ChatTutor';
import VideoSection from '@/components/VideoSection';
import CourseHeader from './components/CourseHeader';

export default function CourseDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState(new Set());
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  useEffect(() => {
    fetchCourse();
    fetchProgress();
  }, [id]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress/get?courseId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setCompletedModules(new Set(data.completedModules || []));
        setCompletionPercentage(data.completionPercentage || 0);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else {
        setCourse(null);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setCourse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModuleComplete = async (moduleIndex) => {
    const moduleId = String(moduleIndex);
    setCompletedModules((prev) => new Set([...prev, moduleId]));

    try {
      await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: id,
          moduleId: moduleId,
          moduleIndex: moduleIndex,
        }),
      });
      // Refresh progress to update percentage
      fetchProgress();
    } catch (error) {
      console.error('Error saving progress:', error);
    }

    // Move to next module if not the last one
    if (course?.modules && moduleIndex < course.modules.length - 1) {
      setActiveModuleIndex(moduleIndex + 1);
      // Scroll to top of content area for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0f0f17] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-white text-xl mb-4">Course not found</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-3 rounded-xl bg-[#272732] hover:bg-[#32323f] text-white font-medium border border-white/5"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const activeModule = course?.modules?.[activeModuleIndex];
  const hasModules = course?.modules && course.modules.length > 0;

  return (
    <div className="min-h-screen bg-[#0f0f17]">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Course Header */}
        <CourseHeader
          course={course}
          completionPercentage={completionPercentage}
          activeModule={activeModule}
          totalModules={course?.modules?.length || 0}
          completedCount={completedModules.size}
          onContinue={() => {
            const contentArea = document.getElementById('module-content');
            if (contentArea) contentArea.scrollIntoView({ behavior: 'smooth' });
          }}
        />


        {hasModules ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Module List - Sidebar */}
            <div id="modules-sidebar" className="bg-[#1C1E27] rounded-2xl border border-white/[0.07] shadow-[0_4px_40px_rgba(0,0,0,0.4)] p-6 h-fit lg:sticky lg:top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Modules</h2>
                <span className="text-sm text-gray-500">
                  {completedModules.size}/{course.modules.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {course.modules.map((module, idx) => {
                  const isActive = idx === activeModuleIndex;
                  const isCompleted = completedModules.has(String(idx));

                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveModuleIndex(idx)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${isActive
                        ? 'bg-[#272732] border border-white/10'
                        : 'bg-[#0f0f17] border border-white/5 hover:border-white/10'
                        }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0 ${isActive
                          ? 'bg-[#836FFF] text-white'
                          : 'bg-[#272732] text-gray-400'
                          }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm text-white flex-1 line-clamp-1">
                        {module.title}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Module Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeModule && (
                <>
                  {/* Module Content Card */}
                  <div className="bg-[#1c1c29] rounded-xl border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)] p-6">
                    <h2 className="text-xl font-bold text-white mb-6">
                      {activeModule.title}
                    </h2>

                    {/* Markdown Content */}
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ node, ...props }) => (
                            <h1 className="text-2xl font-bold text-white mt-6 mb-4" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-xl font-semibold text-white mt-6 mb-3" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="text-gray-300 leading-relaxed mb-4" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-300" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-300" {...props} />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="text-gray-300" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="font-semibold text-white" {...props} />
                          ),
                          code: ({ node, inline, ...props }) =>
                            inline ? (
                              <code className="bg-[#272732] px-2 py-1 rounded text-sm text-gray-300" {...props} />
                            ) : (
                              <code className="block bg-[#0f0f17] p-4 rounded-lg text-sm text-gray-300 overflow-x-auto my-4 border border-white/5" {...props} />
                            ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-[#836FFF] pl-4 my-4 text-gray-400 italic" {...props} />
                          ),
                          hr: ({ node, ...props }) => (
                            <hr className="border-white/10 my-6" {...props} />
                          ),
                        }}
                      >
                        {activeModule.description}
                      </ReactMarkdown>
                    </div>

                    {/* Mark Complete Button */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                      {completedModules.has(String(activeModuleIndex)) ? (
                        <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">Module Completed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleModuleComplete(activeModuleIndex)}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#272732] hover:bg-[#32323f] text-white font-medium transition-colors border border-white/5"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Mark as Complete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Video Section */}
                  {activeModule?.videos && activeModule.videos.length > 0 && (
                    <VideoSection videos={activeModule.videos} />
                  )}

                  {/* Quiz Section */}
                  {activeModule?.quiz && activeModule.quiz.length > 0 && (
                    <ModuleQuiz
                      module={activeModule}
                      moduleIndex={activeModuleIndex}
                      onComplete={() => handleModuleComplete(activeModuleIndex)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#1c1c29] rounded-xl border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)] p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">This course has no modules yet.</p>
          </div>
        )}
      </div>

      {/* AI Chat Tutor */}
      {course && <ChatTutor courseId={id} courseTitle={course.title} />}
    </div>
  );
}