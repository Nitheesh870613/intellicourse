'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function ProgressBar({ active, progress }) {
    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#14151C]"
                    aria-hidden={!active}
                >
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'easeOut', duration: 0.4 }}
                        className="h-full bg-[#9B6BFF] shadow-[0_0_20px_rgba(155,107,255,0.5)]"
                    />

                    {/* Pulse effect at the end */}
                    <motion.div
                        animate={{
                            opacity: [0.3, 0.8, 0.3]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute top-0 h-full w-4 bg-[#9B6BFF] rounded-r"
                        style={{ left: `${Math.max(0, progress - 2)}%` }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
