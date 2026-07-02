'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Link2, Upload, Loader2, X, FileText, CheckCircle, AlertCircle, BookOpen, ChevronRight } from 'lucide-react';

export default function CreateFilePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('file');
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [extractionStatus, setExtractionStatus] = useState('');
    const [generatedCourse, setGeneratedCourse] = useState(null);
    const [includeQuiz, setIncludeQuiz] = useState(true);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file size (10MB max)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File too large. Maximum size is 10MB.');
                return;
            }
            setFile(selectedFile);
            setError('');
            setGeneratedCourse(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            if (droppedFile.size > 10 * 1024 * 1024) {
                setError('File too large. Maximum size is 10MB.');
                return;
            }
            setFile(droppedFile);
            setError('');
            setGeneratedCourse(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleSubmit = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setIsLoading(true);
        setError('');
        setExtractionStatus('Uploading file...');
        setGeneratedCourse(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('includeQuiz', includeQuiz.toString());

            setExtractionStatus('Extracting text from file...');

            const response = await fetch('/api/file-to-course', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process file');
            }

            setExtractionStatus('Course generated successfully!');
            setGeneratedCourse(data.course);

        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'An error occurred while processing the file');
            setExtractionStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlSubmit = async () => {
        if (!url) {
            setError('Please enter a URL');
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            setError('Please enter a valid URL');
            return;
        }

        setIsLoading(true);
        setError('');
        setExtractionStatus('Fetching webpage content...');
        setGeneratedCourse(null);

        try {
            setExtractionStatus('Extracting text from webpage...');

            const response = await fetch('/api/url-to-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    difficulty: 'intermediate',
                    includeQuiz,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to extract content from URL');
            }

            if (data.cached) {
                setExtractionStatus('Course loaded from cache!');
            } else {
                setExtractionStatus(`Course generated from ${data.extracted?.wordCount || 0} words!`);
            }

            setGeneratedCourse(data.course);

        } catch (err) {
            console.error('URL extraction error:', err);
            setError(err.message || 'An error occurred while extracting content');
            setExtractionStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCourse = async () => {
        if (!generatedCourse) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: generatedCourse.title,
                    description: generatedCourse.description,
                    modules: generatedCourse.modules?.map((mod, idx) => ({
                        title: mod.title,
                        description: mod.description || mod.chapters?.map(c => c.content).join('\n\n') || '',
                        orderIndex: idx,
                        quiz: [],
                    })),
                    difficulty: 'intermediate',
                    category: 'General',
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save course');

            router.push(`/course/${data.course.id}`);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext)) return '📄';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return '🖼️';
        if (['docx', 'doc'].includes(ext)) return '📝';
        if (['txt', 'md'].includes(ext)) return '📋';
        return '📁';
    };

    return (
        <div className="min-h-screen bg-[#0f0f17]">
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-xl bg-[#1c1c29] border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)]">
                        <FileUp className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Import Content</h1>
                        <p className="text-gray-400">Create a course from a file using AI</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <span className="text-red-400">{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <div className="bg-[#1c1c29] rounded-xl border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)] overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-white/5">
                            <button
                                onClick={() => setActiveTab('file')}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'file'
                                    ? 'text-white bg-[#272732]'
                                    : 'text-gray-400 hover:text-white hover:bg-[#272732]/50'
                                    }`}
                            >
                                <Upload className="w-5 h-5" />
                                Upload File
                            </button>
                            <button
                                onClick={() => setActiveTab('url')}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'url'
                                    ? 'text-white bg-[#272732]'
                                    : 'text-gray-400 hover:text-white hover:bg-[#272732]/50'
                                    }`}
                            >
                                <Link2 className="w-5 h-5" />
                                From URL
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {activeTab === 'file' ? (
                                <div className="space-y-6">
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${file ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 hover:border-white/20'
                                            }`}
                                        onClick={() => document.getElementById('file-input')?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        <input
                                            id="file-input"
                                            type="file"
                                            onChange={handleFileChange}
                                            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.docx,.txt,.md"
                                            className="hidden"
                                        />
                                        {file ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-3xl">{getFileIcon(file.name)}</span>
                                                <div className="text-left">
                                                    <p className="text-white font-medium">{file.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFile(null);
                                                        setGeneratedCourse(null);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-white/5"
                                                >
                                                    <X className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                                <p className="text-white font-medium mb-1">
                                                    Drop your file here or click to browse
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Supports PDF, Images, DOCX, TXT (max 10MB)
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Extraction Status */}
                                    {extractionStatus && (
                                        <div className="flex items-center gap-3 p-4 rounded-lg bg-[#0f0f17] border border-white/5">
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            )}
                                            <span className="text-gray-300">{extractionStatus}</span>
                                        </div>
                                    )}

                                    {/* Supported formats */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f17] border border-white/5">
                                            <span>📄</span>
                                            <span className="text-gray-400">PDF Documents</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f17] border border-white/5">
                                            <span>🖼️</span>
                                            <span className="text-gray-400">Images (OCR)</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f17] border border-white/5">
                                            <span>📝</span>
                                            <span className="text-gray-400">Word Documents</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0f0f17] border border-white/5">
                                            <span>📋</span>
                                            <span className="text-gray-400">Text Files</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Website URL
                                        </label>
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => {
                                                setUrl(e.target.value);
                                                setError('');
                                                setGeneratedCourse(null);
                                            }}
                                            placeholder="https://example.com/article"
                                            className="w-full px-4 py-3 rounded-xl bg-[#0f0f17] border border-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-white/10"
                                        />
                                    </div>

                                    {/* Extraction Status */}
                                    {extractionStatus && (
                                        <div className="flex items-center gap-3 p-4 rounded-lg bg-[#0f0f17] border border-white/5">
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            )}
                                            <span className="text-gray-300">{extractionStatus}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Include Quiz Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f0f17] border border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">📝</span>
                                    <div>
                                        <p className="text-white font-medium">Include Quiz</p>
                                        <p className="text-xs text-gray-500">Generate quiz questions for each module</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIncludeQuiz(!includeQuiz)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${includeQuiz ? 'bg-purple-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${includeQuiz ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            <button
                                onClick={activeTab === 'file' ? handleSubmit : handleUrlSubmit}
                                disabled={isLoading || (activeTab === 'file' ? !file : !url)}
                                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#272732] hover:bg-[#32323f] disabled:opacity-50 text-white font-medium transition-colors border border-white/5"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {activeTab === 'url' ? 'Extracting...' : 'Processing...'}
                                    </>
                                ) : (
                                    <>
                                        {activeTab === 'url' ? <Link2 className="w-5 h-5" /> : <FileUp className="w-5 h-5" />}
                                        Extract & Generate Course
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="bg-[#1c1c29] rounded-xl border border-white/5 shadow-[0_6px_30px_rgba(0,0,0,0.20)] p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Generated Course</h2>

                        {!generatedCourse ? (
                            <div className="text-center py-12">
                                <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    Upload a file to generate a course structure
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Course Title */}
                                <div className="p-4 rounded-xl bg-[#0f0f17] border border-white/5">
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {generatedCourse.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {generatedCourse.description}
                                    </p>
                                </div>

                                {/* Modules */}
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {generatedCourse.modules?.map((mod, i) => (
                                        <div
                                            key={i}
                                            className="p-3 rounded-lg bg-[#0f0f17] border border-white/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded bg-[#272732] text-xs flex items-center justify-center text-gray-400">
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="text-white text-sm font-medium">{mod.title}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {mod.chapters?.length || 0} chapters
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Quiz Info */}
                                {generatedCourse.quiz?.length > 0 && (
                                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                        <p className="text-purple-400 text-sm">
                                            📝 Includes {generatedCourse.quiz.length} quiz questions
                                        </p>
                                    </div>
                                )}

                                {/* Save Button */}
                                <button
                                    onClick={handleSaveCourse}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#272732] hover:bg-[#32323f] disabled:opacity-50 text-white font-medium transition-colors border border-white/5"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5" />
                                    )}
                                    Save & Start Learning
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
