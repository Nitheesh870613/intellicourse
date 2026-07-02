'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ArrowLeft, RefreshCw, Loader2, BookOpen, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import YouTubeVideo from '@/components/YouTubeVideo';

export default function CourseDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else {
        console.error('Failed to fetch course');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateCourse = async () => {
    if (!course?.topic) return;

    setIsRegenerating(true);
    try {
      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: course.topic }),
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else {
        console.error('Failed to regenerate course');
      }
    } catch (error) {
      console.error('Error regenerating course:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Course not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {course.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Created: {new Date(course.createdAt).toLocaleDateString()}</span>
                  {course.updatedAt !== course.createdAt && (
                    <span>Updated: {new Date(course.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={regenerateCourse}
                disabled={isRegenerating}
                className={cn(
                  "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2",
                  isRegenerating && "cursor-not-allowed"
                )}
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Regenerate AI Course</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Original Topic</h3>
              <p className="text-blue-700">{course.topic}</p>
            </div>
          </div>
        </div>

        {/* Course Videos */}
        {course?.includeVideos && course?.videoUrls && course.videoUrls.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center space-x-3 mb-6">
              <Video className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-semibold text-gray-900">Course Videos</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {course.videoUrls.map((url, index) => (
                <YouTubeVideo 
                  key={index}
                  url={url} 
                  title={`Course Video ${index + 1}`}
                  className="w-full"
                />
              ))}
            </div>
          </div>
        )}

        {/* Course Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Course Outline</h2>
          
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base">
              {course.outline}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
