'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, BookOpen, Zap } from 'lucide-react';
import AnimatedHeadline from '@/components/AnimatedHeadline';

export default function LandingPage() {
    const rocketRef = useRef(null);
    const router = useRouter();
    const [isLaunching, setIsLaunching] = useState(false);

    const handleLaunch = () => {
        if (isLaunching) return;

        setIsLaunching(true);

        if (rocketRef.current) {
            rocketRef.current.classList.remove('animate-rocket-float');
            rocketRef.current.classList.add('animate-rocket-launch');
        }

        // Delay navigation until animation completes
        setTimeout(() => {
            router.push('/dashboard');
        }, 1100);
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Decorative Wave Lines */}
                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-30 pointer-events-none">
                    <svg viewBox="0 0 500 400" className="w-full h-full" preserveAspectRatio="none">
                        {[...Array(20)].map((_, i) => (
                            <path
                                key={i}
                                d={`M0,${200 + i * 8} Q125,${180 + i * 8 + Math.sin(i) * 20} 250,${200 + i * 8} T500,${200 + i * 8}`}
                                fill="none"
                                stroke="#60a5fa"
                                strokeWidth="1"
                                opacity={0.3 + (i * 0.03)}
                            />
                        ))}
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="relative z-10">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-blue-700">AI-Powered Course Generation</span>
                            </div>

                            {/* Animated Headline */}
                            <AnimatedHeadline />

                            {/* Subheading */}
                            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
                                IntelliCourse is an AI-powered course generator that creates comprehensive, structured learning experiences. Transform your ideas into professional courses with detailed outlines and curriculum in moments.
                            </p>

                            {/* CTA Button with Launch Effect */}
                            <button
                                onClick={handleLaunch}
                                disabled={isLaunching}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLaunching ? 'Launching...' : 'Go to Dashboard'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Right Content - Rocket */}
                        <div className="relative z-10 flex justify-center lg:justify-end">
                            <div className="relative w-80 h-80 lg:w-[420px] lg:h-[420px]">
                                {/* Rocket Image with Floating Animation */}
                                <img
                                    ref={rocketRef}
                                    src="/rocket.png"
                                    alt="Rocket"
                                    className="w-full h-full object-contain animate-rocket-float pointer-events-none select-none drop-shadow-2xl"
                                />

                                {/* Glow effect underneath rocket */}
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-16 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-[#0f0f17] mb-4">
                            Everything You Need to Create Courses
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Our AI-powered platform helps you create professional courses in minutes, not months.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
                                <Sparkles className="w-7 h-7 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#0f0f17] mb-3">AI-Powered Generation</h3>
                            <p className="text-gray-600">
                                Simply enter a topic and our AI creates comprehensive course outlines with modules, quizzes, and learning objectives.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center mb-6">
                                <BookOpen className="w-7 h-7 text-purple-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#0f0f17] mb-3">Structured Learning</h3>
                            <p className="text-gray-600">
                                Each course comes with well-organized modules, practical examples, best practices, and key takeaways.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                            <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center mb-6">
                                <Zap className="w-7 h-7 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#0f0f17] mb-3">Interactive Quizzes</h3>
                            <p className="text-gray-600">
                                Auto-generated quizzes help reinforce learning and track progress throughout each course.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-[#0f0f17] mb-6">
                        Ready to Create Your First Course?
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        Join thousands of educators and content creators who use IntelliCourse to build amazing learning experiences.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0f0f17] text-white font-semibold text-lg hover:bg-[#1c1c29] transition-colors"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-sm">
                            © 2024 IntelliCourse. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="#" className="text-gray-500 hover:text-gray-700 text-sm">Privacy</Link>
                            <Link href="#" className="text-gray-500 hover:text-gray-700 text-sm">Terms</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
