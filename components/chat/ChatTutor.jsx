'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Sparkles, X, Minimize2, Maximize2, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatTutor({ courseId, courseTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch course info when chat opens
  useEffect(() => {
    if (isOpen && !courseInfo) {
      fetchCourseInfo();
    }
  }, [isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const fetchCourseInfo = async () => {
    try {
      const response = await fetch(`/api/chat/tutor?courseId=${courseId}`);
      const data = await response.json();
      if (data.success) {
        setCourseInfo(data);
        // Add welcome message
        setMessages([{
          role: 'assistant',
          content: `👋 Hi! I'm your AI tutor for **${data.course.title}**. I'm here to help you understand the course material. Feel free to ask me any questions about the ${data.course.moduleCount} modules in this course!`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch course info:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages)
      const conversationHistory = messages.slice(-10);

      const response = await fetch('/api/chat/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          message: inputMessage,
          conversationHistory
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "Can you summarize this course?",
    "What are the key topics covered?",
    "Explain [concept] in simpler terms",
    "What should I focus on first?"
  ];

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#9B6BFF] rounded-full shadow-lg shadow-[#9B6BFF]/20 flex items-center justify-center hover:bg-[#8A5AEE] transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <motion.div
          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0f0f17]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          height: isMinimized ? '56px' : '520px'
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
      >
        <div className="bg-[#1c1c29] border border-white/10 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#9B6BFF]/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#9B6BFF]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">AI Tutor</h3>
                  <p className="text-xs text-white/40 truncate max-w-[160px]">
                    {courseTitle || 'Course Assistant'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="p-4 h-[360px] overflow-y-auto bg-[#0f0f17]">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-[#9B6BFF]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Bot className="w-6 h-6 text-[#9B6BFF]" />
                      </div>
                      <p className="text-white/50 text-sm mb-4">
                        Ask me anything about this course!
                      </p>
                      <div className="space-y-2">
                        {suggestedQuestions.map((question, idx) => (
                          <button
                            key={idx}
                            onClick={() => setInputMessage(question)}
                            className="block w-full text-left px-3 py-2 text-xs text-white/60 bg-[#1c1c29] hover:bg-[#252535] rounded-lg border border-white/5 hover:border-[#9B6BFF]/30 transition-all"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                              ? 'bg-[#9B6BFF]'
                              : 'bg-[#9B6BFF]/20'
                            }`}>
                            {msg.role === 'user' ? (
                              <User className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Bot className="w-3.5 h-3.5 text-[#9B6BFF]" />
                            )}
                          </div>
                          <div className={`rounded-xl px-3 py-2 ${msg.role === 'user'
                              ? 'bg-[#9B6BFF] text-white'
                              : msg.isError
                                ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                                : 'bg-[#1c1c29] border border-white/10 text-white/80'
                            }`}>
                            <div className="text-sm prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                  strong: ({ node, ...props }) => <strong className="font-semibold text-[#9B6BFF]" {...props} />,
                                  code: ({ node, ...props }) => <code className="bg-black/30 px-1 py-0.5 rounded text-xs" {...props} />
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                            <p className="text-[10px] text-white/30 mt-1">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-2"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#9B6BFF]/20 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-[#9B6BFF]" />
                      </div>
                      <div className="bg-[#1c1c29] border border-white/10 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 text-[#9B6BFF] animate-spin" />
                          <span className="text-sm text-white/50">Thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/10 bg-[#1c1c29]">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1 bg-[#0f0f17] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#9B6BFF]/50 transition-colors"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="w-9 h-9 bg-[#9B6BFF] hover:bg-[#8A5AEE] disabled:opacity-50 disabled:hover:bg-[#9B6BFF] rounded-xl flex items-center justify-center transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-white/30 mt-2 text-center">
                  AI may make mistakes. Verify important information.
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
