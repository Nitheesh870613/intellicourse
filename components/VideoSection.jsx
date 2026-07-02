'use client';

import LazyYouTubeEmbed from './LazyYouTubeEmbed';
import { formatNumber } from '@/lib/utils/performance';

/**
 * VideoSection Component
 * 
 * Renders embedded YouTube videos for a course module.
 * Uses lazy loading for better performance.
 * Uses IntelliCourse design system - dark theme, purple accents, rounded-2xl.
 */

function getEmbedUrl(url) {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
}

export default function VideoSection({ videos }) {
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#9B6BFF]/20 flex items-center justify-center">
                    <svg
                        className="w-4 h-4 text-[#9B6BFF]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                </span>
                Recommended Videos
                <span className="text-sm text-white/40 font-normal ml-2">
                    ({videos.length} videos)
                </span>
            </h2>

            <div className="grid gap-5">
                {videos.map((video, index) => {
                    // Check if this is a fallback "No video" object
                    if (!video.url) {
                        return (
                            <div
                                key={index}
                                className="p-6 rounded-2xl bg-[#1c1c29]/50 border border-white/[0.07] text-center"
                            >
                                <p className="text-white/60 text-sm">
                                    No verified videos available for this module yet.
                                </p>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={index}
                            className="rounded-2xl bg-[#1c1c29] border border-white/[0.07] overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.4)]"
                        >
                            {/* Lazy-loaded YouTube Embed */}
                            <LazyYouTubeEmbed
                                url={video.embedUrl || video.url}
                                title={video.title || `Video ${index + 1}`}
                                className="aspect-video"
                            />

                            {/* Video Info */}
                            <div className="p-4 border-t border-white/[0.05]">
                                <h3 className="text-white font-medium text-sm line-clamp-2 mb-2">
                                    {video.title || 'Untitled Video'}
                                </h3>

                                <div className="flex items-center justify-between text-xs">
                                    {/* Channel */}
                                    {video.channelTitle && (
                                        <span className="text-white/40 truncate max-w-[150px]">
                                            {video.channelTitle}
                                        </span>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-white/40">
                                        {video.views > 0 && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                                </svg>
                                                {formatNumber(video.views)}
                                            </span>
                                        )}
                                        {video.likes > 0 && (
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                                                </svg>
                                                {formatNumber(video.likes)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
