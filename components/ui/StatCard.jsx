"use client";

import { Card } from "./card";

export default function StatCard({ title, value, subtitle, icon, className = "" }) {
    return (
        <Card className={`flex items-center gap-4 ${className}`}>
            {icon && (
                <div className="w-12 h-12 rounded-xl bg-[rgba(155,107,255,0.1)] flex items-center justify-center text-[var(--accent-purple)]">
                    {icon}
                </div>
            )}
            <div>
                <div className="text-sm text-[var(--text-secondary)]">{title}</div>
                <div className="text-2xl font-semibold text-white mt-1">{value}</div>
                {subtitle && <div className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</div>}
            </div>
        </Card>
    );
}
