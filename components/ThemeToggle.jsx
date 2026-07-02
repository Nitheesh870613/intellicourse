'use client';

import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="relative p-2 rounded-xl bg-white/10 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/20 dark:border-neutral-700/50 hover:bg-white/20 dark:hover:bg-neutral-700/50 transition-all duration-300"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative w-6 h-6"
      >
        {theme === 'dark' ? (
          <Moon className="w-6 h-6 text-yellow-400" />
        ) : (
          <Sun className="w-6 h-6 text-orange-500" />
        )}
      </motion.div>
      
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: theme === 'dark' ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}








