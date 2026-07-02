'use client';

import { motion } from 'framer-motion';

export default function DifficultyButtons({ value, onChange }) {
    const levels = [
        { id: 'beginner', label: 'Beginner', icon: '🌱' },
        { id: 'intermediate', label: 'Intermediate', icon: '📚' },
        { id: 'advanced', label: 'Advanced', icon: '🚀' },
    ];

    return (
        <div role="radiogroup" aria-label="Course difficulty" className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            {levels.map((level) => {
                const selected = value === level.id;
                return (
                    <motion.button
                        key={level.id}
                        onClick={() => onChange(level.id)}
                        role="radio"
                        aria-checked={selected}
                        tabIndex={0}
                        className={`flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all focus:outline-none ${selected
                            ? 'bg-[#14151C] border border-[#9B6BFF]/40 text-white'
                            : 'bg-[#14151C] border border-white/10 text-white/70 hover:border-white/20 hover:text-white active:border-white/30'
                            }`}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        animate={{
                            y: selected ? -2 : 0,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <span className="text-base sm:text-lg mr-1.5 sm:mr-2">{level.icon}</span>
                        {level.label}
                    </motion.button>
                );
            })}
        </div>
    );
}
