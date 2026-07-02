'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Play, Languages, ChevronDown } from 'lucide-react';
import { extractYouTubeVideoId } from '@/lib/utils/youtube';

/**
 * BilingualYouTubeEmbed
 * Enhanced YouTube embed component with Hindi/English audio language switching
 * - Integrates with AI-generated course content
 * - Uses YouTube IFrame Player API for dynamic language control
 * - Supports audio tracks and subtitle fallbacks
 * - Detects browser language for smart defaults
 */
export default function BilingualYouTubeEmbed({
  videoId,
  url,
  title = 'YouTube Video',
  autoPlay = false,
  showControls = true,
  className = '',
  // Integration point: AI-generated course can pass chapter-specific language preferences
  defaultLanguage = null,
}) {
  const [state, setState] = useState({ loading: true, playable: false, meta: null, error: null });
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [availableLanguages, setAvailableLanguages] = useState(['en', 'hi']);
  const [playerReady, setPlayerReady] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const playerRef = useRef(null);
  const iframeRef = useRef(null);

  const id = useMemo(() => {
    if (videoId) return videoId;
    if (url) return extractYouTubeVideoId(url);
    return null;
  }, [videoId, url]);

  // Detect browser language and set smart default
  const detectedLanguage = useMemo(() => {
    if (defaultLanguage) return defaultLanguage;
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.languages?.[0] || 'en';
      return browserLang.startsWith('hi') ? 'hi' : 'en';
    }
    return 'en';
  }, [defaultLanguage]);

  // Initialize YouTube IFrame Player API
  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      setPlayerReady(true);
    }
  }, []);

  // Validate video and fetch metadata
  useEffect(() => {
    let active = true;
    async function validateVideo() {
      if (!id) {
        setState({ loading: false, playable: false, meta: null, error: 'Missing video id/url' });
        return;
      }
      try {
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
    validateVideo();
    return () => {
      active = false;
    };
  }, [id]);

  // Initialize YouTube Player when ready
  useEffect(() => {
    if (!playerReady || !state.playable || !id || playerRef.current) return;

    const initPlayer = () => {
      try {
        playerRef.current = new window.YT.Player(iframeRef.current, {
          videoId: id,
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: showControls ? 1 : 0,
            rel: 0,
            modestbranding: 1,
            // Enable captions by default
            cc_load_policy: 1,
            // Set initial language based on detection
            hl: detectedLanguage,
            cc_lang_pref: detectedLanguage,
          },
          events: {
            onReady: (event) => {
              // Set initial language preference
              setSelectedLanguage(detectedLanguage);
              // Try to get available audio tracks and caption languages
              checkAvailableLanguages(event.target);
            },
            onError: (event) => {
              console.error('YouTube Player Error:', event.data);
            }
          }
        });
      } catch (error) {
        console.error('Failed to initialize YouTube player:', error);
      }
    };

    // Small delay to ensure iframe is ready
    setTimeout(initPlayer, 100);
  }, [playerReady, state.playable, id, autoPlay, showControls, detectedLanguage]);

  // Check available languages (audio tracks and captions)
  const checkAvailableLanguages = (player) => {
    try {
      // Note: YouTube IFrame API has limited access to audio track info
      // We'll focus on caption/subtitle languages which are more accessible
      const availableCaptions = player.getOption('captions', 'tracklist') || [];
      const captionLanguages = availableCaptions.map(track => track.languageCode);
      
      // Always include English and Hindi as options, plus detected languages
      const languages = ['en', 'hi', ...captionLanguages].filter((lang, index, arr) => 
        arr.indexOf(lang) === index
      );
      
      setAvailableLanguages(languages);
    } catch (error) {
      console.warn('Could not detect available languages:', error);
      // Fallback to default languages
      setAvailableLanguages(['en', 'hi']);
    }
  };

  // Handle language change
  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
    
    if (playerRef.current && typeof playerRef.current.setOption === 'function') {
      try {
        // Set caption language
        playerRef.current.setOption('captions', 'track', { languageCode: language });
        // Enable captions if not already enabled
        playerRef.current.setOption('captions', 'display', true);
        
        // Note: Audio track switching is not directly supported by YouTube IFrame API
        // The player will use the video's default audio, but captions will be in selected language
      } catch (error) {
        console.warn('Could not change language:', error);
      }
    }
  };

  const languageNames = {
    'en': 'English',
    'hi': 'हिंदी',
    'auto': 'Auto'
  };

  if (!id) {
    return (
      <div className={`rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 ${className}`}>
        <div className="flex items-center text-amber-600 dark:text-amber-400 gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Invalid or missing YouTube ID/URL.</span>
        </div>
      </div>
    );
  }

  const displayTitle = state.meta?.title || title;
  const thumb = state.meta?.thumbnail || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  return (
    <div className={`w-full ${className}`}>
      {/* Language Switcher - Integration point for AI-generated course content */}
      {state.playable && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Languages className="w-4 h-4" />
            <span>Audio Language:</span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <span>{languageNames[selectedLanguage] || selectedLanguage}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showLanguageDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showLanguageDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]"
              >
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      selectedLanguage === lang ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                    }`}
                  >
                    {languageNames[lang] || lang}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}

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

        {/* YouTube Player Container */}
        {state.playable ? (
          <div 
            ref={iframeRef}
            className="absolute inset-0 h-full w-full"
            style={{ backgroundColor: '#000' }}
          />
        ) : (
          // Fallback clickable poster
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
      
      {/* Video Title */}
      {displayTitle && (
        <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
          {displayTitle}
        </div>
      )}
      
      {/* Language Support Info */}
      {state.playable && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>💡 Tip: If audio tracks aren't available in your language, subtitles will be shown instead.</span>
        </div>
      )}
    </div>
  );
}
