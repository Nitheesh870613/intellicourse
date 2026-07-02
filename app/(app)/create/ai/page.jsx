'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Video, HelpCircle, Zap, BookOpen } from 'lucide-react';

// Import custom components
import DifficultyButtons from './components/DifficultyButtons';
import ModuleCountInput from './components/ModuleCountInput';
import ToggleWithTooltip from './components/ToggleWithTooltip';
import PreviewCard from './components/PreviewCard';
import ProgressBar from './components/ProgressBar';

export default function CreateAIPage() {
    const router = useRouter();

    // Form state
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('intermediate');
    const [moduleCount, setModuleCount] = useState(3);
    const [includeVideos, setIncludeVideos] = useState(false);
    const [includeQuiz, setIncludeQuiz] = useState(true);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [generatedCourse, setGeneratedCourse] = useState(null);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setIsGenerating(true);
        setError('');
        setProgress(8);
        setGeneratedCourse(null);

        try {
            // Progress heuristics for better UX
            const progressTimer1 = setTimeout(() => setProgress(20), 500);
            const progressTimer2 = setTimeout(() => setProgress(35), 1500);
            const progressTimer3 = setTimeout(() => setProgress(50), 3000);
            const progressTimer4 = setTimeout(() => setProgress(65), 5000);

            const response = await fetch('/api/generate/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    difficulty,
                    moduleCount,
                    includeVideos,
                    includeQuiz
                }),
            });

            // Clear timers
            clearTimeout(progressTimer1);
            clearTimeout(progressTimer2);
            clearTimeout(progressTimer3);
            clearTimeout(progressTimer4);

            setProgress(85);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate course');
            }

            setProgress(100);
            setGeneratedCourse(data.course);

        } catch (err) {
            setError(err.message);
            setProgress(0);
        } finally {
            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
            }, 600);
        }
    };

    const handleSaveCourse = async () => {
        if (!generatedCourse) return;

        setIsGenerating(true);
        setProgress(30);

        try {
            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...generatedCourse,
                    modules: generatedCourse.modules,
                    generatedChapters: generatedCourse.modules,
                }),
            });

            setProgress(80);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save course');
            }

            setProgress(100);
            router.push(`/course/${data.course.id}`);
        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
            setProgress(0);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f17]">
            {/* Floating Progress Bar */}
            <ProgressBar active={isGenerating} progress={progress} />

            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 sm:gap-4 mb-2"
                >
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#1C1C29] border border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.4)] flex-shrink-0">
                        <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#9B6BFF]" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">AI Course Generator</h1>
                        <p className="text-white/50 text-xs sm:text-sm mt-0.5 sm:mt-1">
                            Create a full structured course from any topic using AI
                        </p>
                    </div>
                </motion.div>

                {/* Error Banner */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3"
                    >
                        <span className="text-lg">⚠️</span>
                        {error}
                        <button
                            onClick={() => setError('')}
                            className="ml-auto text-red-400/60 hover:text-red-400"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}

                <div className="mt-6 sm:mt-8 grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {/* LEFT: Course Settings Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#1C1C29] border border-white/10 rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.4)] p-5 sm:p-6 lg:p-8"
                    >
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-6 sm:mb-8 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#9B6BFF]"></span>
                            Course Settings
                        </h2>

                        {/* Topic Input */}
                        <div className="mb-6 sm:mb-8">
                            <label className="text-white/70 text-xs sm:text-sm font-medium">Topic</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. Machine Learning, JavaScript"
                                disabled={isGenerating}
                                className="w-full mt-2.5 sm:mt-3 bg-[#14151C] border border-white/10 rounded-xl px-3.5 sm:px-4 py-3 sm:py-4 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:border-[#9B6BFF] transition-colors disabled:opacity-50"
                            />
                        </div>

                        {/* Difficulty Selection */}
                        <div className="mb-6 sm:mb-8">
                            <label className="text-white/70 text-xs sm:text-sm font-medium">Difficulty Level</label>
                            <div className="mt-2.5 sm:mt-3">
                                <DifficultyButtons
                                    value={difficulty}
                                    onChange={setDifficulty}
                                />
                            </div>
                        </div>

                        {/* Modules Slider */}
                        <div className="mb-6 sm:mb-8">
                            <label className="text-white/70 text-xs sm:text-sm font-medium">Number of Modules</label>
                            <ModuleCountInput
                                min={3}
                                max={7}
                                value={moduleCount}
                                onChange={setModuleCount}
                            />
                        </div>

                        {/* Toggles Section */}
                        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                            <p className="text-white/70 text-xs sm:text-sm font-medium">Additional Options</p>

                            <ToggleWithTooltip
                                label="Include YouTube Videos"
                                hint="Add curated video recommendations per module"
                                icon={<Video className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
                                checked={includeVideos}
                                onChange={setIncludeVideos}
                            />

                            <ToggleWithTooltip
                                label="Include Quizzes"
                                hint="Generate quiz questions for each module"
                                icon={<HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />}
                                checked={includeQuiz}
                                onChange={setIncludeQuiz}
                            />
                        </div>

                        {/* Generate Button */}
                        <motion.button
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic.trim()}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${isGenerating
                                ? 'bg-white/5 text-white/50 cursor-not-allowed'
                                : 'bg-[#9B6BFF] hover:bg-[#8A5AEE] text-white shadow-lg shadow-[#9B6BFF]/20'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating Course...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Generate Course
                                </>
                            )}
                        </motion.button>
                    </motion.div>

                    {/* RIGHT: Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#14151C] border border-white/10 rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.4)] p-5 sm:p-6 lg:p-8"
                    >
                        <h2 className="text-lg sm:text-xl font-semibold text-white mb-5 sm:mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#57D1FF]"></span>
                            Course Preview
                        </h2>

                        <PreviewCard
                            course={generatedCourse}
                            loading={isGenerating}
                            includeQuiz={includeQuiz}
                        />

                        {/* Save Button */}
                        {generatedCourse && !isGenerating && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleSaveCourse}
                                className="w-full mt-6 py-4 rounded-xl bg-[#1C1C29] hover:bg-[#272732] border border-white/10 hover:border-[#9B6BFF]/50 text-white font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <BookOpen className="w-5 h-5" />
                                Save & Start Learning
                            </motion.button>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
