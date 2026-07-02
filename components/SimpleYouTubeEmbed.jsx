'use client';

import { useState, useMemo } from 'react';
import { Play, AlertCircle } from 'lucide-react';

/**
 * Simple YouTube Embed Component
 * 
 * A reliable, lightweight YouTube embed component that works consistently
 * without complex dependencies or API calls
 */
export default function SimpleYouTubeEmbed({
  url,
  videoId,
  title = 'YouTube Video',
  autoPlay = false,
  showControls = true,
  className = '',
  width = '100%',
  height = '315'
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Extract video ID from URL or use provided videoId
  const extractedVideoId = useMemo(() => {
    if (videoId) return videoId;
    if (!url) return null;

    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }, [url, videoId]);

  if (!extractedVideoId) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Invalid YouTube URL</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Failed to load video</p>
          <button 
            onClick={() => {
              setHasError(false);
              setIsLoaded(false);
            }}
            className="text-blue-600 text-sm mt-2 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Build YouTube embed URL with parameters
  const embedUrl = useMemo(() => {
    const baseUrl = `https://www.youtube.com/embed/${extractedVideoId}`;
    const params = new URLSearchParams();
    
    if (autoPlay) params.set('autoplay', '1');
    if (!showControls) params.set('controls', '0');
    params.set('rel', '0'); // Don't show related videos
    params.set('modestbranding', '1'); // Minimal YouTube branding
    params.set('fs', '1'); // Allow fullscreen
    params.set('cc_load_policy', '1'); // Show captions by default
    params.set('iv_load_policy', '3'); // Hide annotations
    
    return `${baseUrl}?${params.toString()}`;
  }, [extractedVideoId, autoPlay, showControls]);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
            <p className="text-sm opacity-75">{title}</p>
            <p className="text-xs opacity-50 mt-1">Click to load video</p>
          </div>
        </div>
      )}
      
      <iframe
        src={isLoaded ? embedUrl : 'about:blank'}
        title={title}
        width={width}
        height={height}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        onClick={() => {
          if (!isLoaded) {
            setIsLoaded(true);
          }
        }}
        style={{
          aspectRatio: '16/9',
          minHeight: height
        }}
      />
      
      {!isLoaded && (
        <button
          onClick={() => setIsLoaded(true)}
          className="absolute inset-0 w-full h-full cursor-pointer z-20 bg-transparent"
          aria-label={`Load ${title}`}
        />
      )}
    </div>
  );
}
