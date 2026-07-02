'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    GraduationCap,
    LayoutDashboard,
    BookOpen,
    Sparkles,
    FilePlus,
    FolderOpen,
    BarChart3,
    MessageSquare,
    Network,
    Settings,
    User
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
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

export default function Sidebar() {
    const { user } = useUser();

    return (
        <aside
            className="hidden lg:flex flex-col fixed left-0 top-0 z-40 h-screen w-60 rounded-tr-[32px] rounded-br-[32px]"
            style={{
                background: 'linear-gradient(180deg, #111216 0%, #14141A 100%)'
            }}
        >
            {/* Brand Logo */}
            <div className="flex items-center gap-3 px-6 py-6">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]">
                        <GraduationCap size={22} strokeWidth={1.5} className="text-white" />
                    </div>
                    <span className="text-lg font-semibold text-white tracking-tight">
                        IntelliCourse
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                {/* Main Navigation */}
                <div className="space-y-1">
                    {mainItems.map((item) => (
                        <SidebarItem key={item.href} {...item} />
                    ))}
                </div>

                {/* Create Course Section */}
                <SidebarSection title="Create Course" items={createItems} />

                {/* Tools Section */}
                <SidebarSection title="Tools" items={toolsItems} />

                {/* Settings */}
                <div className="space-y-1">
                    {settingsItems.map((item) => (
                        <SidebarItem key={item.href} {...item} />
                    ))}
                </div>
            </nav>

            {/* User Section */}
            <div className="px-4 py-5">
                <div className="flex items-center gap-3 px-4 py-3 rounded-[20px] bg-[#1C1C24] transition-all duration-200 hover:bg-[#252530]">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-[#8B5CF6]/30 blur-md"></div>
                        <div className="relative">
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: 'h-10 w-10 ring-2 ring-[#8B5CF6]/50'
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.firstName || 'Account'}
                        </p>
                        <p className="text-xs text-[#7A7A7F] truncate">
                            Manage profile
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
