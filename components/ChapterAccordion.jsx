'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChapterAccordion({ chapters = [] }) {
  const [expandedChapter, setExpandedChapter] = useState(null);

  const toggleChapter = (chapterId) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  };

  return (
    <div className="space-y-4">
      {chapters.map((chapter, index) => (
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
            <CardHeader 
              className="cursor-pointer p-6 hover:bg-gray-50 transition-colors"
              onClick={() => toggleChapter(chapter.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Chapter Number */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  
                  {/* Chapter Info */}
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 mb-2">
                      {chapter.title}
                    </CardTitle>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      Click to expand and view chapter content
                    </p>
                  </div>
                </div>
                
                {/* Expand Icon */}
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={{ rotate: expandedChapter === chapter.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </div>
              </div>
            </CardHeader>

            {/* Expandable Content */}
            <AnimatePresence>
              {expandedChapter === chapter.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <CardContent className="px-6 pb-6 pt-0">
                    <div className="space-y-6">
                      {/* Chapter Content with Markdown Support */}
                      {chapter.description && (
                        <div className="bg-white rounded-xl p-6 border border-gray-100 markdown-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-gray-900" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3 text-gray-800" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-700" {...props} />,
                              h4: ({node, ...props}) => <h4 className="text-base font-semibold mt-3 mb-2 text-gray-700" {...props} />,
                              p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-3" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-3 text-gray-700 ml-4" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-700 ml-4" {...props} />,
                              li: ({node, ...props}) => <li className="ml-2 leading-relaxed" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                              em: ({node, ...props}) => <em className="italic text-purple-600" {...props} />,
                              code: ({node, inline, ...props}) => 
                                inline ? (
                                  <code className="bg-purple-100 px-2 py-1 rounded text-purple-800 text-sm" {...props} />
                                ) : (
                                  <code className="block bg-gray-100 p-4 rounded-lg text-gray-800 text-sm overflow-x-auto my-3" {...props} />
                                ),
                              blockquote: ({node, ...props}) => (
                                <blockquote className="border-l-4 border-purple-400 pl-4 my-3 italic text-gray-600" {...props} />
                              ),
                              a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                              hr: ({node, ...props}) => <hr className="border-gray-300 my-4" {...props} />,
                            }}
                          >
                            {chapter.description}
                          </ReactMarkdown>
                        </div>
                      )}
                      
                      {/* Fallback for old content format */}
                      {!chapter.description && chapter.content && (
                        <div className="bg-white rounded-xl p-6 border border-gray-100">
                          <h2 className="text-xl font-bold mb-2">{chapter.title}</h2>
                          {(() => {
                            const points = Array.isArray(chapter.content)
                              ? chapter.content
                              : String(chapter.content)
                                  .split(/\n+/)
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                            return (
                              <ul className="list-disc ml-6 space-y-1">
                                {points.map((point, idx) => (
                                  <li key={idx}>{point}</li>
                                ))}
                              </ul>
                            );
                          })()}
                        </div>
                      )}

                      {/* YouTube Video */}
                      {(chapter.videoUrl || chapter.youtubeUrl) && (
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <Play className="w-5 h-5 text-purple-600" />
                            <span>Related Video</span>
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                              <iframe
                                src={getYouTubeEmbedUrl(chapter.videoUrl || chapter.youtubeUrl)}
                                title={`Chapter ${index + 1} Video`}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                            <a
                              href={chapter.videoUrl || chapter.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Watch on YouTube</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
