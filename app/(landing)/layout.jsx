import Link from 'next/link';

export default function LandingLayout({ children }) {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-xl font-bold text-[#0f0f17]">
                            IntelliCourse
                        </Link>
                        <div className="flex items-center gap-8">
                            <Link href="#features" className="text-gray-600 hover:text-[#0f0f17] transition-colors">
                                Features
                            </Link>
                            <Link href="/dashboard" className="text-gray-600 hover:text-[#0f0f17] transition-colors">
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-16">
                {children}
            </main>
        </div>
    );
}
