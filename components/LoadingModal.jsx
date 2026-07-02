'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles, Brain, Zap, X, Minimize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function LoadingModal({ isOpen, onOpenChange, onCancel, onBackground }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-white/15 bg-white/10 dark:bg-white/10 backdrop-blur-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm">
            AI is creating your course
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8">
          {/* Main Loading Animation */}
          <div className="relative mb-6">
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 360]
              }}
              transition={{
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 3, repeat: Infinity, ease: "linear" }
              }}
            >
              <Brain className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Orbiting Elements */}
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
              animate={{
                rotate: [0, -360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            
            <motion.div
              className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.3, 1]
              }}
              transition={{
                rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Zap className="w-3 h-3 text-white" />
            </motion.div>
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-3">
            <motion.p
              className="text-gray-700 text-lg font-medium"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Please wait...
            </motion.p>
            
            <motion.p
              className="text-gray-600 text-sm max-w-xs"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              Our AI is analyzing your requirements and creating the perfect course structure with engaging content and relevant videos.
            </motion.p>
          </div>

          {/* Progress Dots */}
          <div className="flex space-x-2 mt-6">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-3 h-3 bg-purple-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2
                }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 w-full">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-2 border-red-300 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-300 shadow-md hover:shadow-lg h-12 rounded-xl font-semibold"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={onBackground}
              variant="outline"
              className="flex-1 border-2 border-purple-300 bg-white hover:bg-purple-50 text-purple-600 hover:text-purple-700 transition-all duration-300 shadow-md hover:shadow-lg h-12 rounded-xl font-semibold"
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Wait in Background
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


