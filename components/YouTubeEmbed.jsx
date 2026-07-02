'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Play } from 'lucide-react';
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/lib/utils/youtube';

/**
 * YouTubeEmbed
 * - Accepts a YouTube video ID or URL
 * - Validates via server route to ensure the video is public and embeddable
 * - Renders a responsive iframe with autoplay/controls
 * - Displays a graceful fallback if the video is unavailable
 */
export default function YouTubeEmbed({
  videoId,
  url,
  title = 'YouTube Video',
  autoPlay = true,
  showControls = true,
  className = '',
}) {
  const [state, setState] = useState({ loading: true, playable: false, meta: null, error: null });
  const id = useMemo(() => {
    if (videoId) return videoId;
    if (url) return extractYouTubeVideoId(url);
    return null;
  }, [videoId, url]);

  const embedUrl = useMemo(() => (id ? `https://www.youtube.com/embed/${id}` : null), [id]);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!id) {
        setState({ loading: false, playable: false, meta: null, error: 'Missing video id/url' });
        return;
      }
      try {
        // Validate via server to avoid exposing API key and to ensure playability
        const res = await fetch(`/api/youtube/validate?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (!res.ok || !data?.ok) {
          setState({ loading: false, playable: false, meta: null, error: data?.error || 'Validation failed' });
          return;
        }
        setState({ loading: false, playable: Boolean(data.playable), meta: data, error: null });
      } catch (e) {
        if (!active) return;
        setState({ loading: false, playable: false, meta: null, error: 'Network error' });
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [id]);

  if (!id || !embedUrl) {
    return (
      <div className={`rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 ${className}`}>
        <div className="flex items-center text-amber-600 dark:text-amber-400 gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Invalid or missing YouTube ID/URL.</span>
        </div>
      </div>
    );
  }

  const autoplayParam = autoPlay ? '1' : '0';
  const controlsParam = showControls ? '1' : '0';

  // Prefer validated title/thumbnail if available
  const displayTitle = state.meta?.title || title;
  const thumb = state.meta?.thumbnail || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black">
        {/* Loading skeleton */}
        {state.loading && (
          <div className="absolute inset-0 animate-pulse bg-neutral-900/60 flex items-center justify-center">
            <div className="h-6 w-40 rounded bg-neutral-700" />
          </div>
        )}

        {/* Unavailable fallback */}
        {!state.loading && !state.playable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-900/80 text-white p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <div className="text-sm">
              Video unavailable or not embeddable.
            </div>
            <img src={thumb} alt={displayTitle} className="mt-1 max-h-40 rounded object-cover" />
          </div>
        )}

        {/* Playable iframe with optional click-to-play overlay */}
        {state.playable ? (
          <iframe
            src={`${embedUrl}?autoplay=${autoplayParam}&controls=${controlsParam}&rel=0&modestbranding=1`}
            title={displayTitle}
            className="absolute inset-0 h-full w-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          // Fallback clickable poster that attempts to open YouTube page
          <a
            href={`https://www.youtube.com/watch?v=${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0"
          >
            <motion.div className="group relative h-full w-full">
              <img src={thumb} alt={displayTitle} className="h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-full bg-red-600/90 p-4 text-white shadow-lg transition-transform group-hover:scale-105">
                  <Play className="h-6 w-6" />
                </div>
              </div>
            </motion.div>
          </a>
        )}
      </div>
      {displayTitle && (
        <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{displayTitle}</div>
      )}
    </div>
  );
}
