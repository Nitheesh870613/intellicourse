'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink } from 'lucide-react';
import { getYouTubeEmbedUrl, extractYouTubeVideoId } from '@/lib/utils/youtube';

export default function YouTubeVideo({ url, title, className = '' }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const embedUrl = getYouTubeEmbedUrl(url);
  const videoId = extractYouTubeVideoId(url);
  
  if (!embedUrl || !videoId) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center ${className}`}>
        <p className="text-gray-600 dark:text-gray-400">Invalid YouTube URL</p>
      </div>
    );
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <motion.div 
      className={`relative bg-black rounded-xl overflow-hidden shadow-2xl ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Video Container */}
      <div className="relative aspect-video bg-gray-900">
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Thumbnail */}
              <img
                src={thumbnailUrl}
                alt={title || 'YouTube Video'}
                className="w-full h-full object-cover"
                onError={() => setHasError(true)}
              />
              
              {/* Play Button Overlay */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center bg-black/30"
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLoaded(true)}
                >
                  <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        )}
        
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <p className="text-lg font-semibold mb-2">Video unavailable</p>
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Watch on YouTube</span>
              </a>
            </div>
          </div>
        )}
        
        {isLoaded && (
          <iframe
            src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1`}
            title={title || 'YouTube Video'}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      
      {/* Video Info */}
      {title && (
        <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors text-sm mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Watch on YouTube</span>
          </a>
        </div>
      )}
    </motion.div>
  );
}

