'use client';

import SidebarItem from './SidebarItem';

export default function SidebarSection({ title, items }) {
    return (
        <div className="space-y-1">
            {title && (
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#8D8D93]">
                    {title}
                </p>
            )}
            <div className="space-y-1">
                {items.map((item) => (
                    <SidebarItem key={item.href} {...item} />
                ))}
            </div>
        </div>
    );
}
