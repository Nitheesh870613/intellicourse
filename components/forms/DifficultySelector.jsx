'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import { motion } from 'framer-motion';

const difficultyLevels = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'No prior knowledge required. Simple explanations with everyday examples.',
    icon: '🌱',
    color: 'from-green-500 to-emerald-500'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Some foundational knowledge assumed. Balanced technical depth.',
    icon: '📚',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Advanced concepts, edge cases, and deep technical implementation.',
    icon: '🎓',
    color: 'from-purple-500 to-pink-500'
  }
];

const personas = [
  {
    value: 'developer',
    label: 'Software Developer',
    description: 'Focus on code, implementation, and practical development',
    icon: '💻'
  },
  {
    value: 'student',
    label: 'Academic Student',
    description: 'Structured learning with clear objectives and assessments',
    icon: '📖'
  },
  {
    value: 'business',
    label: 'Business Professional',
    description: 'Emphasis on business value and practical applications',
    icon: '💼'
  },
  {
    value: 'researcher',
    label: 'Researcher',
    description: 'Theoretical foundations and cutting-edge developments',
    icon: '🔬'
  }
];

export default function DifficultySelector({ 
  difficulty, 
  onDifficultyChange, 
  persona, 
  onPersonaChange,
  showPersona = true 
}) {
  const selectedDifficulty = difficultyLevels.find(d => d.value === difficulty);
  const selectedPersona = personas.find(p => p.value === persona);

  return (
    <div className="space-y-6">
      {/* Difficulty Level Selection */}
      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-base sm:text-lg font-bold text-white bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
          Difficulty Level *
        </label>
        
        <Select value={difficulty} onValueChange={onDifficultyChange}>
          <SelectTrigger className="w-full h-14 text-base sm:text-lg border-2 border-white/20 bg-white/10 backdrop-blur-xl text-white hover:border-purple-400/50 transition-all duration-300 rounded-xl">
            <SelectValue placeholder="Select difficulty level">
              {selectedDifficulty && (
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{selectedDifficulty.icon}</span>
                  <span className="font-medium">{selectedDifficulty.label}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-br from-black/95 via-purple-900/90 to-blue-900/90 backdrop-blur-xl border border-white/30 text-white rounded-xl">
            {difficultyLevels.map((level) => (
              <SelectItem 
                key={level.value} 
                value={level.value}
                className="text-white hover:bg-purple-500/30 focus:bg-purple-500/30 transition-all duration-200 rounded-lg m-1 p-3 cursor-pointer"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl mt-1">{level.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-base">{level.label}</div>
                    <div className="text-xs text-white/70 mt-1">{level.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedDifficulty && (
          <motion.div 
            className="flex items-start space-x-2 p-3 bg-purple-500/10 rounded-lg border border-purple-400/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-white/80">{selectedDifficulty.description}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Persona Selection (Optional) */}
      {showPersona && (
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-base sm:text-lg font-bold text-white bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            Learning Persona (Optional)
          </label>
          
          <Select value={persona} onValueChange={onPersonaChange}>
            <SelectTrigger className="w-full h-14 text-base sm:text-lg border-2 border-white/20 bg-white/10 backdrop-blur-xl text-white hover:border-cyan-400/50 transition-all duration-300 rounded-xl">
              <SelectValue placeholder="Select your role (optional)">
                {selectedPersona && (
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{selectedPersona.icon}</span>
                    <span className="font-medium">{selectedPersona.label}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gradient-to-br from-black/95 via-cyan-900/90 to-purple-900/90 backdrop-blur-xl border border-white/30 text-white rounded-xl">
              <SelectItem 
                value=""
                className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 transition-all duration-200 rounded-lg m-1 p-3 cursor-pointer"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl mt-1">✨</span>
                  <div className="flex-1">
                    <div className="font-semibold text-base">General (Default)</div>
                    <div className="text-xs text-white/70 mt-1">Balanced approach for all learners</div>
                  </div>
                </div>
              </SelectItem>
              {personas.map((p) => (
                <SelectItem 
                  key={p.value} 
                  value={p.value}
                  className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 transition-all duration-200 rounded-lg m-1 p-3 cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl mt-1">{p.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-base">{p.label}</div>
                      <div className="text-xs text-white/70 mt-1">{p.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedPersona && (
            <motion.div 
              className="flex items-start space-x-2 p-3 bg-cyan-500/10 rounded-lg border border-cyan-400/30"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-white/80">{selectedPersona.description}</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
