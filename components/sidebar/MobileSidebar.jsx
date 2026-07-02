'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Menu,
    X,
    GraduationCap,
    LayoutDashboard,
    BookOpen,
    Sparkles,
    FilePlus,
    FolderOpen,
    BarChart3,
    MessageSquare,
    Network,
    Settings
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';

const mainItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/courses', icon: BookOpen, label: 'My Courses' },
];

const createItems = [
    { href: '/create/ai', icon: Sparkles, label: 'AI Course' },
    { href: '/create/file', icon: FilePlus, label: 'From File / URL' },
];

const toolsItems = [
    { href: '/library', icon: FolderOpen, label: 'Library' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
    { href: '/graph', icon: Network, label: 'Knowledge Graph', badge: 'Pro' },
];

const settingsItems = [
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const closeMenu = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-sm"
                aria-label="Open menu"
            >
                <Menu size={20} strokeWidth={1.5} />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={closeMenu}
                />
            )}

            {/* Drawer */}
            <aside
                className={`lg:hidden fixed left-0 top-0 z-50 h-screen w-64 border-r border-white/5 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{ backgroundColor: 'rgba(23, 23, 34, 0.98)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-500">
                            <GraduationCap size={20} strokeWidth={1.5} className="text-white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">
                            IntelliCourse
                        </span>
                    </Link>
                    <button
                        onClick={closeMenu}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                    <div className="space-y-1" onClick={closeMenu}>
                        {mainItems.map((item) => (
                            <SidebarItem key={item.href} {...item} />
                        ))}
                    </div>
                    <div onClick={closeMenu}>
                        <SidebarSection title="Create Course" items={createItems} />
                    </div>
                    <div onClick={closeMenu}>
                        <SidebarSection title="Tools" items={toolsItems} />
                    </div>
                    <div className="space-y-1" onClick={closeMenu}>
                        {settingsItems.map((item) => (
                            <SidebarItem key={item.href} {...item} />
                        ))}
                    </div>
                </nav>

                {/* User Section */}
                <div className="px-4 py-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Account</p>
                            <p className="text-xs text-gray-500 truncate">Manage profile</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
