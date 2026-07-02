'use client';

import { motion } from 'framer-motion';

export default function SkeletonPreview() {
    const shimmer = {
        opacity: [0.4, 0.7, 0.4],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
    };

    return (
        <div className="w-full space-y-6">
            {/* Header skeleton */}
            <div className="p-5 rounded-xl bg-[#1C1C29] border border-white/5">
                <motion.div animate={shimmer} className="h-6 w-3/4 bg-white/10 rounded-lg mb-3" />
                <motion.div animate={shimmer} className="h-4 w-full bg-[#14151C] rounded mb-2" style={{ animationDelay: '0.1s' }} />
                <motion.div animate={shimmer} className="h-4 w-2/3 bg-[#14151C] rounded" style={{ animationDelay: '0.2s' }} />

                <div className="flex gap-2 mt-4">
                    <motion.div animate={shimmer} className="h-6 w-20 bg-[#14151C] rounded-lg" />
                    <motion.div animate={shimmer} className="h-6 w-24 bg-[#14151C] rounded-lg" />
                </div>
            </div>

            {/* Module list skeleton */}
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                        key={i}
                        animate={shimmer}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[#1C1C29] border border-white/5"
                        style={{ animationDelay: `${i * 0.1}s` }}
                    >
                        <div className="w-8 h-8 rounded-lg bg-white/10" />
                        <div className="flex-1">
                            <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
                            <div className="h-3 w-1/2 bg-white/5 rounded" />
                        </div>
                        <div className="w-4 h-4 rounded bg-white/5" />
                    </motion.div>
                ))}
            </div>

            {/* Button skeleton */}
            <motion.div animate={shimmer} className="h-14 w-full bg-[#14151C] rounded-xl" />
        </div>
    );
}
