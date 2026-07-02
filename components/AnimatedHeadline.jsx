"use client";

import { useState, useEffect } from 'react';

const topics = [
    "Web Development",
    "AI",
    "Python",
    "Data Science",
    "Machine Learning",
    "Health & Fitness",
    "Cloud Computing"
];

export default function AnimatedHeadline() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animationState, setAnimationState] = useState('visible'); // 'visible', 'exiting', 'entering'

    useEffect(() => {
        const interval = setInterval(() => {
            // Start exit animation
            setAnimationState('exiting');

            // After exit animation, change text and start enter animation
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % topics.length);
                setAnimationState('entering');

                // After a brief moment, set to visible for smooth entrance
                setTimeout(() => {
                    setAnimationState('visible');
                }, 50);
            }, 400);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    const getAnimationStyles = () => {
        switch (animationState) {
            case 'exiting':
                return {
                    opacity: 0,
                    transform: 'translateY(-20px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                };
            case 'entering':
                return {
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'none'
                };
            case 'visible':
            default:
                return {
                    opacity: 1,
                    transform: 'translateY(0)',
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                };
        }
    };

    return (
        <h1 className="text-5xl lg:text-6xl font-bold text-[#0f0f17] leading-tight mb-6">
            Create Amazing<br />
            <span
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500"
                style={getAnimationStyles()}
            >
                {topics[currentIndex]}
            </span>
            <br />
            Courses
        </h1>
    );
}
