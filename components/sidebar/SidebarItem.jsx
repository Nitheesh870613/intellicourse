'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function SidebarItem({ href, icon: Icon, label, badge }) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname?.startsWith(href + '/');

    return (
        <Link
            href={href}
            className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-[20px] transition-all duration-200',
                isActive
                    ? 'bg-[#8B5CF6] text-white'
                    : 'text-[#8D8D93] hover:text-white hover:bg-[#8B5CF6]/10'
            )}
        >
            <Icon
                size={20}
                strokeWidth={1.5}
                className={cn(
                    'flex-shrink-0 transition-colors duration-200',
                    isActive ? 'text-white' : 'text-[#8D8D93]'
                )}
            />
            <span className="flex-1">{label}</span>
            {badge && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B5CF6] bg-[#8B5CF6]/15 px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </Link>
    );
}
