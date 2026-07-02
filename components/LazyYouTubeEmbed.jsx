'use client';

import { useState, useCallback } from 'react';
import { Play } from 'lucide-react';

/**
 * Lightweight YouTube Embed Component
 * 
 * Shows a thumbnail placeholder. Loads full iframe only on click.
 * This improves initial page load by 500ms+ per embed.
 */

/**
 * Get YouTube video ID from URL
 */
function getVideoId(url) {
    if (!url) return null;

    // Handle embed URLs
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];

    // Handle watch URLs
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return watchMatch[1];

    // Handle short URLs
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1];

    return null;
}

/**
 * Get thumbnail URL for a YouTube video
 */
function getThumbnailUrl(videoId, quality = 'hqdefault') {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export default function LazyYouTubeEmbed({
    url,
    title = 'Video',
    className = '',
}) {
    const [isLoaded, setIsLoaded] = useState(false);

    const videoId = getVideoId(url);

    const handleClick = useCallback(() => {
        setIsLoaded(true);
    }, []);

    if (!videoId) {
        return (
            <div className={`bg-[#1c1c29] rounded-2xl flex items-center justify-center text-white/40 ${className}`}>
                Invalid video URL
            </div>
        );
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    const thumbnailUrl = getThumbnailUrl(videoId);

    return (
        <div className={`relative overflow-hidden rounded-2xl bg-black ${className}`}>
            {isLoaded ? (
                // Full YouTube iframe (loaded on demand)
                <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={title}
                />
            ) : (
                // Lightweight thumbnail placeholder
                <button
                    onClick={handleClick}
                    className="absolute inset-0 w-full h-full group cursor-pointer"
                    aria-label={`Play ${title}`}
                >
                    {/* Thumbnail image */}
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-600 group-hover:bg-red-500 flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                            <Play className="w-7 h-7 text-white ml-1" fill="white" />
                        </div>
                    </div>

                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-sm font-medium line-clamp-2">{title}</p>
                    </div>
                </button>
            )}
        </div>
    );
}

/**
 * Multiple lazy videos in a grid
 */
export function LazyVideoGrid({ videos, className = '' }) {
    if (!videos || videos.length === 0) return null;

    return (
        <div className={`grid gap-4 ${className}`}>
            {videos.map((video, index) => (
                <LazyYouTubeEmbed
                    key={index}
                    url={video.url || video.embedUrl}
                    title={video.title}
                    className="aspect-video"
                />
            ))}
        </div>
    );
}
